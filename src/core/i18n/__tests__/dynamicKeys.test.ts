import { describe, expect, it } from 'vitest';
import { ptBR } from '../locales/pt-BR';
import { enUS } from '../locales/en-US';
import { PARQ_FOLLOWUPS, PARQ_KEYS } from '../../engine/screening';
import { RANKS, type Equipment, type Limitation, type Pattern, type ScreeningResult } from '../../types';
import { SHADOWS } from '../../../data/shadows';
import { SHADOW_RULES } from '../../../data/shadowRules';

/**
 * Chaves montadas em tempo de execução (`t(\`parq.${key}\` as TKey)`) escapam
 * do typecheck: o cast silencia o compilador. Este teste é a rede de proteção
 * — uma chave dinâmica faltando apareceria como texto cru na tela.
 */
function get(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>(
    (o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), obj);
}

const PATTERNS: Pattern[] = [
  'push_h', 'push_v', 'pull_h', 'pull_v', 'squat', 'hinge', 'unilateral',
  'core_anti_ext', 'core_anti_rot', 'trunk_flex', 'carry', 'aerobic', 'mobility',
];
const LIMITS: Limitation[] = ['knee', 'lower_back', 'shoulder', 'wrist', 'neck'];
const EQUIPMENT: Equipment[] = ['none', 'band', 'dumbbell', 'pullup_bar', 'gym'];
const RESULTS: ScreeningResult[] = ['cleared', 'caution', 'blocked'];
const BASELINE: Record<string, number> = { stairs: 4, pushups: 5, walk20: 4, detraining: 5 };

const dynamicKeys = [
  ...[...PARQ_KEYS, ...PARQ_FOLLOWUPS].map((k) => `parq.${k}`),
  ...LIMITS.map((k) => `limits.${k}`),
  ...EQUIPMENT.map((k) => `equipment.${k}`),
  ...PATTERNS.map((k) => `patterns.${k}`),
  ...RANKS.map((k) => `ranks.${k}`),
  ...RESULTS.map((k) => `settings.screening.${k}`),
  ...['fat_loss', 'strength', 'health', 'habit'].map((k) => `goals.${k}`),
  ...['home', 'gym', 'outdoor'].map((k) => `locations.${k}`),
  ...['noIllustration', 'contraindicated', 'rankLocked', 'current', 'mastered', 'available'].map((k) => `codex.state.${k}`),
  ...['goalPush', 'goalSitups', 'goalSquats', 'goalRun'].map((k) => `onboarding.${k}`),
  ...['STR', 'AGI', 'VIT', 'PER', 'INT'].flatMap((k) => [`status.attributes.${k}`, `status.attributesShort.${k}`]),
  ...['soldier', 'elite', 'knight', 'commander', 'marshal', 'general'].map((k) => `army.grades.${k}`),
  ...Object.entries(SHADOW_RULES).filter(([, r]) => r.kind === 'unavailable').map(([id]) => `army.unavailableReason.${id}`),
  ...Object.entries(BASELINE).flatMap(([k, n]) =>
    [`baseline.${k}.q`, ...Array.from({ length: n }, (_, i) => `baseline.${k}.o${i}`)]),
];

describe('chaves dinâmicas', () => {
  it.each(dynamicKeys)('%s existe nos dois idiomas', (key) => {
    expect(typeof get(ptBR, key)).toBe('string');
    expect(typeof get(enUS, key)).toBe('string');
  });

  it('toda sombra tem grau traduzido', () => {
    for (const s of SHADOWS) expect(typeof get(ptBR, `army.grades.${s.grade}`)).toBe('string');
  });
});

describe('placeholders', () => {
  function leaves(obj: unknown, prefix = ''): [string, string][] {
    if (typeof obj === 'string') return [[prefix, obj]];
    return Object.entries(obj as Record<string, unknown>)
      .flatMap(([k, v]) => leaves(v, prefix ? `${prefix}.${k}` : k));
  }
  const params = (s: string) => [...s.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort();

  it('pt-BR e en-US usam os mesmos parâmetros em cada chave', () => {
    const en = new Map(leaves(enUS));
    for (const [key, pt] of leaves(ptBR)) {
      expect({ key, params: params(en.get(key) ?? '') }).toEqual({ key, params: params(pt) });
    }
  });

  it('nenhum texto promete caixa de loot (recurso removido)', () => {
    for (const [, v] of [...leaves(ptBR), ...leaves(enUS)]) expect(v.toLowerCase()).not.toMatch(/loot/);
  });
});
