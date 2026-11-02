import { describe, expect, it } from 'vitest';
import { computeLayout, fitFov, uiScaleFor, UI_MIN_SCALE } from './device';

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

describe('dokunmatik algısı', () => {
  it('pointer: coarse demeyen ama fare olmayan telefon (hover: none) dokunmatik sayılır', () => {
    const info = {
      coarsePointer: false,
      hoverNone: true,
      maxTouchPoints: 5,
      width: 900,
      height: 450,
    };
    expect(computeLayout(info).isTouch).toBe(true);
  });
  it('fareli dokunmatik ekranlı dizüstü dokunmatik sayılmaz', () => {
    const info = {
      coarsePointer: false,
      hoverNone: false,
      maxTouchPoints: 10,
      width: 1440,
      height: 900,
    };
    expect(computeLayout(info).isTouch).toBe(false);
  });
});

describe('uiScaleFor', () => {
  it('büyük ekranda 1, küçükte orantılı ve alt sınırlı', () => {
    expect(uiScaleFor(1920, 1080)).toBe(1);
    expect(uiScaleFor(1024, 768)).toBe(1);
    expect(uiScaleFor(844, 390)).toBeCloseTo(0.62, 2);
    expect(uiScaleFor(390, 844)).toBeCloseTo(0.62, 2);
    expect(uiScaleFor(300, 300)).toBe(UI_MIN_SCALE);
    expect(uiScaleFor(800, 500)).toBeCloseTo(0.78, 2);
  });
});

describe('fitFov', () => {
  it('geniş ekranda taban açı değişmez', () => {
    expect(fitFov(40, 16 / 9)).toBe(40);
    expect(fitFov(40, 2.2)).toBe(40);
  });
  it('dar ekranda açı artar ve sınırlanır', () => {
    const portrait = fitFov(40, 390 / 844);
    expect(portrait).toBeGreaterThan(40);
    expect(portrait).toBeLessThanOrEqual(78);
    expect(fitFov(40, 1.3)).toBeGreaterThan(40);
    expect(fitFov(40, 1.3)).toBeLessThan(fitFov(40, 0.8));
  });
});

describe('telefon boyutlu ekran', () => {
  it('tarayıcı dokunmatik demese de telefon boyutu (masaüstü site modu) dokunmatik sayılır', () => {
    const info = {
      coarsePointer: false,
      hoverNone: false,
      maxTouchPoints: 0,
      width: 980,
      height: 460,
    };
    expect(computeLayout(info).isTouch).toBe(true);
  });
  it('geniş masaüstü penceresi dokunmatik sayılmaz', () => {
    const info = {
      coarsePointer: false,
      hoverNone: false,
      maxTouchPoints: 0,
      width: 1400,
      height: 450,
    };
    expect(computeLayout(info).isTouch).toBe(false);
  });
});
