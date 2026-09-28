import { TEST_BUILD } from '../core/config';
import type { ShadowRule } from '../core/engine/shadows';

/**
 * Sombras que dependem de passos/distância vindos do HealthKit ou do Health
 * Connect. Sem essa conexão (build de teste), ficam indisponíveis em vez de
 * mostrarem uma barra de progresso que nunca anda.
 */
export const HEALTH_SHADOWS = ['sabujo', 'andarilho', 'peregrino'] as const;

/**
 * Regra de cada uma das 40 sombras. O texto em `shadows.ts` é o que o usuário
 * lê; isto é o que o motor avalia. O teste de catálogo garante que as duas
 * listas têm exatamente os mesmos ids.
 */
const BASE_RULES: Record<string, ShadowRule> = {
  sentinela: { kind: 'sessions', count: 1 },
  batedor: { kind: 'streak', days: 7 },
  sabujo: { kind: 'steps_day', steps: 10000 },
  arauto: { kind: 'articles', count: 3 },
  lanceiro: { kind: 'sessions', count: 10 },
  vigia_noturno: { kind: 'late_sessions', count: 5 },
  madrugador: { kind: 'early_sessions', count: 5 },
  peregrino: { kind: 'walk_km', km: 50 },

  guarda: { kind: 'sessions', count: 30 },
  vigia: { kind: 'streak_weeks', weeks: 4 },
  ferreiro: { kind: 'progressions', count: 5 },
  sobrevivente: { kind: 'penalties_cleared', count: 3 },
  retornado: { kind: 'dungeon_return', weeks: 2 },
  cartografo: { kind: 'body_weeks', weeks: 4 },
  disciplinado: { kind: 'deload_honored' },
  arqueiro: { kind: 'exercise_done', exerciseId: 'row_australian' },

  carmesim: { kind: 'exercise_done', exerciseId: 'push_full' },
  berserker: { kind: 'unavailable', reason: 'Chega com o Portal Vermelho' },
  andarilho: { kind: 'steps_streak', days: 30 },
  escalador: { kind: 'exercise_done', exerciseId: 'pullup_full' },
  corredor: { kind: 'exercise_done', exerciseId: 'run_continuous' },
  inabalavel: { kind: 'streak', days: 60 },
  centurião: { kind: 'sessions', count: 100 },
  pedra_angular: { kind: 'exercise_value', exerciseId: 'plank_full', min: 120 },
  pilar: { kind: 'exercise_value', exerciseId: 'squat_full', min: 50 },
  martelo: { kind: 'exercise_value', exerciseId: 'push_full', min: 30 },

  estrategista: { kind: 'unavailable', reason: 'Chega com o planejador de blocos' },
  veterano: { kind: 'days_active', days: 182 },
  mentor: { kind: 'unavailable', reason: 'Chega com as guildas' },
  guardiao: { kind: 'injury_free_days', days: 182 },
  incansavel: { kind: 'streak', days: 120 },
  colecionador: { kind: 'distinct_exercises', count: 40 },

  marechal: { kind: 'rank', rank: 'B' },
  senhor_da_guerra: { kind: 'rank', rank: 'A' },
  imortal: { kind: 'streak', days: 365 },
  arquiteto: { kind: 'unavailable', reason: 'Chega com o editor de programa' },

  general: { kind: 'rank', rank: 'S' },
  monarca: { kind: 'rank_held', rank: 'S', weeks: 12 },
  preparacao: { kind: 'canonical_day' },
  primeiro: { kind: 'from_e_to', rank: 'S' },
};

export const SHADOW_RULES: Record<string, ShadowRule> = TEST_BUILD
  ? {
    ...BASE_RULES,
    ...Object.fromEntries(HEALTH_SHADOWS.map((id) => [
      id, { kind: 'unavailable', reason: 'Sem conexão com HealthKit/Health Connect nesta build' } as ShadowRule,
    ])),
  }
  : BASE_RULES;
