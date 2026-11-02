import type { Vec3 } from '../../core/math/tuples';

/** Far ve stop lambası konumları (yer hizalı araç uzayı, m; x sol +, z ileri +). Her iki yan için. */
export type Lamps = { head: Vec3[]; tail: Vec3[] };

const both = (x: number, y: number, z: number): Vec3[] => [
  [x, y, z],
  [-x, y, z],
];

/**
 * Gerçek modellerde ölçülen konumlar (lamba materyal adalarının sınır kutularından:
 * Mustang `fMAT_Lights1`, BMW `LIGHTS`/`GLS_Red`); prosedürel Vanta gövde uçlarından.
 * Lens yüzeyinin biraz önünde: parıltı ve spot gövdenin içinde kalmasın.
 */
const LAMPS: Record<string, Lamps> = {
  ford_mustang_gt_2013: { head: both(0.56, 0.58, 2.27), tail: both(0.5, 0.74, -2.36) },
  bmw_m3_gtr_2001: { head: both(0.62, 0.6, 2.25), tail: both(0.55, 0.79, -2.3) },
};

/** Aracın lamba konumları; kayıtlı değilse gövde uzunluğundan türetilir (prosedürel araçlar). */
export function lampsFor(carId: string, halfLength: number): Lamps {
  return (
    LAMPS[carId] ?? {
      head: both(0.62, 0.62, halfLength + 0.04),
      tail: both(0.42, 0.68, -halfLength - 0.04),
    }
  );
}
