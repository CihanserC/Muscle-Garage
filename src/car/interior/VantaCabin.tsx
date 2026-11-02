import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  CanvasTexture,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NoColorSpace,
  Vector3,
} from 'three';
import { useDriveStore } from '../../core/store/driveStore';
import { useCarMaterials } from '../materials/useCarMaterials';
import { CABIN, cabinParts, wheelParts, type MaterialKey } from './cabinGeometry';
import { drawCluster, GAUGE_CANVAS } from './gaugeCanvas';

/** Bu uzaklıktan (m) sonra küçük detaylar gizlenir (LOD) */
const DETAIL_DISTANCE = 7;
/** Göstergeler en çok bu sıklıkta (sn) yeniden çizilir */
const GAUGE_INTERVAL = 0.1;
/** Yalnız yakından görünen küçük parçalar */
const DETAIL_KEYS =
  /^(vent|binnacle|shifter|handbrake|armrest|handle|crank|mirror|pedal|driver-seam|pax-seam)/;

const tmp = new Vector3();

type GaugeState = {
  ctx: CanvasRenderingContext2D;
  texture: CanvasTexture;
  elapsed: number;
  speed: number;
  rpm: number;
};

/**
 * Canlı gösterge kümesi: hız ve devir kadranlarını drive HUD değerleriyle yeniden çizer
 * (en çok 10 Hz, yalnız değer değişince).
 */
function Cluster() {
  const mesh = useRef<Mesh>(null);
  const gauge = useRef<GaugeState | null>(null);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = GAUGE_CANVAS.width;
    canvas.height = GAUGE_CANVAS.height;
    const ctx = canvas.getContext('2d');
    if (!ctx || !mesh.current) return;
    const texture = new CanvasTexture(canvas);
    // Canvas'ı sRGB olarak her karede yüklemek pahalı: renkler doğrusal çizilir (gaugeCanvas)
    texture.colorSpace = NoColorSpace;
    const material = new MeshBasicMaterial({
      map: texture,
      toneMapped: false,
      name: 'mat_cluster',
    });
    mesh.current.material = material;
    drawCluster(ctx, 0, 0, 6000);
    texture.needsUpdate = true;
    gauge.current = { ctx, texture, elapsed: 0, speed: -1, rpm: -1 };
    return () => {
      gauge.current = null;
      texture.dispose();
      material.dispose();
    };
  }, []);

  useFrame((_, delta) => {
    const g = gauge.current;
    if (!g) return;
    g.elapsed += delta;
    if (g.elapsed < GAUGE_INTERVAL) return;
    const hud = useDriveStore.getState().hud;
    const speed = Math.round(hud.speedKmh / 2) * 2;
    const rpm = Math.round(hud.rpm / 50) * 50;
    if (speed === g.speed && rpm === g.rpm) return;
    g.elapsed = 0;
    g.speed = speed;
    g.rpm = rpm;
    drawCluster(g.ctx, speed, rpm, hud.redlineRpm);
    g.texture.needsUpdate = true;
  });

  const c = CABIN.cluster;
  return (
    <mesh position={[CABIN.seatX, c.y, c.z - 0.045]} rotation={[c.tilt, Math.PI, 0]}>
      <planeGeometry args={[c.width, c.height]} />
    </mesh>
  );
}

/**
 * Vanta iç mekânı: kıvrımlı torpido, canlı göstergeler, dönen direksiyon, koltuklar, kapı
 * panelleri, tavan döşemesi, pedallar, konsol ve vites kolu. Yakından detaylı, uzaktan sade.
 */
export function VantaCabin() {
  const m = useCarMaterials();
  const parts = useMemo(() => cabinParts(), []);
  const wheel = useMemo(() => wheelParts(), []);
  const own = useMemo(
    () => ({
      chrome: new MeshStandardMaterial({
        color: '#c9ccd1',
        metalness: 1,
        roughness: 0.25,
        name: 'mat_cabin_chrome',
      }),
      carpet: new MeshStandardMaterial({ color: '#1b1a1c', roughness: 1, name: 'mat_carpet' }),
      glassTint: new MeshStandardMaterial({ color: '#10131a', name: 'mat_cabin_tint' }),
    }),
    [],
  );
  const material = (key: MaterialKey) =>
    key === 'interior'
      ? m.interior
      : key === 'trim'
        ? m.blackTrim
        : key === 'chrome'
          ? own.chrome
          : key === 'carpet'
            ? own.carpet
            : own.glassTint;

  const root = useRef<Group>(null);
  const detail = useRef<Group>(null);
  const wheelRef = useRef<Group>(null);

  useEffect(
    () => () => {
      parts.forEach((p) => p.geometry.dispose());
      wheel.forEach((p) => p.geometry.dispose());
      Object.values(own).forEach((mat) => mat.dispose());
    },
    [parts, wheel, own],
  );

  useFrame((state) => {
    const hud = useDriveStore.getState().hud;
    if (wheelRef.current) wheelRef.current.rotation.z = -hud.steerRad * CABIN.steeringRatio;
    if (detail.current && root.current) {
      root.current.getWorldPosition(tmp);
      detail.current.visible = state.camera.position.distanceTo(tmp) < DETAIL_DISTANCE;
    }
  });

  const w = CABIN.wheel;
  return (
    <group ref={root}>
      {parts
        .filter((p) => !DETAIL_KEYS.test(p.key))
        .map((p) => (
          <mesh
            key={p.key}
            geometry={p.geometry}
            position={p.position}
            rotation={p.rotation}
            material={material(p.material)}
          />
        ))}
      <group ref={detail}>
        {parts
          .filter((p) => DETAIL_KEYS.test(p.key))
          .map((p) => (
            <mesh
              key={p.key}
              geometry={p.geometry}
              position={p.position}
              rotation={p.rotation}
              material={material(p.material)}
            />
          ))}
        <Cluster />
      </group>
      <group position={[CABIN.seatX, w.y, w.z]} rotation-x={w.tilt}>
        <group ref={wheelRef}>
          {wheel.map((p, i) => (
            <mesh
              key={i}
              geometry={p.geometry}
              position={p.position}
              rotation={p.rotation}
              material={m.blackTrim}
            />
          ))}
        </group>
      </group>
    </group>
  );
}
