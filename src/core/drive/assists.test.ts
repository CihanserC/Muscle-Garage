import { describe, expect, it } from 'vitest';
import { applyAssists, DEFAULT_ASSISTS } from './assists';

const input = { throttle: 1, brake: 0, steer: 0, handbrake: false };
const none = { tractionControl: false, steeringAssist: false, abs: false };

describe('applyAssists', () => {
  it('kapalıyken girişi değiştirmez', () => {
    expect(applyAssists(input, { forwardSpeed: 20, lateralSpeed: 5, slipSpeed: 4 }, none)).toEqual(
      input,
    );
  });
  it('sola kayarken sola ters direksiyon ekler', () => {
    const out = applyAssists(
      input,
      { forwardSpeed: 20, lateralSpeed: 4, slipSpeed: 0 },
      DEFAULT_ASSISTS,
    );
    expect(out.steer).toBeGreaterThan(0);
  });
  it('düşük hızda müdahale etmez', () => {
    const out = applyAssists(
      input,
      { forwardSpeed: 2, lateralSpeed: 2, slipSpeed: 0 },
      DEFAULT_ASSISTS,
    );
    expect(out.steer).toBe(0);
  });
  it('çekiş kontrolü patinajda gazı kısar ama sıfırlamaz', () => {
    const out = applyAssists(
      input,
      { forwardSpeed: 10, lateralSpeed: 0, slipSpeed: 8 },
      { ...none, tractionControl: true },
    );
    expect(out.throttle).toBeLessThan(1);
    expect(out.throttle).toBeGreaterThanOrEqual(0.25);
  });
});

describe('ters direksiyon ölü bölgesi', () => {
  it('normal virajdaki küçük kayma açısında direksiyona dokunmaz', () => {
    const out = applyAssists(
      { throttle: 0.5, brake: 0, steer: 1, handbrake: false },
      { forwardSpeed: 28, lateralSpeed: -0.5, slipSpeed: 0 },
      DEFAULT_ASSISTS,
    );
    expect(out.steer).toBe(1);
  });
});

describe('ABS', () => {
  const braking = { throttle: 0, brake: 1, steer: 0, handbrake: false };
  const abs = { ...none, abs: true };
  it('düz frenlemede freni kısmaz', () => {
    expect(
      applyAssists(braking, { forwardSpeed: 30, lateralSpeed: 0, slipSpeed: 0 }, abs).brake,
    ).toBe(1);
  });
  it('kayarken freni kısar ama sıfırlamaz', () => {
    const out = applyAssists(braking, { forwardSpeed: 30, lateralSpeed: 12, slipSpeed: 0 }, abs);
    expect(out.brake).toBeLessThan(1);
    expect(out.brake).toBeGreaterThanOrEqual(0.45);
  });
  it('kapalıyken ve el freninde dokunmaz', () => {
    const ctx = { forwardSpeed: 30, lateralSpeed: 12, slipSpeed: 0 };
    expect(applyAssists(braking, ctx, none).brake).toBe(1);
    expect(applyAssists({ ...braking, handbrake: true }, ctx, abs).brake).toBe(1);
  });
});
