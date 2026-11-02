import { describe, expect, it } from 'vitest';
import {
  DRIFT_MAX_BETA,
  DRIFT_MIN_SPEED,
  driftAlignRate,
  driftTargetBeta,
  driftYawTarget,
  isDrifting,
} from './drift';

describe('drift', () => {
  it('yalnız el freni + hız + direksiyon birlikteyken açık', () => {
    expect(isDrifting(true, 0.8, 20)).toBe(true);
    expect(isDrifting(false, 0.8, 20)).toBe(false);
    expect(isDrifting(true, 0.8, DRIFT_MIN_SPEED - 1)).toBe(false);
    expect(isDrifting(true, 0.05, 20)).toBe(false);
  });
  it('hedef kayma açısı direksiyonla aynı işaretli ve sınırlı', () => {
    expect(driftTargetBeta(1)).toBeCloseTo(DRIFT_MAX_BETA);
    expect(driftTargetBeta(-1)).toBeCloseTo(-DRIFT_MAX_BETA);
    expect(driftTargetBeta(5)).toBeCloseTo(DRIFT_MAX_BETA);
  });
  it('kayma açısı hedefin altındaysa daha çok döndürür, üstündeyse geri tutar', () => {
    const below = driftYawTarget(1, 0, 20, 22);
    const above = driftYawTarget(1, DRIFT_MAX_BETA + 0.3, 20, 22);
    expect(below).toBeGreaterThan(above);
  });
  it('hedefi aşınca hizalama artar (fırıldak olmasın)', () => {
    expect(driftAlignRate(1, DRIFT_MAX_BETA * 1.5)).toBeGreaterThan(driftAlignRate(1, 0.2));
  });
});
