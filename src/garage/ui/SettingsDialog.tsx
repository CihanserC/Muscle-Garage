import { useEffect, useState } from 'react';
import { playUiSound } from '../../audio/uiSound';
import { useAppStore } from '../../core/store/appStore';
import { currentLayout } from '../../core/platform/device';
import { TILT_MODES } from '../../core/input/tilt';
import { disableGyro, enableGyro } from '../../drive/gyroInput';
import { useAssistStore } from '../../core/store/assistStore';
import { useDriveStore } from '../../core/store/driveStore';
import { useInputStore } from '../../core/store/inputStore';
import { useAudioStore } from '../../core/store/audioStore';
import { QUALITY_LEVELS, TONE_MAPPINGS, useGraphicsStore } from '../../core/store/graphicsStore';
import { LOCALE_NAMES, LOCALES, t, useLocale, useLocaleStore } from '../../i18n';
import { volumeLabel } from '../../audio/volumeLabel';
import './settings.css';

/** Ses seviyesi basamakları (ayar penceresinde ◀ ▶ ile) */
const VOLUME_OPTIONS = [0, 0.25, 0.5, 0.75, 1] as const;

type Row = {
  id: string;
  label: string;
  value: string;
  /** −1 / +1: değeri değiştir (◀ ▶, sol/sağ ok) */
  step?: (dir: -1 | 1) => void;
  /** Enter / dokunma: eylem satırı ya da değeri ileri al */
  activate?: () => void;
};

const cycle = <T,>(list: readonly T[], value: T, dir: -1 | 1): T =>
  list[(list.indexOf(value) + dir + list.length) % list.length] as T;

function useRows(): Row[] {
  const g = useGraphicsStore();
  const volume = useAudioStore((s) => s.volume);
  const assists = useAssistStore();
  const tilt = useInputStore((st) => st.tilt);
  const timeOfDay = useDriveStore((st) => st.timeOfDay);
  const turntable = useAppStore((s) => s.turntable);
  const locale = useLocale();
  const onOff = (v: boolean) => (v ? t('ui.on') : t('ui.off'));
  const nearestVolume = VOLUME_OPTIONS.reduce((a, b) =>
    Math.abs(b - volume) < Math.abs(a - volume) ? b : a,
  );
  return [
    {
      id: 'language',
      label: t('settings.language'),
      value: LOCALE_NAMES[locale],
      step: (d) => useLocaleStore.getState().setLocale(cycle(LOCALES, locale, d)),
    },
    {
      id: 'quality',
      label: t('ui.quality'),
      value: t(`quality.${g.quality}`),
      step: (d) => g.setQuality(cycle(QUALITY_LEVELS, g.quality, d)),
    },
    {
      id: 'auto',
      label: t('ui.autoQuality'),
      value: onOff(g.autoQuality),
      step: () => g.setAutoQuality(!g.autoQuality),
    },
    {
      id: 'tone',
      label: t('ui.toneMapping'),
      value: t(`toneMapping.${g.toneMapping}`),
      step: (d) => g.setToneMapping(cycle(TONE_MAPPINGS, g.toneMapping, d)),
    },
    {
      id: 'fps',
      label: t('settings.fps'),
      value: onOff(g.showFps),
      step: () => g.setShowFps(!g.showFps),
    },
    {
      id: 'sound',
      label: t('ui.sound'),
      value: volumeLabel(nearestVolume),
      step: (d) => {
        useAudioStore.getState().setVolume(cycle(VOLUME_OPTIONS, nearestVolume, d));
        playUiSound('confirm');
      },
    },
    {
      id: 'turntable',
      label: t('ui.turntable'),
      value: onOff(turntable),
      step: () => useAppStore.getState().toggleTurntable(),
    },
    {
      id: 'steeringAssist',
      label: t('settings.steeringAssist'),
      value: onOff(assists.steeringAssist),
      step: () => assists.setAssist('steeringAssist', !assists.steeringAssist),
    },
    {
      id: 'tractionControl',
      label: t('settings.tractionControl'),
      value: onOff(assists.tractionControl),
      step: () => assists.setAssist('tractionControl', !assists.tractionControl),
    },
    {
      id: 'abs',
      label: t('settings.abs'),
      value: onOff(assists.abs),
      step: () => assists.setAssist('abs', !assists.abs),
    },
    {
      id: 'timeOfDay',
      label: t('drive.pause.time'),
      value: t(`timeOfDay.${timeOfDay}`),
      step: () => useDriveStore.getState().toggleTimeOfDay(),
    },
    // Eğim sensörü yalnız dokunmatik cihazlarda anlamlı
    ...(currentLayout().isTouch
      ? [
          {
            id: 'tilt',
            label: t('settings.tilt'),
            value: t(`tilt.${tilt}`),
            step: (d: -1 | 1) => {
              const next = cycle(TILT_MODES, tilt, d);
              if (next === 'off') disableGyro();
              else void enableGyro(next);
            },
          },
        ]
      : []),
    {
      id: 'credits',
      label: t('ui.credits'),
      value: '›',
      activate: () => {
        const app = useAppStore.getState();
        app.setSettingsOpen(false);
        app.setCreditsOpen(true);
      },
    },
  ];
}

/**
 * Ayarlar penceresi (dişli çark): grafik, ses, sahne ve kredi. Klavye (↑↓ gezin, ←→ değiştir,
 * Enter, Esc), gamepad (klavye olaylarına çevrilir) ve dokunmatik/fare ile kullanılır.
 */
export function SettingsDialog() {
  const rows = useRows();
  const [index, setIndex] = useState(0);
  const close = () => useAppStore.getState().setSettingsOpen(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const row = rows[index];
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowDown') {
        playUiSound('move');
        setIndex((i) => (i + 1) % rows.length);
      } else if (e.key === 'ArrowUp') {
        playUiSound('move');
        setIndex((i) => (i - 1 + rows.length) % rows.length);
      } else if (e.key === 'ArrowLeft') row?.step?.(-1);
      else if (e.key === 'ArrowRight') row?.step?.(1);
      else if (e.key === 'Enter') {
        playUiSound('confirm');
        if (row?.activate) row.activate();
        else row?.step?.(1);
      } else return;
      e.preventDefault();
      // Arkadaki menü bu tuşları işlemesin
      e.stopImmediatePropagation();
    };
    // Yakalama aşamasında: atölye menüsünün işleyicisinden önce çalışır
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });

  return (
    <div
      className="st-backdrop"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label={t('settings.title')}
    >
      <div className="st-panel" onClick={(e) => e.stopPropagation()}>
        <header>
          <h2>{t('settings.title')}</h2>
          <button type="button" onClick={close} aria-label={t('credits.close')}>
            ✕
          </button>
        </header>
        <ul className="st-rows">
          {rows.map((row, i) => (
            <li
              key={row.id}
              className={i === index ? 'is-active' : ''}
              onMouseEnter={() => setIndex(i)}
            >
              <span className="st-label">{row.label}</span>
              {row.step && !row.activate ? (
                <span className="st-value">
                  <button type="button" aria-label="−" onClick={() => row.step?.(-1)}>
                    ◀
                  </button>
                  <strong>{row.value}</strong>
                  <button type="button" aria-label="+" onClick={() => row.step?.(1)}>
                    ▶
                  </button>
                </span>
              ) : (
                <button type="button" className="st-action" onClick={() => row.activate?.()}>
                  {row.value}
                </button>
              )}
            </li>
          ))}
        </ul>
        <footer>{t('settings.hint')}</footer>
      </div>
    </div>
  );
}
