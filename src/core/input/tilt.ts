/** Eğim (gyro) direksiyonu: telefon bir direksiyon gibi yana yatırılır. */

/** Tam kilit için gereken eğim (derece, nötr noktadan) */
export const TILT_MAX_DEG = 30;
/** Bu eğimin altı düz sayılır (derece) */
export const TILT_DEADZONE_DEG = 3;

export const TILT_MODES = ['off', 'on', 'inverted'] as const;
export type TiltMode = (typeof TILT_MODES)[number];

/**
 * Cihazın "sağa yatma" açısı (derece, mutlak). `orientation`: ekran yönü (screen.orientation.angle).
 * Dikey: gamma; yatay: beta (üst kenar kalkınca artar). Nötr noktası ayrıca çıkarılır.
 */
export function tiltAngle(beta: number, gamma: number, orientation: number): number {
  const a = (((Math.round(orientation / 90) * 90) % 360) + 360) % 360;
  if (a === 90) return beta;
  if (a === 270) return -beta;
  if (a === 180) return -gamma;
  return gamma;
}

/**
 * Eğimden direksiyon (-1..1); sol = +1 (klavyede A ile aynı yön), sağa yatırma sağa döner.
 * `inverted`: yön ters çevrilir (cihaz/tarayıcı işareti farklıysa).
 */
export function tiltToSteer(tilt: number, neutral: number, mode: TiltMode): number {
  if (mode === 'off') return 0;
  const d = tilt - neutral;
  const a = Math.abs(d);
  if (a < TILT_DEADZONE_DEG) return 0;
  const v = Math.min(1, (a - TILT_DEADZONE_DEG) / (TILT_MAX_DEG - TILT_DEADZONE_DEG));
  const right = Math.sign(d) * v;
  return (mode === 'inverted' ? 1 : -1) * right;
}
