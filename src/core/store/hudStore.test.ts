import { describe, expect, it } from 'vitest';
import { DEFAULT_HUD_SETTINGS, resolveTouch, sanitizeHudSettings } from './hudStore';

describe('hudStore', () => {
  it('bozuk girdide varsayılanlara döner (lambalar kapalı, hayalet açık)', () => {
    expect(sanitizeHudSettings(null)).toEqual(DEFAULT_HUD_SETTINGS);
    expect(sanitizeHudSettings({ showLamps: 'x', controlScheme: 'gyro' })).toEqual(
      DEFAULT_HUD_SETTINGS,
    );
    expect(DEFAULT_HUD_SETTINGS.showLamps).toBe(false);
    expect(DEFAULT_HUD_SETTINGS.showGhost).toBe(true);
  });
  it('geçerli değerleri korur', () => {
    expect(
      sanitizeHudSettings({ showLamps: true, showGhost: false, controlScheme: 'keyboard' }),
    ).toEqual({ showLamps: true, showGhost: false, controlScheme: 'keyboard' });
  });
  it('kontrol düzeni: otomatik cihaza bakar, açık seçim cihazı geçersiz kılar', () => {
    expect(resolveTouch('auto', true)).toBe(true);
    expect(resolveTouch('auto', false)).toBe(false);
    expect(resolveTouch('keyboard', true)).toBe(false);
    expect(resolveTouch('touch', false)).toBe(true);
  });
});
