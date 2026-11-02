/** Kayıtlı motor sesi: devir katmanları, iki komşu katman arasında eşit güçle karışır. */

export type EngineLayer = { file: string; rpm: number };

export type LayerMix = { index: number; gain: number; rate: number };

/** Katman oynatma hızı sınırları: bu aralığın dışında ses doğal durmaz */
export const RATE_MIN = 0.6;
export const RATE_MAX = 1.7;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Verilen devirde hangi katmanların ne kadar duyulacağı ve hangi hızla çalacağı.
 * `layers` devire göre artan sıralı olmalı. Devir en düşük katmanın altındaysa yalnız o,
 * en yükseğin üstündeyse yalnız o çalar (hızı artırılarak). Aradaysa komşu ikisi eşit güçle karışır.
 * Hız = devir / katman devri (perde devirle orantılı).
 */
export function layerMix(layers: readonly EngineLayer[], rpm: number): LayerMix[] {
  if (layers.length === 0) return [];
  const rate = (l: EngineLayer) => clamp(rpm / l.rpm, RATE_MIN, RATE_MAX);
  const first = layers[0] as EngineLayer;
  const last = layers[layers.length - 1] as EngineLayer;
  if (rpm <= first.rpm) return [{ index: 0, gain: 1, rate: rate(first) }];
  if (rpm >= last.rpm) return [{ index: layers.length - 1, gain: 1, rate: rate(last) }];
  let i = 0;
  while (i < layers.length - 2 && rpm > (layers[i + 1] as EngineLayer).rpm) i++;
  const a = layers[i] as EngineLayer;
  const b = layers[i + 1] as EngineLayer;
  const t = (rpm - a.rpm) / (b.rpm - a.rpm);
  return [
    { index: i, gain: Math.cos((t * Math.PI) / 2), rate: rate(a) },
    { index: i + 1, gain: Math.sin((t * Math.PI) / 2), rate: rate(b) },
  ];
}
