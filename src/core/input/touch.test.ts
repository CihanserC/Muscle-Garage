import { describe, expect, it } from 'vitest';
import { steerFromPointer } from './touch';

describe('steerFromPointer', () => {
  it('ortada düz', () => {
    expect(steerFromPointer(150, 100, 100)).toBe(0);
  });
  it('sol kenar tam sola (+1), sağ kenar tam sağa (-1)', () => {
    expect(steerFromPointer(100, 100, 100)).toBe(1);
    expect(steerFromPointer(200, 100, 100)).toBe(-1);
  });
  it('bölge dışındaki konum sınırlanır', () => {
    expect(steerFromPointer(-500, 100, 100)).toBe(1);
    expect(steerFromPointer(900, 100, 100)).toBe(-1);
  });
  it('ölü bölgeden sonra kademeli artar', () => {
    const a = steerFromPointer(130, 100, 100);
    const b = steerFromPointer(110, 100, 100);
    expect(a).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(a);
  });
  it('genişlik 0 ise 0', () => {
    expect(steerFromPointer(10, 0, 0)).toBe(0);
  });
});
