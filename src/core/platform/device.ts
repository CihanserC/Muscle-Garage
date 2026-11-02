import { useSyncExternalStore } from 'react';

/** Cihaz özellikleri (ölçülen ham değerler; karar mantığı saf fonksiyonlarda) */
export type DeviceInfo = {
  /** `pointer: coarse` (birincil işaretçi parmak) */
  coarsePointer: boolean;
  /** `hover: none`: fare yok (telefon/tablet), bazı tarayıcılar `pointer: coarse` demese de */
  hoverNone?: boolean;
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
    isTouch:
      info.coarsePointer ||
      (info.maxTouchPoints > 0 && (info.hoverNone === true || short <= COMPACT_SHORT_SIDE)),
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
    hoverNone: window.matchMedia?.('(hover: none)').matches ?? false,
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

/** Bu kısa kenarın (px) altında arayüz küçültülür; üstünde masaüstü ölçüsü */
export const UI_FULL_SHORT_SIDE = 640;
/** Arayüz ölçeği alt sınırı: daha küçük yazı okunmaz */
export const UI_MIN_SCALE = 0.62;

/**
 * Arayüz katmanı ölçeği: kısa kenar 640 px ve üstündeyse 1, altında orantılı küçülür (en az 0,62).
 * Masaüstü boyutlu arayüz telefonda ekranı kaplar; bu ölçek onu telefona sığdırır.
 */
export function uiScaleFor(width: number, height: number): number {
  const short = Math.min(width, height);
  if (short >= UI_FULL_SHORT_SIDE) return 1;
  return Math.max(UI_MIN_SCALE, Math.round((short / UI_FULL_SHORT_SIDE) * 100) / 100);
}

export type UiMetrics = { scale: number; width: number; height: number };

let cachedMetrics: UiMetrics = { scale: 1, width: 0, height: 0 };
function metricsSnapshot(): UiMetrics {
  if (typeof window === 'undefined') return cachedMetrics;
  const scale = uiScaleFor(window.innerWidth, window.innerHeight);
  const width = Math.round(window.innerWidth / scale);
  const height = Math.round(window.innerHeight / scale);
  if (
    cachedMetrics.scale !== scale ||
    cachedMetrics.width !== width ||
    cachedMetrics.height !== height
  )
    cachedMetrics = { scale, width, height };
  return cachedMetrics;
}

/** Arayüz katmanının ölçeği ve (ölçek öncesi) boyutu; pencere değişince güncellenir. */
export const useUiMetrics = (): UiMetrics =>
  useSyncExternalStore(subscribe, metricsSnapshot, () => cachedMetrics);

/**
 * Atölye kamerası için dikey görüş açısı (derece): dar/dikey ekranda yatay görüş açısı sabit
 * kalacak şekilde artırılır (araç kadraja sığsın), en çok `maxFov`.
 */
export function fitFov(baseFov: number, aspect: number, refAspect = 16 / 9, maxFov = 78): number {
  if (aspect >= refAspect) return baseFov;
  const half = Math.tan((baseFov * Math.PI) / 360) * (refAspect / aspect);
  return Math.min(maxFov, (2 * Math.atan(half) * 180) / Math.PI);
}
