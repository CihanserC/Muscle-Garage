import type { Track } from './track';
import { loopDelta } from './track';

export type LapState = {
  /** Başlangıç çizgisi geçildi mi (süre akıyor mu) */
  running: boolean;
  lapStartTime: number;
  /** Bu turda geçilen kontrol noktası sayısı (sırayla) */
  checkpoints: number;
  /** Önceki güncellemedeki başlangıçtan uzaklık (m, işaretli) */
  lastRel: number;
  laps: number;
  lastLap: number | null;
  bestLap: number | null;
  /** Kısayol/geri gitme ile geçersiz sayılan tur */
  invalid: boolean;
};

export const initialLap = (): LapState => ({
  running: false,
  lapStartTime: 0,
  checkpoints: 0,
  lastRel: 0,
  laps: 0,
  lastLap: null,
  bestLap: null,
  invalid: false,
});

/**
 * Tur zamanlayıcı. Kontrol noktaları sırayla geçilmeli; çizgiyi geri geçmek turu geçersiz yapar.
 * time: saniye (simülasyon saati), s: araç yay uzunluğu.
 */
export function updateLap(state: LapState, track: Track, s: number, time: number): LapState {
  const startS = track.samples[track.startIndex]?.s ?? 0;
  const rel = loopDelta(track, startS, s);
  const prev = state.lastRel;
  let next = state.running ? { ...state } : { ...state };
  next.lastRel = rel;

  // Çizgiyi ileri geçiş: önceki <0, şimdiki >=0
  const crossedForward = prev < 0 && rel >= 0 && rel - prev < track.length / 4;
  const crossedBackward = prev >= 0 && rel < 0 && prev - rel < track.length / 4;

  if (state.running) {
    const fractions = track.config.checkpointFractions;
    const progress = ((rel % track.length) + track.length) % track.length;
    const gate = fractions[state.checkpoints];
    if (
      gate !== undefined &&
      progress >= gate * track.length &&
      progress < (gate + 0.2) * track.length
    )
      next.checkpoints = state.checkpoints + 1;
    if (crossedBackward) next = { ...next, invalid: true };
  }

  if (crossedForward) {
    if (!state.running) {
      next = { ...next, running: true, lapStartTime: time, checkpoints: 0, invalid: false };
    } else {
      const complete = next.checkpoints >= track.config.checkpointFractions.length && !next.invalid;
      if (complete) {
        const lapTime = time - state.lapStartTime;
        next = {
          ...next,
          laps: state.laps + 1,
          lastLap: lapTime,
          bestLap: state.bestLap === null ? lapTime : Math.min(state.bestLap, lapTime),
        };
      }
      next = { ...next, lapStartTime: time, checkpoints: 0, invalid: false };
    }
  }
  return next;
}

/** m:ss.mmm biçimi */
/** Tur süresi `d:ss.cc` (salise: yüzde bir saniye, aşağı yuvarlanır — yarış saatleri gibi). */
export function formatLapTime(seconds: number | null): string {
  if (seconds === null) return '-:--.--';
  const cs = Math.floor(seconds * 100 + 1e-6);
  const m = Math.floor(cs / 6000);
  const s = Math.floor((cs % 6000) / 100);
  return `${m}:${String(s).padStart(2, '0')}.${String(cs % 100).padStart(2, '0')}`;
}

/** Tur ilerlemesi bu kadar dilime bölünür; her dilimin geçiş süresi saklanır (en iyi tura fark için). */
export const SPLIT_BINS = 100;

/** Bir turun dilim geçiş süreleri (sn); henüz geçilmemiş dilim null. */
export type LapSplits = (number | null)[];

export const emptySplits = (): LapSplits => Array.from({ length: SPLIT_BINS }, () => null);

/** Tur ilerleme oranı 0..1 (başlangıç çizgisinden; `lastRel` işaretli uzaklıktır). */
export function lapFraction(rel: number, trackLength: number): number {
  return (((rel % trackLength) + trackLength) % trackLength) / trackLength;
}

/**
 * Turun şimdiye kadar geçilen dilimlerinin süresini yazar (atlanan dilimler de bu süreyle dolar).
 * `elapsed`: turun başından beri geçen süre.
 */
export function recordSplit(splits: LapSplits, fraction: number, elapsed: number): void {
  const bin = Math.min(SPLIT_BINS - 1, Math.floor(fraction * SPLIT_BINS));
  for (let i = 0; i <= bin; i++) if (splits[i] === null) splits[i] = elapsed;
}

/**
 * En iyi tura göre fark (sn): pozitif = en iyi turdan yavaş. Kayıtlı en iyi tur ya da o dilim
 * yoksa null.
 */
export function lapDelta(
  best: LapSplits | null,
  fraction: number,
  elapsed: number,
): number | null {
  if (!best) return null;
  const bin = Math.min(SPLIT_BINS - 1, Math.floor(fraction * SPLIT_BINS));
  const ref = best[bin];
  return ref === null || ref === undefined ? null : elapsed - ref;
}

/** Fark metni: `+0.42` / `-1.07` */
export function formatDelta(delta: number): string {
  return `${delta >= 0 ? '+' : '-'}${Math.abs(delta).toFixed(2)}`;
}
