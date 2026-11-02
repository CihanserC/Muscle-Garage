/** Gamepad titreşim seviyeleri (0..1): saf mantık, tarayıcıya bağlı değil. */

export type RumbleInput = {
  /** 0..1 lastik kayma şiddeti */
  slip: number;
  nitro: boolean;
  /** Son aralıkta hız kaybı (m/s): ani değer çarpma sayılır */
  speedDrop: number;
};

/** Bu hız kaybının (m/s, aralık başına) üstü çarpma sayılır */
export const IMPACT_SPEED_DROP = 2.5;
/** Kayma bu değerin altında titreşim yok */
export const SLIP_RUMBLE_START = 0.3;

/** strong = ağır motor (çarpma), weak = hafif motor (kayma, nitro). */
export function rumbleLevels(i: RumbleInput): { strong: number; weak: number } {
  const strong =
    i.speedDrop > IMPACT_SPEED_DROP
      ? Math.min(1, 0.5 + (i.speedDrop - IMPACT_SPEED_DROP) * 0.15)
      : 0;
  let weak = i.slip > SLIP_RUMBLE_START ? Math.min(0.55, (i.slip - SLIP_RUMBLE_START) * 0.8) : 0;
  if (i.nitro) weak = Math.max(weak, 0.3);
  return { strong, weak };
}
