import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  CanvasTexture,
  NoColorSpace,
  type Group,
  type PointLight,
  type SpotLight,
  type SpriteMaterial,
} from 'three';
import { useDriveStore } from '../../core/store/driveStore';
import { lampsFor } from '../../data/cars/lights';

const HEAD = { reach: 30, angle: 0.5, penumbra: 0.6, intensity: 420, glow: 0.8 };
const TAIL = { glow: 0.5, brakeGlow: 1.25, light: 5, brakeLight: 16 };

/** Yumuşak yuvarlak parıltı dokusu (tek örnek; doğrusal uzayda, sRGB dönüşümü yok). */
function createGlowTexture(): CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = NoColorSpace;
  return texture;
}

/**
 * Gece far ve stop lambaları: lens önünde parıltı, farlarda spot ışık, stop lambalarında yere
 * kızıl ışık; frenle birlikte stoplar parlar. Konumlar modelden ölçülmüş (`data/cars/lights.ts`).
 * Gündüz (gün batımı) çizilmez.
 */
export function NightLights({
  rigRef,
  carId,
  halfLength,
  night,
}: {
  rigRef: RefObject<Group | null>;
  carId: string;
  halfLength: number;
  night: boolean;
}) {
  const lamps = useMemo(() => lampsFor(carId, halfLength), [carId, halfLength]);
  const glow = useMemo(() => (night ? createGlowTexture() : null), [night]);
  useEffect(() => () => glow?.dispose(), [glow]);

  const spots = useRef<(SpotLight | null)[]>([]);
  const tailMats = useRef<(SpriteMaterial | null)[]>([]);
  const tailLights = useRef<(PointLight | null)[]>([]);

  // Spot hedefleri araçla birlikte hareket etsin: rig'e eklenir
  useEffect(() => {
    const g = rigRef.current;
    if (!g || !night) return;
    const added: SpotLight[] = [];
    lamps.head.forEach((p, i) => {
      const s = spots.current[i];
      if (!s) return;
      g.add(s.target);
      s.target.position.set(p[0] * 0.7, 0, p[2] + HEAD.reach);
      added.push(s);
    });
    return () => added.forEach((s) => g.remove(s.target));
  }, [rigRef, lamps, night]);

  useFrame(() => {
    if (!night) return;
    const braking = useDriveStore.getState().hud.brake > 0.15;
    tailMats.current.forEach((m) => {
      if (m) m.opacity = braking ? 1 : 0.7;
    });
    tailLights.current.forEach((l) => {
      if (l) l.intensity = braking ? TAIL.brakeLight : TAIL.light;
    });
  });

  if (!night || !glow) return null;
  return (
    <>
      {/* Kabin: kokpit kamerasında iç mekân tamamen kararmasın */}
      <pointLight
        position={[0, 1.05, -0.2]}
        color="#ffd9a0"
        intensity={2.4}
        distance={3.2}
        decay={2}
      />
      {lamps.head.map((p, i) => (
        <group key={`h${i}`}>
          <spotLight
            ref={(s) => {
              spots.current[i] = s;
            }}
            position={[p[0], p[1], p[2] + 0.05]}
            angle={HEAD.angle}
            penumbra={HEAD.penumbra}
            intensity={HEAD.intensity}
            distance={HEAD.reach * 2}
            decay={2}
            color="#fff1d0"
          />
          <sprite position={[p[0], p[1], p[2] + 0.08]} scale={[HEAD.glow, HEAD.glow, 1]}>
            <spriteMaterial
              map={glow}
              color="#fff3d6"
              blending={AdditiveBlending}
              transparent
              depthWrite={false}
              toneMapped={false}
            />
          </sprite>
        </group>
      ))}
      {lamps.tail.map((p, i) => (
        <group key={`t${i}`}>
          <pointLight
            ref={(l) => {
              tailLights.current[i] = l;
            }}
            position={[p[0], p[1], p[2] - 0.15]}
            color="#ff2a18"
            intensity={TAIL.light}
            distance={7}
            decay={2}
          />
          <sprite position={[p[0], p[1], p[2] - 0.06]} scale={[TAIL.glow, TAIL.glow, 1]}>
            <spriteMaterial
              ref={(m) => {
                tailMats.current[i] = m;
              }}
              map={glow}
              color="#ff2a18"
              blending={AdditiveBlending}
              transparent
              opacity={0.7}
              depthWrite={false}
              toneMapped={false}
            />
          </sprite>
        </group>
      ))}
    </>
  );
}
