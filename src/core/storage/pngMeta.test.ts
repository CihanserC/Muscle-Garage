import { describe, expect, it } from 'vitest';
import { embedPngText, extractPngText, isPng, PNG_BUILD_KEYWORD } from './pngMeta';

/** 1×1 saydam PNG */
const PIXEL = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  ),
  (c) => c.charCodeAt(0),
);

describe('PNG tEXt metaverisi', () => {
  it('örnek PNG geçerli', () => {
    expect(isPng(PIXEL)).toBe(true);
  });

  it('metin gömülür ve geri okunur (Türkçe karakterler dahil)', () => {
    const json = JSON.stringify({ name: 'Çılgın Şahin', carId: 'vanta_stallion_70' });
    const out = embedPngText(PIXEL, PNG_BUILD_KEYWORD, json);
    expect(isPng(out)).toBe(true);
    expect(out.length).toBeGreaterThan(PIXEL.length);
    expect(extractPngText(out, PNG_BUILD_KEYWORD)).toBe(json);
  });

  it('PNG IEND ile bitmeye devam eder, özgün baytlar korunur', () => {
    const out = embedPngText(PIXEL, 'k', 'v');
    const tail = (b: Uint8Array) => Array.from(b.subarray(b.length - 12));
    expect(tail(out)).toEqual(tail(PIXEL));
    expect(Array.from(out.subarray(0, 33))).toEqual(Array.from(PIXEL.subarray(0, 33)));
  });

  it('başka anahtar ya da PNG olmayan veri için null', () => {
    const out = embedPngText(PIXEL, 'a', 'b');
    expect(extractPngText(out, 'baska')).toBeNull();
    expect(extractPngText(new Uint8Array([1, 2, 3]), 'a')).toBeNull();
    expect(extractPngText(PIXEL, 'a')).toBeNull();
  });

  it('PNG olmayan veriye gömülmez', () => {
    expect(() => embedPngText(new Uint8Array([1, 2, 3]), 'a', 'b')).toThrow();
  });
});
