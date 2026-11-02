/** Hayalet (ghost): en iyi turun konum kaydı; sonraki turlarda yarı saydam araç olarak oynatılır. */

/** Örnekleme aralığı (sn) */
export const GHOST_DT = 0.05;

/** [x, z, yaw] örnekleri; i. örnek = i × GHOST_DT saniye */
export type GhostSample = [number, number, number];

export type Ghost = {
  /** Kaydedildiği turun süresi (sn) */
  lapTime: number;
  samples: GhostSample[];
};

/**
 * Kayıt tamponuna örnek ekler: tur başından `elapsed` saniye geçtiyse ve sıradaki örnek zamanı
 * gelmişse ekler (kare hızından bağımsız sabit aralık).
 */
export function recordGhost(
  buffer: GhostSample[],
  elapsed: number,
  x: number,
  z: number,
  yaw: number,
): void {
  while (elapsed >= buffer.length * GHOST_DT) buffer.push([x, z, yaw]);
}

const wrap = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));

/** Hayaletin `t` saniyedeki konumu (doğrusal ara değer; yön en kısa yoldan); tur bittiyse null. */
export function ghostPose(ghost: Ghost, t: number): GhostSample | null {
  const n = ghost.samples.length;
  if (n === 0 || t < 0 || t > ghost.lapTime + GHOST_DT) return null;
  const f = t / GHOST_DT;
  const i = Math.min(n - 1, Math.floor(f));
  const a = ghost.samples[i] as GhostSample;
  const b = ghost.samples[Math.min(n - 1, i + 1)] as GhostSample;
  const k = Math.min(1, f - i);
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + wrap(b[2] - a[2]) * k];
}

/** Saklama için sayıları yuvarlar (boyut küçülür). */
export function compactGhost(ghost: Ghost): Ghost {
  return {
    lapTime: Math.round(ghost.lapTime * 1000) / 1000,
    samples: ghost.samples.map(([x, z, yaw]) => [
      Math.round(x * 100) / 100,
      Math.round(z * 100) / 100,
      Math.round(yaw * 1000) / 1000,
    ]),
  };
}

/** Saklanan veriyi doğrular; bozuksa null. */
export function sanitizeGhost(input: unknown): Ghost | null {
  if (typeof input !== 'object' || input === null) return null;
  const { lapTime, samples } = input as Record<string, unknown>;
  if (typeof lapTime !== 'number' || !Number.isFinite(lapTime) || lapTime <= 0) return null;
  if (!Array.isArray(samples) || samples.length < 2) return null;
  const ok = samples.every(
    (s) =>
      Array.isArray(s) &&
      s.length === 3 &&
      s.every((v) => typeof v === 'number' && Number.isFinite(v)),
  );
  return ok ? { lapTime, samples: samples as GhostSample[] } : null;
}

const key = (carId: string) => `muscle-garage.ghost.${carId}`;

/** Aracın kayıtlı hayaleti (yoksa/erişilemezse null). */
export function loadGhost(carId: string): Ghost | null {
  try {
    const raw = localStorage.getItem(key(carId));
    return raw ? sanitizeGhost(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

/** Hayaleti saklar; kota/erişim hatasında sessizce geçer (yalnız bu oturumda yaşar). */
export function saveGhost(carId: string, ghost: Ghost): void {
  try {
    localStorage.setItem(key(carId), JSON.stringify(compactGhost(ghost)));
  } catch {
    // saklanamadı
  }
}
