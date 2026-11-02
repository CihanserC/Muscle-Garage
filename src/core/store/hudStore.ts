import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const CONTROL_SCHEMES = ['auto', 'touch', 'keyboard'] as const;
/** Kontrol düzeni: otomatik (cihaza göre), ekran dokunmatik kontrolleri ya da klavye/gamepad */
export type ControlScheme = (typeof CONTROL_SCHEMES)[number];

export type HudSettings = {
  /** Hız göstergesi üstündeki ABS / TC / el freni / drift lambaları */
  showLamps: boolean;
  /** En iyi turun hayaleti (mavi kutu) */
  showGhost: boolean;
  controlScheme: ControlScheme;
};

export type HudState = HudSettings & {
  setShowLamps: (on: boolean) => void;
  setShowGhost: (on: boolean) => void;
  setControlScheme: (scheme: ControlScheme) => void;
};

export const DEFAULT_HUD_SETTINGS: HudSettings = {
  showLamps: false,
  showGhost: true,
  controlScheme: 'auto',
};

/** Kayıtlı ayarları her durumda geçerli değerlere çevirir. */
export function sanitizeHudSettings(input: unknown): HudSettings {
  const src = (typeof input === 'object' && input !== null ? input : {}) as Record<string, unknown>;
  const flag = (k: 'showLamps' | 'showGhost') =>
    typeof src[k] === 'boolean' ? (src[k] as boolean) : DEFAULT_HUD_SETTINGS[k];
  return {
    showLamps: flag('showLamps'),
    showGhost: flag('showGhost'),
    controlScheme: CONTROL_SCHEMES.includes(src.controlScheme as ControlScheme)
      ? (src.controlScheme as ControlScheme)
      : 'auto',
  };
}

/** Ekran dokunmatik kontrolleri kullanılsın mı: açık seçim, yoksa cihaz algısı. */
export function resolveTouch(scheme: ControlScheme, deviceIsTouch: boolean): boolean {
  return scheme === 'touch' || (scheme === 'auto' && deviceIsTouch);
}

/** HUD / kontrol ayarları tarayıcıda saklanır (erişilemezse sadece bu oturumda yaşar). */
export const useHudStore = create<HudState>()(
  persist(
    (set) => ({
      ...DEFAULT_HUD_SETTINGS,
      setShowLamps: (showLamps) => set({ showLamps }),
      setShowGhost: (showGhost) => set({ showGhost }),
      setControlScheme: (controlScheme) => set({ controlScheme }),
    }),
    {
      name: 'muscle-garage.hud',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        showLamps: s.showLamps,
        showGhost: s.showGhost,
        controlScheme: s.controlScheme,
      }),
      merge: (persisted, current) => ({ ...current, ...sanitizeHudSettings(persisted) }),
    },
  ),
);
