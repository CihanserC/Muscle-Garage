import { describe, expect, it } from 'vitest';
import { computeLayout } from './device';

const dev = (coarsePointer: boolean, width: number, height: number, maxTouchPoints = 0) => ({
  coarsePointer,
  maxTouchPoints,
  width,
  height,
});

describe('computeLayout', () => {
  it('masaüstü: dokunmatik değil, dar değil', () => {
    expect(computeLayout(dev(false, 1920, 1080))).toEqual({
      isTouch: false,
      isCompact: false,
      isPortrait: false,
    });
  });
  it('telefon yatay (844×390): dokunmatik ve dar', () => {
    const l = computeLayout(dev(true, 844, 390, 5));
    expect(l.isTouch).toBe(true);
    expect(l.isCompact).toBe(true);
    expect(l.isPortrait).toBe(false);
  });
  it('telefon dikey (390×844)', () => {
    expect(computeLayout(dev(true, 390, 844, 5)).isPortrait).toBe(true);
  });
  it('tablet (1024×768): dokunmatik ama dar değil', () => {
    const l = computeLayout(dev(true, 1024, 768, 5));
    expect(l.isTouch).toBe(true);
    expect(l.isCompact).toBe(false);
  });
  it('dokunmatik ekranlı dizüstü geniş pencerede dokunmatik sayılmaz', () => {
    expect(computeLayout(dev(false, 1440, 900, 10)).isTouch).toBe(false);
  });
  it('dar masaüstü penceresi sıkışık düzene geçer', () => {
    expect(computeLayout(dev(false, 700, 900)).isCompact).toBe(true);
  });
});
