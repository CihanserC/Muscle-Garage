import { describe, expect, it } from 'vitest';
import { emptySplits, formatDelta, lapDelta, lapFraction, recordSplit, SPLIT_BINS } from './lap';

describe('tur dilimleri', () => {
  it('ilerleme oranı çizginin gerisinde de 0..1 kalır', () => {
    expect(lapFraction(-100, 1000)).toBeCloseTo(0.9);
    expect(lapFraction(250, 1000)).toBeCloseTo(0.25);
  });
  it('geçilen dilimleri yazar, atlananları doldurur, yazılanı ezmez', () => {
    const s = emptySplits();
    recordSplit(s, 0.055, 4);
    expect(s.slice(0, 6)).toEqual([4, 4, 4, 4, 4, 4]);
    expect(s[6]).toBeNull();
    recordSplit(s, 0.1, 9);
    expect(s[0]).toBe(4);
    expect(s[10]).toBe(9);
  });
  it('fark en iyi tura göre hesaplanır; kayıt yoksa null', () => {
    const best = emptySplits();
    recordSplit(best, 1, 60);
    best[49] = 30;
    expect(lapDelta(null, 0.5, 31)).toBeNull();
    expect(lapDelta(best, 0.495, 31.5)).toBeCloseTo(1.5);
    expect(lapDelta(emptySplits(), 0.5, 31)).toBeNull();
    expect(best).toHaveLength(SPLIT_BINS);
  });
  it('fark metni işaretlidir', () => {
    expect(formatDelta(0.4)).toBe('+0.40');
    expect(formatDelta(-1.074)).toBe('-1.07');
  });
});
