import type { DriveInput } from '../core/drive/drivetrain';
import { readGamepadDrive } from '../core/input/gamepadBridge';
import { readTouchDrive } from './touchInput';

const KEYS = {
  throttle: ['KeyW', 'ArrowUp'],
  brake: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  handbrake: ['Space'],
  nitro: ['ShiftLeft', 'ShiftRight'],
} as const;

export type InputSource = {
  read: () => DriveInput;
  /** Geliştirme/test: klavye yerine sabit giriş ver (null: klavyeye dön) */
  override: (input: DriveInput | null) => void;
  dispose: () => void;
};

/** Klavye durumunu izler; her adımda read() ile anlık sürüş girişini verir. */
export function createInputSource(): InputSource {
  const down = new Set<string>();
  let forced: DriveInput | null = null;
  const onDown = (e: KeyboardEvent) => {
    if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
    down.add(e.code);
  };
  const onUp = (e: KeyboardEvent) => down.delete(e.code);
  const onBlur = () => down.clear();
  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);
  window.addEventListener('blur', onBlur);
  const any = (codes: readonly string[]) => codes.some((c) => down.has(c));
  return {
    read: () => {
      if (forced) return forced;
      const keyboard: DriveInput = {
        throttle: any(KEYS.throttle) ? 1 : 0,
        brake: any(KEYS.brake) ? 1 : 0,
        steer: (any(KEYS.left) ? 1 : 0) - (any(KEYS.right) ? 1 : 0),
        handbrake: any(KEYS.handbrake),
        nitro: any(KEYS.nitro),
      };
      // Gamepad varsa analog değerlerle birleştirilir (daha büyük olan kazanır)
      const pad = readGamepadDrive();
      const touch = readTouchDrive();
      return [pad, touch].reduce<DriveInput>(
        (a, b) =>
          b
            ? {
                throttle: Math.max(a.throttle, b.throttle),
                brake: Math.max(a.brake, b.brake),
                steer: Math.max(-1, Math.min(1, a.steer + b.steer)),
                handbrake: a.handbrake || b.handbrake,
                nitro: a.nitro || b.nitro,
              }
            : a,
        keyboard,
      );
    },
    override: (input) => {
      forced = input;
    },
    dispose: () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', onBlur);
    },
  };
}
