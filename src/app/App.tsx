import { Fragment, lazy, Suspense, useEffect } from 'react';
import { Canvas, useStore, useThree } from '@react-three/fiber';
import type { PerspectiveCamera } from 'three';
import { GarageScene } from '../garage/scene/GarageScene';
import { startGamepadBridge } from '../core/input/gamepadBridge';
import { useDriveStore } from '../core/store/driveStore';
import { AutoQuality } from './AutoQuality';
import { BootDismiss } from './BootDismiss';
import { CreditsScreen } from '../garage/ui/CreditsScreen';
import { SettingsDialog } from '../garage/ui/SettingsDialog';
import { CarSelect } from '../garage/ui/select/CarSelect';
import { GarageMenu } from '../garage/ui/GarageMenu';
import { TopBar } from '../garage/ui/TopBar';
import { DriveOverlay } from '../drive/ui/DriveOverlay';
import { DEFAULT_CAR_ID, getCar } from '../data/cars';
import { sceneConfig } from '../garage/scene/sceneConfig';
import { useAppStore } from '../core/store/appStore';
import { fitFov, useLayout } from '../core/platform/device';
import { UiLayer } from './UiLayer';
import { TOUCH_MAX_DPR, useQualityPreset } from '../core/store/graphicsStore';
import { usePhotoStore } from '../core/store/photoStore';
import { takePhoto } from '../garage/photo/actions';
import { categoryKind } from '../garage/ui/categories';
import { t, useLocale } from '../i18n';
import '../garage/ui/garage/garageEditor.css';

// Rapier (WASM) ve pist kodu yalnızca test sürüşüne girilince yüklenir.
const DriveScene = lazy(() =>
  import('../drive/scene/DriveScene').then((m) => ({ default: m.DriveScene })),
);

const { manifest } = getCar(DEFAULT_CAR_ID);
const initialCamera = manifest.cameraPresets[manifest.defaultCamera];

/** Fotoğraf modu kısayolları: H arayüzü gizler/gösterir, P fotoğraf çeker. */
function PhotoShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      )
        return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const photo = usePhotoStore.getState();
      if (e.code === 'KeyH') photo.setHideUi(!photo.hideUi);
      else if (e.code === 'KeyP') void takePhoto();
      else if (e.code === 'Escape' && photo.hideUi) photo.setHideUi(false);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      // Fotoğraf kategorisinden çıkılınca arayüz yeniden görünür
      usePhotoStore.getState().setHideUi(false);
    };
  }, []);
  return null;
}

/** Gamepad: menüde gezinti, sürüşte kısayollar (klavye olaylarına çevrilir). */
function useGamepad() {
  useEffect(
    () =>
      startGamepadBridge(() =>
        useAppStore.getState().mode !== 'drive' || useDriveStore.getState().paused
          ? 'menu'
          : 'drive',
      ),
    [],
  );
}

/**
 * Atölye / araç seçimi kadrajı ekran oranına uyar: dar ve dikey ekranda görüş açısı artar (araç
 * kadraja sığar); telefonda yatayken sol paneli telafi etmek için görüntü sağa kayar.
 * Fotoğraf modunda kullanıcının FOV'u geçerlidir.
 */
function FitView({ photo }: { photo: boolean }) {
  const store = useStore();
  const size = useThree((st) => st.size);
  const { isCompact, isPortrait } = useLayout();
  useEffect(() => {
    const cam = store.getState().camera as PerspectiveCamera;
    if (photo) {
      cam.clearViewOffset();
      cam.updateProjectionMatrix();
      return;
    }
    cam.fov = fitFov(sceneConfig.camera.fov, size.width / size.height);
    // Yatay telefonda soldaki panel görüntünün ~%22'sini kaplar: araç boş alanın ortasına kayar
    if (isCompact && !isPortrait)
      cam.setViewOffset(size.width, size.height, -size.width * 0.2, 0, size.width, size.height);
    else cam.clearViewOffset();
    cam.updateProjectionMatrix();
    return () => {
      cam.clearViewOffset();
    };
  }, [store, size.width, size.height, photo, isCompact, isPortrait]);
  return null;
}

export function App() {
  useGamepad();
  const q = useQualityPreset();
  const layout = useLayout();
  const mode = useAppStore((s) => s.mode);
  const photoMode = useAppStore((s) => categoryKind(s.categoryId) === 'photo');
  const hideUi = usePhotoStore((s) => s.hideUi);
  const creditsOpen = useAppStore((s) => s.creditsOpen);
  const settingsOpen = useAppStore((s) => s.settingsOpen);
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const { fov, near, far } = sceneConfig.camera;
  return (
    <>
      <Canvas
        // Gölge türü değişince renderer yeniden kurulsun.
        key={q.shadows ? 'shadows' : 'no-shadows'}
        shadows={q.shadows ? 'soft' : false}
        dpr={[1, layout.isTouch ? Math.min(q.dpr, TOUCH_MAX_DPR) : q.dpr]}
        // Ton eşleme post-processing'de yapılır (AgX/ACES seçimi).
        flat
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        camera={{ position: initialCamera?.position, fov, near, far }}
      >
        <BootDismiss />
        <Suspense fallback={null}>{mode === 'drive' ? <DriveScene /> : <GarageScene />}</Suspense>
        {mode !== 'drive' && <FitView photo={photoMode} />}
      </Canvas>
      <AutoQuality />
      {/* Dil değişince arayüz katmanı yeniden kurulur (önbelleğe alınmış etiketler dahil);
          3B sahne etkilenmez. */}
      <UiLayer>
        <Fragment key={locale}>
          {creditsOpen && <CreditsScreen />}
          {settingsOpen && <SettingsDialog />}
          {mode === 'garage' && photoMode && <PhotoShortcuts />}
          {mode === 'garage' && photoMode && hideUi && (
            <div className="ge-hint">{t('photo.showUi')}</div>
          )}
          {mode === 'select' && (
            <>
              <CarSelect />
              <TopBar />
            </>
          )}
          {mode === 'garage' && !(photoMode && hideUi) && (
            <>
              <GarageMenu />
              <TopBar />
            </>
          )}
          {mode === 'drive' && <DriveOverlay />}
        </Fragment>
      </UiLayer>
    </>
  );
}
