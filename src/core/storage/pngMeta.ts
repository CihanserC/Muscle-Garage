/**
 * PNG tEXt metaverisi: paylaşım görseli build JSON'unu taşır (resim yeniden içe aktarılabilir).
 * tEXt, Latin-1 saklar: metin UTF-8 baytlarına çevrilip Latin-1 karakter olarak yazılır.
 */

const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
/** Build JSON'unun saklandığı tEXt anahtar sözcüğü */
export const PNG_BUILD_KEYWORD = 'MuscleGarage';

let crcTable: Uint32Array | null = null;
function crc32(bytes: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let c = 0xffffffff;
  for (const b of bytes) c = (crcTable[(c ^ b) & 0xff] as number) ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export const isPng = (bytes: Uint8Array): boolean => SIGNATURE.every((b, i) => bytes[i] === b);

const u32 = (bytes: Uint8Array, at: number): number =>
  (((bytes[at] as number) << 24) |
    ((bytes[at + 1] as number) << 16) |
    ((bytes[at + 2] as number) << 8) |
    (bytes[at + 3] as number)) >>>
  0;

const ascii = (bytes: Uint8Array, from: number, to: number): string =>
  String.fromCharCode(...bytes.subarray(from, to));

/** UTF-8 metni Latin-1 karakter dizisi olarak (her bayt bir karakter). */
const toLatin1 = (text: string): Uint8Array => new TextEncoder().encode(text);

/** PNG'ye IEND'den önce bir tEXt parçası ekler. */
export function embedPngText(png: Uint8Array, keyword: string, text: string): Uint8Array {
  if (!isPng(png)) throw new Error('Geçerli bir PNG değil');
  let iend = -1;
  for (let at = 8; at + 12 <= png.length;) {
    const len = u32(png, at);
    if (ascii(png, at + 4, at + 8) === 'IEND') {
      iend = at;
      break;
    }
    at += 12 + len;
  }
  if (iend < 0) throw new Error('PNG bitiş parçası yok');

  const key = new TextEncoder().encode(keyword);
  const value = toLatin1(text);
  const data = new Uint8Array(key.length + 1 + value.length);
  data.set(key, 0);
  data.set(value, key.length + 1); // arada 0 ayırıcı
  const chunk = new Uint8Array(12 + data.length);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.length);
  chunk.set([0x74, 0x45, 0x58, 0x74], 4); // "tEXt"
  chunk.set(data, 8);
  view.setUint32(8 + data.length, crc32(chunk.subarray(4, 8 + data.length)));

  const out = new Uint8Array(png.length + chunk.length);
  out.set(png.subarray(0, iend), 0);
  out.set(chunk, iend);
  out.set(png.subarray(iend), iend + chunk.length);
  return out;
}

/** İlk eşleşen tEXt parçasının metni; PNG değilse ya da yoksa null. */
export function extractPngText(png: Uint8Array, keyword: string): string | null {
  if (!isPng(png)) return null;
  for (let at = 8; at + 12 <= png.length;) {
    const len = u32(png, at);
    const type = ascii(png, at + 4, at + 8);
    if (type === 'tEXt') {
      const data = png.subarray(at + 8, at + 8 + len);
      const sep = data.indexOf(0);
      if (sep > 0 && ascii(data, 0, sep) === keyword)
        return new TextDecoder().decode(data.subarray(sep + 1));
    }
    if (type === 'IEND') break;
    at += 12 + len;
  }
  return null;
}
