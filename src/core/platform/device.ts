import { useSyncExternalStore } from 'react';

/** Cihaz özellikleri (ölçülen ham değerler; karar mantığı saf fonksiyonlarda) */
export type DeviceInfo = {
  /** `pointer: coarse` (birincil işaretçi parmak) */
  coarsePointer: boolean;
  maxTouchPoints: number;
  width: number;
  height: number;
};

export type Layout = {
  /** Dokunmatik birincil girdi: ekranda sürüş kontrolleri, büyük dokunma hedefleri */
  isTouch: boolean;
  /** Dar ekran (telefon): atölye menüsü alt çekmece olur, HUD küçülür */
  isCompact: boolean;
  /** Ekran dikey (genişlik < yükseklik) */
  isPortrait: boolean;
};

/** Telefon: kısa kenar bu değerin altında ya da genişlik bu değerin altında. */
const COMPACT_SHORT_SIDE = 500;
const COMPACT_WIDTH = 820;

export function computeLayout(info: DeviceInfo): Layout {
  const short = Math.min(info.width, info.height);
  return {
    isTouch: info.coarsePointer || (info.maxTouchPoints > 0 && short <= COMPACT_SHORT_SIDE),
    isCompact: short <= COMPACT_SHORT_SIDE || info.width <= COMPACT_WIDTH,
    isPortrait: info.width < info.height,
  };
}

const DESKTOP: DeviceInfo = { coarsePointer: false, maxTouchPoints: 0, width: 1920, height: 1080 };

/** Tarayıcıdan ölçer; tarayıcı yoksa (test/SSR) masaüstü varsayar. */
export function readDevice(): DeviceInfo {
  if (typeof window === 'undefined') return DESKTOP;
  return {
    coarsePointer: window.matchMedia?.('(pointer: coarse)').matches ?? false,
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

export const currentLayout = (): Layout => computeLayout(readDevice());

// useSyncExternalStore kararlı bir anlık görüntü ister: değer değişmedikçe aynı nesne döner.
let cached: Layout = currentLayout();
function snapshot(): Layout {
  const next = currentLayout();
  if (
    next.isTouch !== cached.isTouch ||
    next.isCompact !== cached.isCompact ||
    next.isPortrait !== cached.isPortrait
  )
    cached = next;
  return cached;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('resize', onChange);
  window.addEventListener('orientationchange', onChange);
  return () => {
    window.removeEventListener('resize', onChange);
    window.removeEventListener('orientationchange', onChange);
  };
}

/** Düzen bilgisi; pencere boyutu/yönü değişince güncellenir. */
export const useLayout = (): Layout => useSyncExternalStore(subscribe, snapshot, () => cached);
