import { useMemo } from 'react';
import { create } from 'zustand';
import {
  getLocale, setLocale as applyLocale, setTone as applyTone, systemText, t,
  type Locale, type SystemTone, type TKey,
} from '../../core/i18n';
import { DEFAULT_PREFS, type NotificationPrefs } from '../../core/notifications/schedule';
import type { UserProfile } from '../../core/types';

interface SettingsState {
  locale: Locale;
  tone: SystemTone;
  units: UserProfile['units'];
  notifications: NotificationPrefs;
  setLocale: (l: Locale) => void;
  setTone: (t: SystemTone) => void;
  setUnits: (u: Partial<UserProfile['units']>) => void;
  setNotifications: (p: Partial<NotificationPrefs>) => void;
}

export const useSettings = create<SettingsState>((set, get) => ({
  locale: getLocale(),
  tone: 'cold',
  units: { mass: 'kg', length: 'cm' },
  notifications: DEFAULT_PREFS,

  setLocale(l) { applyLocale(l); set({ locale: l }); },
  setTone(tone) { applyTone(tone); set({ tone }); },
  setUnits(u) { set({ units: { ...get().units, ...u } }); },
  setNotifications(p) { set({ notifications: { ...get().notifications, ...p } }); },
}));

/**
 * Hook de tradução.
 *
 * Lê apenas PRIMITIVOS do store e devolve uma função memoizada. Um selector
 * que montasse objeto novo faria o Zustand v5 ver snapshot diferente a cada
 * render e entrar em loop infinito — foi assim que a tela de Status quebrou
 * antes. Aqui `locale` é string e `useMemo` mantém a referência estável.
 */
export function useT() {
  const locale = useSettings((s) => s.locale);
  return useMemo(
    () => (key: TKey, params?: Record<string, string | number>) => t(key, params, locale),
    [locale],
  );
}

/** Mensagens do Sistema, resolvidas no tom e idioma ativos. */
export function useSystemText() {
  const locale = useSettings((s) => s.locale);
  const tone = useSettings((s) => s.tone);
  return useMemo(
    () => (key: Parameters<typeof systemText>[0], params?: Record<string, string | number>) =>
      systemText(key, params, tone, locale),
    [locale, tone],
  );
}
