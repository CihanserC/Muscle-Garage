import type { EngineLayer } from '../core/drive/engineLayers';
import layersJson from './engineLayers.json';

const byCar = layersJson as Record<string, EngineLayer[]>;

/** Aracın kayıtlı motor devir katmanları (yoksa boş: sentezlenmiş yedek ses çalar). */
export const engineLayersFor = (carId: string): EngineLayer[] => byCar[carId] ?? [];

/** Katman dosyasının tam URL'si (public/assets/audio/<araç>/<dosya>). */
export const engineLayerUrl = (
  carId: string,
  layer: EngineLayer,
  base: string = import.meta.env.BASE_URL,
): string => `${base}assets/audio/${carId}/${layer.file}`;
