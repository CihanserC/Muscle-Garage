import { describe, expect, it } from 'vitest';
import { steerFromPointer, swipeDirection, touchBrakeToDrift } from './touch';

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

describe('touchBrakeToDrift', () => {
  const braking = { throttle: 1, brake: 1, steer: 0.8, handbrake: false };
  it('hızlıyken fren + direksiyon el frenine (drift) çevrilir', () => {
    const out = touchBrakeToDrift(braking, 20);
    expect(out.handbrake).toBe(true);
    expect(out.brake).toBe(0);
    expect(out.steer).toBe(0.8);
  });
  it('yavaşken ya da direksiyon yokken normal fren', () => {
    expect(touchBrakeToDrift(braking, 3)).toEqual(braking);
    expect(touchBrakeToDrift({ ...braking, steer: 0 }, 20)).toEqual({ ...braking, steer: 0 });
  });
  it('fren yoksa dokunmaz', () => {
    const idle = { ...braking, brake: 0 };
    expect(touchBrakeToDrift(idle, 20)).toEqual(idle);
  });
});

describe('swipeDirection', () => {
  it('sola kaydırma sonraki, sağa kaydırma önceki', () => {
    expect(swipeDirection(-120, 5)).toBe(1);
    expect(swipeDirection(120, -5)).toBe(-1);
  });
  it('kısa ya da dikey hareket kaydırma sayılmaz', () => {
    expect(swipeDirection(-30, 0)).toBe(0);
    expect(swipeDirection(-100, 90)).toBe(0);
    expect(swipeDirection(0, 200)).toBe(0);
  });
});
