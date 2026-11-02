import { describe, expect, it } from 'vitest';
import { TILT_MAX_DEG, tiltAngle, tiltToSteer } from './tilt';

describe('tiltAngle', () => {
  it('ekran yönüne göre doğru ekseni seçer', () => {
    expect(tiltAngle(80, 12, 0)).toBe(12);
    expect(tiltAngle(80, 12, 90)).toBe(80);
    expect(tiltAngle(80, 12, 270)).toBe(-80);
    expect(tiltAngle(80, 12, 180)).toBe(-12);
    expect(tiltAngle(80, 12, -90)).toBe(-80);
  });
});

describe('tiltToSteer', () => {
  it('kapalıyken ve ölü bölgede 0', () => {
    expect(tiltToSteer(40, 0, 'off')).toBe(0);
    expect(tiltToSteer(2, 0, 'on')).toBe(0);
  });
  it('sağa yatırma sağa (-1), sola yatırma sola (+1) döner', () => {
    expect(tiltToSteer(TILT_MAX_DEG, 0, 'on')).toBe(-1);
    expect(tiltToSteer(-TILT_MAX_DEG, 0, 'on')).toBe(1);
  });
  it('nötr noktası çıkarılır ve tam kilit sınırlanır', () => {
    expect(tiltToSteer(90, 90, 'on')).toBe(0);
    expect(tiltToSteer(200, 90, 'on')).toBe(-1);
  });
  it('ters mod yönü çevirir', () => {
    expect(tiltToSteer(TILT_MAX_DEG, 0, 'inverted')).toBe(1);
  });
});
