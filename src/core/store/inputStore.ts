import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { TILT_MODES, type TiltMode } from '../input/tilt';

export type InputState = {
  /** Eğim (gyro) direksiyonu: kapalı / açık / ters yön */
  tilt: TiltMode;
  setTilt: (mode: TiltMode) => void;
};

export const sanitizeTilt = (v: unknown): TiltMode =>
  TILT_MODES.includes(v as TiltMode) ? (v as TiltMode) : 'off';

/** Giriş ayarları tarayıcıda saklanır (erişilemezse sadece bu oturumda yaşar). */
export const useInputStore = create<InputState>()(
  persist(
    (set) => ({
      tilt: 'off',
      setTilt: (tilt) => set({ tilt: sanitizeTilt(tilt) }),
    }),
    {
      name: 'muscle-garage.input',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ tilt: s.tilt }),
      merge: (persisted, current) => ({
        ...current,
        tilt: sanitizeTilt((persisted as { tilt?: unknown } | undefined)?.tilt),
      }),
    },
  ),
);
