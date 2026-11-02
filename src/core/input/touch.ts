import type { DriveInput } from '../drive/drivetrain';
import { isDrifting } from '../drive/drift';

/** Direksiyon bölgesinin ortasındaki ölü bölge (bölge yarı genişliğinin oranı) */
export const STEER_DEADZONE = 0.1;

/**
 * Direksiyon bölgesindeki parmak konumundan direksiyon girişi (-1..1). Bölgenin ortası düz,
 * kenarlar tam kilit; sol = +1 (klavyede A ile aynı yön).
 */
export function steerFromPointer(x: number, left: number, width: number): number {
  if (width <= 0) return 0;
  const n = Math.max(-1, Math.min(1, ((x - left) / width) * 2 - 1));
  const a = Math.abs(n);
  if (a < STEER_DEADZONE) return 0;
  return -Math.sign(n) * ((a - STEER_DEADZONE) / (1 - STEER_DEADZONE));
}

/**
 * Dokunmatikte fren düğmesi + direksiyon, hızlıyken drift başlatır (klavyedeki Space gibi):
 * fren yerine el freni uygulanır. Yavaşken ya da direksiyon yokken normal fren.
 */
export function touchBrakeToDrift(input: DriveInput, speed: number): DriveInput {
  if (input.brake <= 0 || !isDrifting(true, input.steer, speed)) return input;
  return { ...input, brake: 0, handbrake: true };
}

/** Kaydırma sayılması için asgari yatay mesafe (px) */
export const SWIPE_MIN_DISTANCE = 60;

/**
 * Yatay kaydırma yönü: sola kaydırma → +1 (sonraki), sağa → -1 (önceki). Yeterince uzun ve
 * belirgin biçimde yataysa; aksi halde 0 (dikey kaydırma / dokunma).
 */
export function swipeDirection(dx: number, dy: number): -1 | 0 | 1 {
  if (Math.abs(dx) < SWIPE_MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * 2) return 0;
  return dx < 0 ? 1 : -1;
}
