import { describe, expect, it } from 'vitest';
import { layerMix, RATE_MAX, RATE_MIN, type EngineLayer } from './engineLayers';
import layersJson from '../../data/engineLayers.json';
import { listCars } from '../../data/cars';

const layers: EngineLayer[] = [
  { file: 'a', rpm: 1000 },
  { file: 'b', rpm: 2000 },
  { file: 'c', rpm: 4000 },
];

describe('layerMix', () => {
  it('boş katman listesinde boş', () => {
    expect(layerMix([], 3000)).toEqual([]);
  });
  it('en düşük katmanın altında yalnız o çalar; hız devirle orantılı ve sınırlı', () => {
    const [m] = layerMix(layers, 800);
    expect(m).toEqual({ index: 0, gain: 1, rate: 0.8 });
    expect(layerMix(layers, 100)[0]?.rate).toBe(RATE_MIN);
  });
  it('en yüksek katmanın üstünde yalnız o çalar, hız sınırlanır', () => {
    const [m] = layerMix(layers, 5000);
    expect(m?.index).toBe(2);
    expect(m?.rate).toBeCloseTo(1.25);
    expect(layerMix(layers, 20000)[0]?.rate).toBe(RATE_MAX);
  });
  it('iki katman arasında eşit güçle karışır (gain² toplamı 1)', () => {
    const mix = layerMix(layers, 3000);
    expect(mix.map((m) => m.index)).toEqual([1, 2]);
    const power = mix.reduce((s, m) => s + m.gain ** 2, 0);
    expect(power).toBeCloseTo(1);
    expect(mix[0]?.rate).toBeCloseTo(1.5);
    expect(mix[1]?.rate).toBeCloseTo(0.75);
  });
  it('tam katman devrinde yalnız o katman (gain 1)', () => {
    const mix = layerMix(layers, 2000);
    const total = mix.reduce((s, m) => s + m.gain ** 2, 0);
    expect(total).toBeCloseTo(1);
    expect(mix.find((m) => m.index === 1)?.gain).toBeCloseTo(1);
  });
});

describe('araç motor katmanları', () => {
  const byCar = layersJson as Record<string, EngineLayer[]>;
  it('her araç için en az iki, devire göre artan katman var', () => {
    for (const c of listCars()) {
      const l = byCar[c.manifest.id] ?? [];
      expect(l.length, c.manifest.id).toBeGreaterThanOrEqual(2);
      expect(
        l.map((x) => x.rpm),
        c.manifest.id,
      ).toEqual([...l.map((x) => x.rpm)].sort((a, b) => a - b));
    }
  });
});

describe('motor kaydı dosyaları', () => {
  it('her katmanın WAV dosyası public/assets/audio altında var ve geçerli', async () => {
    const { existsSync, readFileSync } = await import('node:fs');
    const byCar = layersJson as Record<string, EngineLayer[]>;
    for (const [carId, list] of Object.entries(byCar))
      for (const layer of list) {
        const url = new URL(`../../../public/assets/audio/${carId}/${layer.file}`, import.meta.url);
        expect(existsSync(url), layer.file).toBe(true);
        const head = readFileSync(url).subarray(0, 12).toString('latin1');
        expect(head.startsWith('RIFF') && head.endsWith('WAVE'), layer.file).toBe(true);
      }
  });
});
