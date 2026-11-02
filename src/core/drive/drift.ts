/** Drift modu: el freni (Space / dokunmatikte fren + direksiyon) hızlıyken direksiyonla birlikte basılırsa */

/** Drift için asgari hız (m/s, ≈ 29 km/s) */
export const DRIFT_MIN_SPEED = 8;
/** Drift için asgari direksiyon girişi (0..1) */
export const DRIFT_MIN_STEER = 0.2;
/** Tam direksiyonda hedeflenen gövde–hız kayma açısı (rad, ≈ 34°) */
export const DRIFT_MAX_BETA = 0.6;
/** Kayma açısı hata kazancı: hedefe ulaşmak için yalpalama hızı (1/sn) */
export const DRIFT_BETA_GAIN = 4;
/** Drift sırasında hız vektörünün gövdeye hizalanma hızı (1/sn): düşük = kayma sürer */
export const DRIFT_ALIGN_RATE = 1.2;
/** Hedef kayma açısı aşılırsa (oran) hizalama artar: araç fırıldak olmasın */
export const DRIFT_OVERSHOOT = 1.15;
export const DRIFT_OVERSHOOT_ALIGN_RATE = 6;
/** Arka el freni kuvvetinin drift sırasındaki çarpanı (hızı korumak için düşük) */
export const DRIFT_HANDBRAKE_FACTOR = 0.2;
/** Course dönüş hızı tahmininde kullanılan yanal ivme oranı */
export const DRIFT_ACCEL_FRACTION = 0.5;

/** Drift modu açık mı: el freni basılı, yeterli hız, yeterli direksiyon. */
export function isDrifting(handbrake: boolean, steer: number, speed: number): boolean {
  return handbrake && speed >= DRIFT_MIN_SPEED && Math.abs(steer) >= DRIFT_MIN_STEER;
}

/** Direksiyondan hedef kayma açısı (rad): direksiyonla aynı işaret. */
export const driftTargetBeta = (steer: number): number =>
  Math.max(-1, Math.min(1, steer)) * DRIFT_MAX_BETA;

/**
 * Hedef yalpalama hızı (rad/sn): hız vektörünün dönüş hızı tahmini + kayma açısı hatasını
 * kapatan terim.
 */
export function driftYawTarget(
  steer: number,
  beta: number,
  speed: number,
  lateralAccel: number,
): number {
  const courseRate =
    Math.sign(steer) * Math.min(1.5, (lateralAccel * DRIFT_ACCEL_FRACTION) / Math.max(speed, 1));
  return courseRate + DRIFT_BETA_GAIN * (driftTargetBeta(steer) - beta);
}

/** Drift sırasında hız vektörünün gövdeye doğru dönme hızı (1/sn). */
export function driftAlignRate(steer: number, beta: number): number {
  const over = Math.abs(beta) > Math.abs(driftTargetBeta(steer)) * DRIFT_OVERSHOOT;
  return over ? DRIFT_OVERSHOOT_ALIGN_RATE : DRIFT_ALIGN_RATE;
}
