import { enUS } from './locales/en-US';
import { ptBR, type Translations } from './locales/pt-BR';

export type Locale = 'pt-BR' | 'en-US';
export type SystemTone = 'cold' | 'companion';

const RESOURCES: Record<Locale, Translations> = { 'pt-BR': ptBR, 'en-US': enUS };

export const LOCALES: Locale[] = ['pt-BR', 'en-US'];
export const LOCALE_LABEL: Record<Locale, string> = {
  'pt-BR': 'Português (Brasil)',
  'en-US': 'English (US)',
};

/**
 * Caminho de chave com validação em tempo de compilação.
 *
 * Errar uma chave não compila. É a garantia da R14.5 — nenhuma string de
 * interface fora dos arquivos de tradução, e nenhuma chave inexistente
 * chegando em produção como texto cru.
 */
type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${P}${K}`
    : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

export type TKey = Leaves<Translations>;

type Params = Record<string, string | number>;

function resolve(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>(
    (acc, part) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined),
    obj,
  );
}

function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match);
}

let activeLocale: Locale = 'pt-BR';
let activeTone: SystemTone = 'cold';

export function setLocale(locale: Locale): void { activeLocale = locale; }
export function getLocale(): Locale { return activeLocale; }
export function setTone(tone: SystemTone): void { activeTone = tone; }
export function getTone(): SystemTone { return activeTone; }

/** Detecta o idioma do sistema, caindo para pt-BR quando não houver suporte. */
export function resolveLocale(systemTags: readonly string[]): Locale {
  for (const tag of systemTags) {
    const lower = tag.toLowerCase();
    if (lower.startsWith('pt')) return 'pt-BR';
    if (lower.startsWith('en')) return 'en-US';
  }
  return 'pt-BR';
}

export function t(key: TKey, params?: Params, locale: Locale = activeLocale): string {
  const value = resolve(RESOURCES[locale], key);
  if (typeof value === 'string') return interpolate(value, params);

  // Fallback para pt-BR antes de devolver a chave crua: um idioma incompleto
  // deve mostrar texto em outro idioma, nunca "settings.privacy" na tela.
  const fallback = resolve(RESOURCES['pt-BR'], key);
  return typeof fallback === 'string' ? interpolate(fallback, params) : key;
}

type SystemKey = keyof Translations['system'];

/**
 * R14.6/R14.7 — a mesma mensagem em dois tons, nos dois idiomas.
 *
 * O tom frio é o padrão porque é a voz do produto. O Modo Companheiro existe
 * para quem o tom impessoal afasta em vez de motivar.
 */
export function systemText(
  key: SystemKey, params?: Params,
  tone: SystemTone = activeTone, locale: Locale = activeLocale,
): string {
  const entry = RESOURCES[locale].system[key] ?? RESOURCES['pt-BR'].system[key];
  const text = entry?.[tone] ?? entry?.cold;
  return typeof text === 'string' ? interpolate(text, params) : String(key);
}

// ── Unidades: independentes do idioma (R14.3) ───────────────────────────────

export type MassUnit = 'kg' | 'lb';
export type LengthUnit = 'cm' | 'ft';

const KG_TO_LB = 2.2046226218;
const CM_TO_IN = 0.3937007874;

export function formatMass(kg: number, unit: MassUnit, locale: Locale = activeLocale): string {
  const value = unit === 'kg' ? kg : kg * KG_TO_LB;
  return `${formatNumber(value, locale, 1)} ${unit}`;
}

export function formatLength(cm: number, unit: LengthUnit, locale: Locale = activeLocale): string {
  if (unit === 'cm') return `${formatNumber(cm, locale, 0)} cm`;
  const totalInches = cm * CM_TO_IN;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);
  return inches === 12 ? `${feet + 1}'0"` : `${feet}'${inches}"`;
}

/** R14.4 — vírgula decimal em pt-BR, ponto em en-US, via Intl nativo. */
export function formatNumber(value: number, locale: Locale = activeLocale, decimals = 0): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatDate(iso: string, locale: Locale = activeLocale): string {
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short' })
    .format(new Date(`${iso.slice(0, 10)}T12:00:00Z`));
}
