import { useEffect, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { steerFromPointer } from '../../core/input/touch';
import { useDriveStore } from '../../core/store/driveStore';
import { t } from '../../i18n';
import { calibrateGyro, syncGyro } from '../gyroInput';
import { resetTouch, touchState } from '../touchInput';
import './touchControls.css';

type Hold = 'throttle' | 'brake' | 'handbrake' | 'nitro';

/** Basılı tutulan düğme: parmak basılıyken `touchState[hold]` açık. Çoklu dokunma her düğmede ayrı. */
function HoldButton({
  hold,
  className,
  label,
  children,
}: {
  hold: Hold;
  className: string;
  label: string;
  children: ReactNode;
}) {
  const down = useRef<Set<number>>(new Set());
  const apply = () => {
    const on = down.current.size > 0;
    if (hold === 'throttle' || hold === 'brake') touchState[hold] = on ? 1 : 0;
    else touchState[hold] = on;
  };
  const press = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    down.current.add(e.pointerId);
    apply();
  };
  const release = (e: ReactPointerEvent<HTMLButtonElement>) => {
    down.current.delete(e.pointerId);
    apply();
  };
  return (
    <button
      type="button"
      className={`tc-btn ${className}`}
      aria-label={label}
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span>{children}</span>
    </button>
  );
}

/** Direksiyon bölgesi: parmağın yatay konumu analog direksiyon verir. */
function SteerPad() {
  const pad = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLDivElement>(null);
  const active = useRef<number | null>(null);
  const update = (e: ReactPointerEvent<HTMLDivElement>) => {
    const r = pad.current?.getBoundingClientRect();
    if (!r) return;
    const steer = steerFromPointer(e.clientX, r.left, r.width);
    touchState.steer = steer;
    if (thumb.current)
      thumb.current.style.transform = `translateX(${-steer * (r.width / 2 - 28)}px)`;
  };
  const end = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (active.current !== e.pointerId) return;
    active.current = null;
    touchState.steer = 0;
    if (thumb.current) thumb.current.style.transform = 'translateX(0)';
  };
  return (
    <div
      ref={pad}
      className="tc-steer"
      role="group"
      aria-label={t('drive.controls.steer')}
      onPointerDown={(e) => {
        if (active.current !== null) return;
        active.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e);
      }}
      onPointerMove={(e) => {
        if (active.current === e.pointerId) update(e);
      }}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="tc-arrow is-left">◀</span>
      <div ref={thumb} className="tc-thumb" />
      <span className="tc-arrow is-right">▶</span>
    </div>
  );
}

/**
 * Dokunmatik sürüş kontrolleri: solda direksiyon bölgesi, sağda gaz / fren / el freni / nitro,
 * üstte duraklat · kamera · geri koy. Yalnız dokunmatik cihazlarda ve duraklatılmamışken çizilir.
 */
export function TouchControls() {
  const hasNitro = useDriveStore((s) => s.hud.nitro !== null);
  // Kontroller kaldırılınca (duraklat, çıkış) takılı kalan giriş olmasın
  useEffect(() => resetTouch, []);
  // Eğim direksiyonu: ayar açıksa dinle, sürüş başında mevcut tutuşu nötr yap
  useEffect(() => {
    syncGyro();
    calibrateGyro();
  }, []);
  return (
    <div className="tc-root">
      <div className="tc-top">
        <button
          type="button"
          className="tc-small"
          aria-label={t('touch.pause')}
          onClick={() => useDriveStore.getState().escape()}
        >
          ❚❚
        </button>
        <button
          type="button"
          className="tc-small"
          aria-label={t('touch.camera')}
          onClick={() => useDriveStore.getState().cycleCamera()}
        >
          ◉
        </button>
        <button
          type="button"
          className="tc-small"
          aria-label={t('touch.respawn')}
          onClick={() => useDriveStore.getState().respawn()}
        >
          ⟲
        </button>
      </div>
      <SteerPad />
      <div className="tc-right">
        <div className="tc-aux">
          {hasNitro && (
            <HoldButton hold="nitro" className="is-nitro" label={t('touch.nitro')}>
              N₂O
            </HoldButton>
          )}
          <HoldButton hold="handbrake" className="is-hb" label={t('touch.handbrake')}>
            HB
          </HoldButton>
        </div>
        <div className="tc-pedals">
          <HoldButton hold="brake" className="is-brake" label={t('touch.brake')}>
            {t('touch.brake')}
          </HoldButton>
          <HoldButton hold="throttle" className="is-gas" label={t('touch.gas')}>
            {t('touch.gas')}
          </HoldButton>
        </div>
      </div>
    </div>
  );
}
