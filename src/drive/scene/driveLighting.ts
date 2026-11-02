import { Vector3 } from 'three';

/** Gün batımı / gece ayarları (sahne kodunda sihirli sayı olmasın). */
export const driveLighting = {
  sunset: {
    background: '#e8a36e',
    fog: { color: '#d99a72', near: 80, far: 1500 },
    sky: { horizon: '#f2b27c', zenith: '#4a7fc4', glow: '#ff9a4a' },
    sunDirection: new Vector3(-0.8, 0.22, 0.55).normalize(),
    sunColor: '#ffb06a',
    sunIntensity: 3.4,
    hemi: { sky: '#ffcfa0', ground: '#4a3a28', intensity: 0.7 },
    envIntensity: 1,
  },
  night: {
    background: '#0d1426',
    fog: { color: '#101830', near: 70, far: 1500 },
    sky: { horizon: '#1c2a52', zenith: '#070d1e', glow: '#5a6cb0' },
    sunDirection: new Vector3(0.5, 0.6, -0.6).normalize(),
    sunColor: '#a8bcff',
    sunIntensity: 3.4,
    hemi: { sky: '#6a82c8', ground: '#2a3150', intensity: 2.6 },
    envIntensity: 1.5,
  },
} as const;
