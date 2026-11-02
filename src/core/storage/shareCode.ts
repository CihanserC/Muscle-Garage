/**
 * Paylaşım kodu: build JSON'u deflate ile sıkıştırılıp base64url'e çevrilir ("MG1:" öneki).
 * Mesajlaşma uygulamalarına yapıştırılacak kadar kısa; garajdaki "metinden içe aktar" kutusu
 * hem JSON'u hem bu kodu kabul eder.
 */

export const SHARE_PREFIX = 'MG1:';

const toBase64Url = (bytes: Uint8Array): string => {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromBase64Url = (text: string): Uint8Array => {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const out = new Response(
    new Blob([bytes as BlobPart]).stream().pipeThrough(stream as ReadableWritablePair),
  );
  return new Uint8Array(await out.arrayBuffer());
}

/** JSON metninden paylaşım kodu. */
export async function encodeShareCode(json: string): Promise<string> {
  // Girinti boşlukları gereksiz: JSON'u sıkıştırmadan önce küçült
  const compact = JSON.stringify(JSON.parse(json));
  const packed = await pipe(
    new TextEncoder().encode(compact),
    new CompressionStream('deflate-raw'),
  );
  return SHARE_PREFIX + toBase64Url(packed);
}

/** Metin bir paylaşım koduysa içindeki JSON'u verir; değilse ya da bozuksa null. */
export async function decodeShareCode(text: string): Promise<string | null> {
  const trimmed = text.trim();
  if (!trimmed.startsWith(SHARE_PREFIX)) return null;
  try {
    const raw = fromBase64Url(trimmed.slice(SHARE_PREFIX.length).replace(/\s+/g, ''));
    return new TextDecoder().decode(await pipe(raw, new DecompressionStream('deflate-raw')));
  } catch {
    return null;
  }
}

export const looksLikeShareCode = (text: string): boolean => text.trim().startsWith(SHARE_PREFIX);
