import type { CSSProperties, ReactNode } from 'react';
import { useUiMetrics } from '../core/platform/device';

/**
 * Arayüz katmanı: küçük ekranlarda (telefon) tüm arayüz bu katmanla orantılı küçültülür; katmanın
 * ölçek öncesi boyutu `--uw` / `--uh` (px) değişkenleriyle CSS'e verilir (vw/vh yerine).
 * Masaüstünde ölçek 1'dir ve katman şeffaftır.
 */
export function UiLayer({ children }: { children: ReactNode }) {
  const { scale, width, height } = useUiMetrics();
  const style: CSSProperties =
    scale === 1
      ? ({ ['--uw' as string]: '100vw', ['--uh' as string]: '100dvh' } as CSSProperties)
      : ({
          width,
          height,
          transform: `scale(${scale})`,
          ['--uw' as string]: `${width}px`,
          ['--uh' as string]: `${height}px`,
        } as CSSProperties);
  return (
    <div className={`ui-layer${scale === 1 ? '' : ' is-scaled'}`} style={style}>
      {children}
    </div>
  );
}
