import { describe, expect, it } from 'vitest';
import { CABIN, cabinParts, dashGeometry, triangleCount, wheelParts } from './cabinGeometry';

/** Plan V2 §2.6: iç mekân üçgen bütçesi */
const TRIANGLE_BUDGET = 40_000;

describe('Vanta iç mekân geometrisi', () => {
  const parts = cabinParts();
  const total =
    parts.reduce((n, p) => n + triangleCount(p.geometry), 0) +
    wheelParts().reduce((n, p) => n + triangleCount(p.geometry), 0);

  it('üçgen bütçesinin altında', () => {
    expect(total).toBeGreaterThan(500);
    expect(total).toBeLessThan(TRIANGLE_BUDGET);
  });

  it('plandaki tüm öğeler var', () => {
    const keys = parts.map((p) => p.key);
    for (const needle of [
      'dash',
      'binnacle',
      'vent-0',
      'console',
      'shifter-stick',
      'shifter-knob',
      'handbrake',
      'driver-cushion',
      'driver-back',
      'driver-head',
      'bench',
      'door-1',
      'door--1',
      'armrest-1',
      'handle-1',
      'crank-1',
      'headliner',
      'mirror',
      'pedal-0',
      'pedal-2',
      'floor',
    ])
      expect(keys, needle).toContain(needle);
  });

  it('parçalar kabin içinde kalır (yanal ve yükseklik)', () => {
    // Torpido geometrisi mutlak koordinatlıdır (orijin 0)
    for (const p of parts.filter((q) => q.key !== 'dash')) {
      expect(Math.abs(p.position[0]), p.key).toBeLessThanOrEqual(CABIN.halfWidth);
      expect(p.position[1], p.key).toBeGreaterThan(CABIN.floorY - 0.01);
      expect(p.position[1], p.key).toBeLessThan(CABIN.roofY + 0.05);
    }
  });

  it('torpido genişliği x ekseninde, sonlu ve simetrik', () => {
    const g = dashGeometry();
    g.computeBoundingBox();
    const b = g.boundingBox;
    expect(b).not.toBeNull();
    if (!b) return;
    expect(b.max.x).toBeCloseTo(-b.min.x, 1);
    expect(b.max.x).toBeGreaterThan(CABIN.dashHalfWidth - 0.01);
    expect(Number.isFinite(b.max.z - b.min.z)).toBe(true);
  });
});
