import { useMemo } from 'react';
import { create } from 'zustand';
import {
  getLocale, setLocale as applyLocale, setTone as applyTone, systemText, t,
  type Locale, type SystemTone, type TKey,
} from '../../core/i18n';
import { DEFAULT_PREFS, type NotificationPrefs } from '../../core/notifications/schedule';
import { repositories } from '../../core/repositories';
import type { UserProfile } from '../../core/types';

const PREFS_KEY = 'notification_prefs';

interface SettingsState {
  locale: Locale;
  tone: SystemTone;
  units: UserProfile['units'];
  notifications: NotificationPrefs;
  /** Carrega do perfil e do estado do app. Chamado no boot. */
  hydrate(profile: UserProfile | null, fallbackLocale: Locale): Promise<void>;
  setLocale(l: Locale): void;
  setTone(t: SystemTone): void;
  setUnits(u: Partial<UserProfile['units']>): void;
  setNotifications(p: Partial<NotificationPrefs>): void;
}

/**
 * Idioma, tom e unidades vivem no PERFIL — uma versão anterior guardava só
 * em memória, e tudo voltava ao padrão quando o app fechava. Quem persiste o
 * perfil é o store do caçador; este store avisa por `onPersist`.
 */
let onPersist: ((patch: Partial<UserProfile>) => void) | null = null;
export function bindProfilePersistence(fn: (patch: Partial<UserProfile>) => void) {
  onPersist = fn;
}

export const useSettings = create<SettingsState>((set, get) => ({
  locale: getLocale(),
  tone: 'cold',
  units: { mass: 'kg', length: 'cm' },
  notifications: DEFAULT_PREFS,

  async hydrate(profile, fallbackLocale) {
    const locale = profile?.locale ?? fallbackLocale;
    const tone = profile?.systemTone ?? 'cold';
    applyLocale(locale);
    applyTone(tone);
    const raw = await repositories.app.getValue(PREFS_KEY);
    let notifications = DEFAULT_PREFS;
    try { if (raw) notifications = { ...DEFAULT_PREFS, ...JSON.parse(raw) }; } catch { /* mantém o padrão */ }
    set({ locale, tone, units: profile?.units ?? { mass: 'kg', length: 'cm' }, notifications });
  },

  setLocale(locale) {
    applyLocale(locale);
    set({ locale });
    onPersist?.({ locale });
  },
  setTone(tone) {
    applyTone(tone);
    set({ tone });
    onPersist?.({ systemTone: tone });
  },
  setUnits(u) {
    const units = { ...get().units, ...u };
    set({ units });
    onPersist?.({ units });
  },
  setNotifications(p) {
    const notifications = { ...get().notifications, ...p };
    set({ notifications });
    void repositories.app.setValue(PREFS_KEY, JSON.stringify(notifications));
  },
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

export function useLocale(): Locale {
  return useSettings((s) => s.locale);
}
