import type { DriveInput } from '../core/drive/drivetrain';

/** Ekran kontrollerinin anlık durumu (TouchControls yazar, input.ts okur). */
const state = { steer: 0, throttle: 0, brake: 0, handbrake: false, nitro: false };

export const touchState = state;

export function resetTouch(): void {
  state.steer = 0;
  state.throttle = 0;
  state.brake = 0;
  state.handbrake = false;
  state.nitro = false;
}

/** Dokunmatik giriş; hiçbir kontrole dokunulmuyorsa null (diğer kaynaklar kazansın). */
export function readTouchDrive(): DriveInput | null {
  const { steer, throttle, brake, handbrake, nitro } = state;
  if (steer === 0 && throttle === 0 && brake === 0 && !handbrake && !nitro) return null;
  return { steer, throttle, brake, handbrake, nitro };
}
