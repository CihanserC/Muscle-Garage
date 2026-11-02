import { describe, expect, it } from 'vitest';
import { IMPACT_SPEED_DROP, rumbleLevels } from './rumble';

describe('rumbleLevels', () => {
  const calm = { slip: 0, nitro: false, speedDrop: 0 };
  it('sakin sürüşte titreşim yok', () => {
    expect(rumbleLevels(calm)).toEqual({ strong: 0, weak: 0 });
  });
  it('çarpma (ani hız kaybı) ağır motoru çalıştırır, büyüdükçe artar ve 1 ile sınırlı', () => {
    const small = rumbleLevels({ ...calm, speedDrop: IMPACT_SPEED_DROP + 0.5 }).strong;
    const big = rumbleLevels({ ...calm, speedDrop: 20 }).strong;
    expect(small).toBeGreaterThan(0.5);
    expect(big).toBeGreaterThan(small);
    expect(big).toBeLessThanOrEqual(1);
    expect(rumbleLevels({ ...calm, speedDrop: IMPACT_SPEED_DROP }).strong).toBe(0);
  });
  it('kayma hafif motoru, eşiğin üstünde ve sınırlı olarak çalıştırır', () => {
    expect(rumbleLevels({ ...calm, slip: 0.25 }).weak).toBe(0);
    const w = rumbleLevels({ ...calm, slip: 1 }).weak;
    expect(w).toBeGreaterThan(0);
    expect(w).toBeLessThanOrEqual(0.55);
  });
  it('nitro hafif titreşim verir ama kaymayı geçmez', () => {
    expect(rumbleLevels({ ...calm, nitro: true }).weak).toBeCloseTo(0.3);
    expect(rumbleLevels({ ...calm, nitro: true, slip: 1 }).weak).toBeGreaterThanOrEqual(0.3);
  });
});
