import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_ASSISTS, type Assists } from '../drive/assists';

export type AssistState = Assists & {
  setAssist: (key: keyof Assists, on: boolean) => void;
};

/** Kayıtlı ayarları her durumda geçerli değerlere çevirir. */
export function sanitizeAssists(input: unknown): Assists {
  const src = (typeof input === 'object' && input !== null ? input : {}) as Record<string, unknown>;
  const flag = (k: keyof Assists) =>
    typeof src[k] === 'boolean' ? (src[k] as boolean) : DEFAULT_ASSISTS[k];
  return {
    tractionControl: flag('tractionControl'),
    steeringAssist: flag('steeringAssist'),
    abs: flag('abs'),
  };
}

/** Sürüş yardımcıları tarayıcıda saklanır (erişilemezse sadece bu oturumda yaşar). */
export const useAssistStore = create<AssistState>()(
  persist(
    (set) => ({
      ...DEFAULT_ASSISTS,
      setAssist: (key, on) => set({ [key]: on }),
    }),
    {
      name: 'muscle-garage.assists',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        tractionControl: s.tractionControl,
        steeringAssist: s.steeringAssist,
        abs: s.abs,
      }),
      merge: (persisted, current) => ({ ...current, ...sanitizeAssists(persisted) }),
    },
  ),
);
