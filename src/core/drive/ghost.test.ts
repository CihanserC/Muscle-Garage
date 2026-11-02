import { describe, expect, it } from 'vitest';
import {
  compactGhost,
  GHOST_DT,
  ghostPose,
  recordGhost,
  sanitizeGhost,
  type Ghost,
  type GhostSample,
} from './ghost';

describe('ghost kaydı', () => {
  it('sabit aralıkla örnek alır (kare hızından bağımsız)', () => {
    const buf: GhostSample[] = [];
    for (let i = 0; i <= 144; i++) recordGhost(buf, i / 144, i, 0, 0);
    expect(buf.length).toBe(Math.floor(1 / GHOST_DT) + 1);
  });
  it('geç gelen kare atlanan örnekleri doldurur', () => {
    const buf: GhostSample[] = [];
    recordGhost(buf, 0, 0, 0, 0);
    recordGhost(buf, 0.26, 5, 0, 0);
    expect(buf.length).toBe(6);
  });
});

describe('ghostPose', () => {
  const ghost: Ghost = {
    lapTime: 1,
    samples: [
      [0, 0, 0],
      [10, 0, 0],
      [10, 10, Math.PI - 0.1],
      [10, 10, -Math.PI + 0.1],
    ],
  };
  it('örnekler arası doğrusal ara değer', () => {
    const p = ghostPose(ghost, GHOST_DT * 0.5);
    expect(p?.[0]).toBeCloseTo(5);
  });
  it('yön en kısa yoldan ara değer alır (±π sınırı)', () => {
    const p = ghostPose(ghost, GHOST_DT * 2.5);
    expect(Math.abs(Math.abs(p?.[2] ?? 0) - Math.PI)).toBeLessThan(0.11);
  });
  it('tur süresinden sonra ya da negatif zamanda null', () => {
    expect(ghostPose(ghost, -1)).toBeNull();
    expect(ghostPose(ghost, 5)).toBeNull();
    expect(ghostPose({ lapTime: 1, samples: [] }, 0)).toBeNull();
  });
});

describe('saklama', () => {
  it('yuvarlar ve doğrular', () => {
    const g = compactGhost({ lapTime: 12.34567, samples: [[1.23456, 2.34567, 0.123456]] });
    expect(g.lapTime).toBe(12.346);
    expect(g.samples[0]).toEqual([1.23, 2.35, 0.123]);
    expect(
      sanitizeGhost({
        lapTime: 10,
        samples: [
          [0, 0, 0],
          [1, 1, 0],
        ],
      }),
    ).not.toBeNull();
  });
  it('bozuk veriyi reddeder', () => {
    expect(sanitizeGhost(null)).toBeNull();
    expect(
      sanitizeGhost({
        lapTime: -1,
        samples: [
          [0, 0, 0],
          [1, 1, 0],
        ],
      }),
    ).toBeNull();
    expect(sanitizeGhost({ lapTime: 5, samples: [[0, 0]] })).toBeNull();
    expect(
      sanitizeGhost({
        lapTime: 5,
        samples: [
          [0, 0, 'x'],
          [1, 1, 0],
        ],
      }),
    ).toBeNull();
  });
});
