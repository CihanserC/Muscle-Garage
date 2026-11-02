import { tiltAngle, tiltToSteer } from '../core/input/tilt';
import { useInputStore } from '../core/store/inputStore';

/** Eğim direksiyonunun anlık değeri (-1..1); input.ts / touchInput.ts okur. */
let steer = 0;
let neutral: number | null = null;
let latest = 0;

export const gyroSteer = (): number => steer;

/** Şu anki eğimi nötr (düz direksiyon) kabul eder: sürüş başlarken çağrılır. */
export function calibrateGyro(): void {
  neutral = latest;
}

const screenAngle = (): number => (typeof screen !== 'undefined' && screen.orientation?.angle) || 0;

function onOrientation(e: DeviceOrientationEvent): void {
  if (e.beta === null || e.gamma === null) return;
  latest = tiltAngle(e.beta, e.gamma, screenAngle());
  neutral ??= latest;
  steer = tiltToSteer(latest, neutral, useInputStore.getState().tilt);
}

let listening = false;

/** Dinlemeyi açar/kapatır; ayar değişince çağrılır. */
export function syncGyro(): void {
  const want = useInputStore.getState().tilt !== 'off';
  if (want && !listening) {
    window.addEventListener('deviceorientation', onOrientation);
    listening = true;
    neutral = null;
  } else if (!want && listening) {
    window.removeEventListener('deviceorientation', onOrientation);
    listening = false;
    steer = 0;
  }
}

type IosOrientation = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

/**
 * Eğim direksiyonunu açar. iOS Safari izin ister (kullanıcı hareketi içinden çağrılmalı);
 * reddedilirse ayar kapalı kalır. Eğim sensörü olmayan cihazda da kapalı kalır.
 */
export async function enableGyro(mode: 'on' | 'inverted'): Promise<boolean> {
  if (typeof DeviceOrientationEvent === 'undefined') return false;
  const ctor = DeviceOrientationEvent as IosOrientation;
  if (typeof ctor.requestPermission === 'function') {
    try {
      if ((await ctor.requestPermission()) !== 'granted') return false;
    } catch {
      return false;
    }
  }
  useInputStore.getState().setTilt(mode);
  syncGyro();
  return true;
}

export function disableGyro(): void {
  useInputStore.getState().setTilt('off');
  syncGyro();
}
