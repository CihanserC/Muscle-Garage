/** Egzoz tipine göre ses karakteri (§5.2: egzoz sesi tonunu etkiler). */
export const EXHAUST_VOICE: Record<
  string,
  { cutoff: number; gain: number; rumble: number; raspy: number }
> = {
  rear_dual: { cutoff: 1, gain: 1, rumble: 0.5, raspy: 0.35 },
  side_pipes: { cutoff: 1.7, gain: 1.25, rumble: 0.4, raspy: 0.8 },
  quad: { cutoff: 0.85, gain: 1.15, rumble: 0.9, raspy: 0.3 },
};

const DEFAULT_VOICE = { cutoff: 1, gain: 1, rumble: 0.5, raspy: 0.35 };

export type AudioFrame = {
  rpm: number;
  throttle: number;
  speed: number;
  /** 0..1 lastik kayması */
  slip: number;
  supercharged: boolean;
  /** 0..1 ana ses seviyesi (0 = sessiz) */
  volume: number;
  paused: boolean;
  /** Gaz bırakıldı: egzoz patlamaları (kısa süre true) */
  liftOff?: boolean;
};

const TWO_PI_SMOOTH = 0.04;
/** V8: devir başına 4 ateşleme */
const FIRINGS_PER_REV = 4;
const MASTER_GAIN = 0.55;

function distortionCurve(amount: number): Float32Array<ArrayBuffer> {
  const n = 512;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = ((1 + amount) * x) / (1 + amount * Math.abs(x));
  }
  return curve;
}

/**
 * V8 ateşleme dalgası: temel + zengin harmonikler (alçak harmonikler baskın, çift harmonikler biraz
 * öne çıkar). Testere/kare dalgadan daha dolgun ve "yuvarlak" duyulur.
 */
export function v8Harmonics(count: number): { real: Float32Array; imag: Float32Array } {
  const real = new Float32Array(count + 1);
  const imag = new Float32Array(count + 1);
  for (let k = 1; k <= count; k++) imag[k] = (1 / Math.pow(k, 1.15)) * (k % 2 === 0 ? 1.18 : 1);
  return { real, imag };
}

/** Rölantide belirgin, devir arttıkça kaybolan düzensiz ateşleme (lope) derinliği 0..1 */
export const lopeDepth = (rpm: number): number => 0.38 * Math.max(0, 1 - rpm / 3500);

/** Gaz kapamada patlama olasılığı: yüksek devirde daha sık */
export const popChance = (rpm: number): number => Math.min(0.9, Math.max(0, (rpm - 2500) / 4500));

function noiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

/**
 * Web Audio ile sentezlenmiş motor, süperşarjör, lastik ve rüzgar sesi (gerçek ses dosyaları
 * gelene kadar yer tutucu). Tarayıcı izin verene kadar sessiz kalır.
 */
export class EngineAudio {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private oscA!: OscillatorNode;
  private oscB!: OscillatorNode;
  private oscRumble!: OscillatorNode;
  private oscWhine!: OscillatorNode;
  private engineFilter!: BiquadFilterNode;
  private lope!: GainNode;
  private lopeLfo!: OscillatorNode;
  private lopeDepthGain!: GainNode;
  private lastPop = 0;
  private wasLifting = false;
  private popNoise: AudioBuffer | null = null;
  private engineGain!: GainNode;
  private rumbleGain!: GainNode;
  private rasp!: GainNode;
  private whineGain!: GainNode;
  private squealFilter!: BiquadFilterNode;
  private squealGain!: GainNode;
  private windGain!: GainNode;
  private sources: AudioScheduledSourceNode[] = [];

  constructor(private readonly exhaust: string) {}

  /** Kullanıcı etkileşiminden sonra çağır (autoplay politikası). */
  start(): void {
    if (this.ctx || typeof AudioContext === 'undefined') return;
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    const voice = EXHAUST_VOICE[this.exhaust] ?? DEFAULT_VOICE;
    this.engineFilter = ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.Q.value = 1.4;
    const shaper = ctx.createWaveShaper();
    shaper.curve = distortionCurve(8 + voice.raspy * 18);
    shaper.oversample = '2x';
    this.engineGain = ctx.createGain();
    this.engineGain.gain.value = 0;

    const wave = v8Harmonics(28);
    const wave2 = v8Harmonics(10);
    this.oscA = ctx.createOscillator();
    this.oscA.setPeriodicWave(ctx.createPeriodicWave(wave.real, wave.imag));
    this.oscB = ctx.createOscillator();
    this.oscB.setPeriodicWave(ctx.createPeriodicWave(wave2.real, wave2.imag));
    this.oscRumble = ctx.createOscillator();
    this.oscRumble.type = 'triangle';
    const gainA = ctx.createGain();
    gainA.gain.value = 0.55;
    const gainB = ctx.createGain();
    gainB.gain.value = 0.3;
    this.rumbleGain = ctx.createGain();
    this.rumbleGain.gain.value = 0.5 * voice.rumble;
    this.oscA.connect(gainA).connect(shaper);
    this.oscB.connect(gainB).connect(shaper);
    this.oscRumble.connect(this.rumbleGain).connect(this.engineFilter);
    shaper.connect(this.engineFilter);
    // Lope: ateşleme düzensizliği, rölantide genlik dalgalanması
    this.lope = ctx.createGain();
    this.lope.gain.value = 1;
    this.lopeLfo = ctx.createOscillator();
    this.lopeLfo.type = 'sine';
    this.lopeDepthGain = ctx.createGain();
    this.lopeDepthGain.gain.value = 0;
    this.lopeLfo.connect(this.lopeDepthGain).connect(this.lope.gain);
    this.engineFilter.connect(this.lope).connect(this.engineGain).connect(this.master);
    this.popNoise = noiseBuffer(ctx, 0.2);

    // Egzoz hırıltısı: gürültü, gaz ve rpm ile artar
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(ctx, 2);
    noise.loop = true;
    const raspFilter = ctx.createBiquadFilter();
    raspFilter.type = 'bandpass';
    raspFilter.frequency.value = 900;
    raspFilter.Q.value = 0.8;
    this.rasp = ctx.createGain();
    this.rasp.gain.value = 0;
    noise.connect(raspFilter).connect(this.rasp).connect(this.master);

    // Süperşarjör uğultusu
    this.oscWhine = ctx.createOscillator();
    this.oscWhine.type = 'sine';
    this.whineGain = ctx.createGain();
    this.whineGain.gain.value = 0;
    this.oscWhine.connect(this.whineGain).connect(this.master);

    // Lastik çığlığı
    const squeal = ctx.createBufferSource();
    squeal.buffer = noiseBuffer(ctx, 2);
    squeal.loop = true;
    this.squealFilter = ctx.createBiquadFilter();
    this.squealFilter.type = 'bandpass';
    this.squealFilter.Q.value = 9;
    this.squealGain = ctx.createGain();
    this.squealGain.gain.value = 0;
    squeal.connect(this.squealFilter).connect(this.squealGain).connect(this.master);

    // Rüzgar / yol gürültüsü
    const wind = ctx.createBufferSource();
    wind.buffer = noiseBuffer(ctx, 2);
    wind.loop = true;
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 500;
    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0;
    wind.connect(windFilter).connect(this.windGain).connect(this.master);

    this.sources = [
      this.oscA,
      this.oscB,
      this.oscRumble,
      this.oscWhine,
      this.lopeLfo,
      noise,
      squeal,
      wind,
    ];
    for (const s of this.sources) s.start();
  }

  /** Tarayıcı AudioContext'i askıya aldıysa kullanıcı etkileşiminde sürdür. */
  resume(): void {
    if (this.ctx?.state === 'suspended') void this.ctx.resume();
  }

  update(f: AudioFrame): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const voice = EXHAUST_VOICE[this.exhaust] ?? DEFAULT_VOICE;
    const silent = f.volume <= 0 || f.paused;
    const set = (p: AudioParam, v: number) => p.setTargetAtTime(v, t, TWO_PI_SMOOTH);

    set(this.master.gain, silent ? 0 : MASTER_GAIN * f.volume);
    const fire = (Math.max(f.rpm, 600) / 60) * FIRINGS_PER_REV;
    set(this.oscA.frequency, fire);
    set(this.oscB.frequency, fire / 2);
    set(this.oscRumble.frequency, fire / 4);
    set(this.lopeLfo.frequency, fire / 8);
    set(this.lopeDepthGain.gain, lopeDepth(f.rpm));
    if (f.liftOff && !this.wasLifting) this.pop(ctx, f.rpm);
    this.wasLifting = !!f.liftOff;
    const load = 0.35 + f.throttle * 0.65;
    set(this.engineFilter.frequency, (320 + f.rpm * 0.28 + f.throttle * 700) * voice.cutoff);
    set(this.engineGain.gain, (0.07 + load * 0.2) * voice.gain);
    set(this.rasp.gain, f.throttle * 0.05 * voice.raspy * Math.min(1, f.rpm / 4000));
    set(this.whineGain.gain, f.supercharged ? 0.012 + f.throttle * 0.035 : 0);
    set(this.oscWhine.frequency, 380 + f.rpm * 0.55);
    set(this.squealFilter.frequency, 1100 + f.slip * 700 + f.speed * 6);
    set(this.squealGain.gain, f.slip > 0.25 ? Math.min(1, f.slip) * 0.16 : 0);
    set(this.windGain.gain, Math.min(1, f.speed / 70) * 0.1);
  }

  /** Gaz kapama patlaması: kısa, alçak geçişli gürültü darbesi (en çok 4/sn). */
  private pop(ctx: AudioContext, rpm: number): void {
    const now = ctx.currentTime;
    if (!this.popNoise || now - this.lastPop < 0.25 || Math.random() > popChance(rpm)) return;
    this.lastPop = now;
    const burst = ctx.createBufferSource();
    burst.buffer = this.popNoise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 160 + Math.random() * 240;
    filter.Q.value = 0.9;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5 + Math.random() * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    burst.connect(filter).connect(gain).connect(this.master);
    burst.start(now);
    burst.stop(now + 0.2);
  }

  stop(): void {
    for (const s of this.sources) {
      try {
        s.stop();
      } catch {
        // zaten durmuş olabilir
      }
    }
    this.sources = [];
    void this.ctx?.close();
    this.ctx = null;
  }
}
