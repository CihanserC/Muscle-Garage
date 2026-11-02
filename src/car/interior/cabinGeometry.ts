import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Shape,
  SphereGeometry,
  TorusGeometry,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { Vec3 } from '../../core/math/tuples';

/** Vanta iç mekânı: yer hizalı araç uzayı (m), x sol +, z ileri +. Orijinal tasarım, markasız. */
export const CABIN = {
  /** Sürücü / yolcu koltuk ekseni (direksiyon sol tarafta) */
  seatX: 0.38,
  halfWidth: 0.72,
  floorY: 0.34,
  dashHalfWidth: 0.7,
  /** Torpido yan profili (z, y) */
  dashProfile: [
    [0.5, 0.52],
    [0.5, 0.9],
    [0.38, 0.96],
    [0.22, 0.97],
    [0.17, 0.93],
    [0.15, 0.86],
    [0.24, 0.78],
    [0.3, 0.55],
  ] as const,
  wheel: { y: 0.92, z: 0.07, tilt: 0.42, radius: 0.18, tube: 0.014 },
  cluster: { y: 0.915, z: 0.2, width: 0.3, height: 0.12, tilt: 0.45 },
  /** Direksiyon simidi dönüş oranı: tekerlek açısı (rad) × bu = simit açısı */
  steeringRatio: 7,
  roofY: 1.27,
} as const;

export type MaterialKey = 'interior' | 'trim' | 'chrome' | 'carpet' | 'glassTint';

export type CabinPart = {
  key: string;
  geometry: BufferGeometry;
  position: Vec3;
  rotation?: Vec3;
  material: MaterialKey;
};

/** Torpido: yan profil (z, y) x boyunca ekstrüde edilir. */
export function dashGeometry(): BufferGeometry {
  const shape = new Shape();
  // Şekil x ekseni = −z: ekstrüzyon sonrası Y etrafında döndürülerek genişlik x'e yatar
  CABIN.dashProfile.forEach(([z, y], i) => (i === 0 ? shape.moveTo(-z, y) : shape.lineTo(-z, y)));
  shape.closePath();
  const width = CABIN.dashHalfWidth * 2;
  const g = new ExtrudeGeometry(shape, {
    depth: width,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 2,
    curveSegments: 4,
  });
  g.translate(0, 0, -width / 2);
  g.rotateY(Math.PI / 2);
  return g;
}

const rounded = (w: number, h: number, d: number, r: number, seg = 3) =>
  new RoundedBoxGeometry(w, h, d, seg, r);

/** Koltuk: minder, sırt, kafalık (dikiş çizgisi için ince çıta). */
function seat(x: number, key: string, z: number): CabinPart[] {
  return [
    {
      key: `${key}-cushion`,
      geometry: rounded(0.48, 0.13, 0.5, 0.05),
      position: [x, 0.5, z],
      material: 'interior',
    },
    {
      key: `${key}-back`,
      geometry: rounded(0.46, 0.62, 0.12, 0.05),
      position: [x, 0.85, z - 0.25],
      rotation: [-0.22, 0, 0],
      material: 'interior',
    },
    {
      key: `${key}-head`,
      geometry: rounded(0.22, 0.17, 0.09, 0.04),
      position: [x, 1.24, z - 0.33],
      rotation: [-0.22, 0, 0],
      material: 'interior',
    },
    {
      key: `${key}-seam`,
      geometry: new BoxGeometry(0.02, 0.5, 0.01),
      position: [x, 0.85, z - 0.185],
      rotation: [-0.22, 0, 0],
      material: 'trim',
    },
  ];
}

/** Direksiyon simidi geometrileri (simit + 3 kol + göbek), orijini göbek merkezi. */
export function wheelParts(): { geometry: BufferGeometry; position: Vec3; rotation?: Vec3 }[] {
  const { radius, tube } = CABIN.wheel;
  const spoke = (angle: number) => ({
    geometry: new BoxGeometry(radius * 0.95, 0.03, 0.018),
    position: [Math.cos(angle) * radius * 0.47, Math.sin(angle) * radius * 0.47, 0] as Vec3,
    rotation: [0, 0, angle] as Vec3,
  });
  return [
    { geometry: new TorusGeometry(radius, tube, 8, 28), position: [0, 0, 0] },
    spoke(0),
    spoke(Math.PI),
    spoke(-Math.PI / 2),
    {
      geometry: new CylinderGeometry(0.05, 0.055, 0.04, 14),
      position: [0, 0, 0.005],
      rotation: [Math.PI / 2, 0, 0],
    },
  ];
}

/** Sabit iç mekân parçaları (direksiyon ve gösterge ayrı: hareketli/canlı). */
export function cabinParts(): CabinPart[] {
  const { seatX, halfWidth, floorY } = CABIN;
  const parts: CabinPart[] = [];
  parts.push({
    key: 'dash',
    geometry: dashGeometry(),
    position: [0, 0, 0],
    material: 'interior',
  });
  // Gösterge kuvözü (çıkıntı)
  parts.push({
    key: 'binnacle',
    geometry: rounded(0.36, 0.05, 0.13, 0.02),
    position: [seatX, 0.985, 0.2],
    rotation: [0.1, 0, 0],
    material: 'trim',
  });
  // Klima ızgaraları (orta torpido)
  [-0.12, 0, 0.12].forEach((dx, i) =>
    parts.push({
      key: `vent-${i}`,
      geometry: rounded(0.09, 0.045, 0.02, 0.008),
      position: [dx - 0.01, 0.9, 0.2],
      rotation: [0.25, 0, 0],
      material: 'trim',
    }),
  );
  // Orta konsol + vites kolu + el freni
  parts.push({
    key: 'console',
    geometry: rounded(0.22, 0.2, 1.0, 0.04),
    position: [0, 0.5, -0.15],
    material: 'interior',
  });
  parts.push({
    key: 'shifter-stick',
    geometry: new CylinderGeometry(0.011, 0.014, 0.24, 8),
    position: [0, 0.72, 0.02],
    rotation: [-0.12, 0, 0],
    material: 'chrome',
  });
  parts.push({
    key: 'shifter-knob',
    geometry: new SphereGeometry(0.033, 12, 8),
    position: [0, 0.85, -0.005],
    material: 'trim',
  });
  parts.push({
    key: 'handbrake',
    geometry: rounded(0.035, 0.03, 0.26, 0.012),
    position: [0.13, 0.62, -0.32],
    rotation: [0.15, 0, 0],
    material: 'trim',
  });
  // Koltuklar + arka bench
  parts.push(...seat(seatX, 'driver', -0.25), ...seat(-seatX, 'pax', -0.25));
  parts.push(
    {
      key: 'bench',
      geometry: rounded(1.28, 0.13, 0.46, 0.05),
      position: [0, 0.5, -1.05],
      material: 'interior',
    },
    {
      key: 'bench-back',
      geometry: rounded(1.28, 0.55, 0.12, 0.05),
      position: [0, 0.82, -1.3],
      rotation: [-0.2, 0, 0],
      material: 'interior',
    },
  );
  // Kapı panelleri: panel, kol dayama, kapı kolu, cam düğmesi
  [1, -1].forEach((s) => {
    const x = s * (halfWidth - 0.04);
    parts.push(
      {
        key: `door-${s}`,
        geometry: rounded(0.06, 0.5, 1.4, 0.02),
        position: [x, 0.62, -0.62],
        material: 'interior',
      },
      {
        key: `armrest-${s}`,
        geometry: rounded(0.09, 0.07, 0.55, 0.03),
        position: [x - s * 0.04, 0.84, -0.5],
        material: 'trim',
      },
      {
        key: `handle-${s}`,
        geometry: rounded(0.04, 0.03, 0.16, 0.012),
        position: [x - s * 0.04, 0.9, -0.12],
        material: 'chrome',
      },
      {
        key: `crank-${s}`,
        geometry: new CylinderGeometry(0.018, 0.018, 0.03, 10),
        position: [x - s * 0.045, 0.78, -0.88],
        rotation: [0, 0, Math.PI / 2],
        material: 'chrome',
      },
    );
  });
  // Tavan döşemesi + dikiz aynası
  parts.push(
    {
      key: 'headliner',
      geometry: rounded(1.12, 0.03, 1.15, 0.012),
      position: [0, CABIN.roofY - 0.02, -0.5],
      material: 'interior',
    },
    {
      key: 'mirror-stalk',
      geometry: new CylinderGeometry(0.008, 0.008, 0.1, 6),
      position: [0, 1.2, 0.12],
      material: 'trim',
    },
    {
      key: 'mirror',
      geometry: rounded(0.24, 0.07, 0.025, 0.012),
      position: [0, 1.14, 0.1],
      material: 'trim',
    },
  );
  // Pedallar (gaz / fren / debriyaj) ve zemin
  [-0.1, 0, 0.1].forEach((dx, i) =>
    parts.push({
      key: `pedal-${i}`,
      geometry: new BoxGeometry(i === 1 ? 0.07 : 0.06, 0.1, 0.012),
      position: [seatX + dx, 0.45, 0.36],
      rotation: [0.55, 0, 0],
      material: i === 1 ? 'chrome' : 'trim',
    }),
  );
  parts.push({
    key: 'floor',
    geometry: new BoxGeometry(halfWidth * 2 - 0.1, 0.02, 2.0),
    position: [0, floorY + 0.03, -0.55],
    material: 'carpet',
  });
  return parts;
}

/** Üçgen sayısı (indeksli ve indekssiz geometri için) */
export function triangleCount(g: BufferGeometry): number {
  return (g.index ? g.index.count : (g.attributes.position?.count ?? 0)) / 3;
}
