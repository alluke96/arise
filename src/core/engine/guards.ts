/**
 * GUARDAS DE SEGURANÇA — R15
 *
 * Todo alvo prescrito passa por aqui antes de sair do motor. Nenhum caminho
 * de código pode contorná-los, e nenhuma entrada de usuário ou configuração
 * pode afrouxá-los.
 *
 * Um bug aqui não causa tela feia. Causa lesão.
 */
import type {
  DailyQuest, HealthScreening, PainLogEntry, Pattern, Rank,
} from '../types';
import { rankAtLeast } from './rank';

/** R4.5 — teto duro de aumento de volume semanal. */
export const MAX_WEEKLY_INCREASE = 0.1;

/** R4.8 — deload obrigatório a cada 4 semanas. */
export const DELOAD_EVERY_WEEKS = 4;
export const DELOAD_VOLUME_FACTOR = 0.6;

/** R2.5 — teto de intensidade no Modo Prudência. */
export const CAUTION_MAX_RPE = 5;
export const CAUTION_MAX_RANK: Rank = 'D';

const CAUTION_ALLOWED_PATTERNS: Pattern[] = ['aerobic', 'mobility'];

export interface GuardResult {
  allowed: boolean;
  reason?: string;
  requiresAcknowledgement?: boolean;
}

/**
 * R4.5 — nenhum aumento acima de 10% sobre a semana anterior.
 * Propriedade garantida: para qualquer entrada, a saída nunca excede
 * lastWeekVolume × 1.1.
 */
export function clampWeeklyVolume(proposed: number, lastWeekVolume: number): number {
  if (!Number.isFinite(proposed) || proposed < 0) return 0;
  if (!Number.isFinite(lastWeekVolume) || lastWeekVolume <= 0) return proposed;
  return Math.min(proposed, lastWeekVolume * (1 + MAX_WEEKLY_INCREASE));
}

/**
 * R15.2–4 — a missão canônica (300 reps + 10 km) não existe abaixo do Rank A,
 * e em sessão única exige aviso explícito de rabdomiólise.
 */
export function assertCanonicalAllowed(rank: Rank, singleSession: boolean): GuardResult {
  if (!rankAtLeast(rank, 'A')) {
    return {
      allowed: false,
      reason: 'canonical_requires_rank_a',
    };
  }
  if (singleSession) {
    return {
      allowed: true,
      requiresAcknowledgement: true,
      reason: 'rhabdomyolysis_warning',
    };
  }
  return { allowed: true };
}

/**
 * R2.5 — Modo Prudência: só caminhada, mobilidade e força leve, teto de RPE 5.
 * R15.9 — não existe caminho que contorne isto.
 */
export function applyCautionMode(quest: DailyQuest, screening: HealthScreening): DailyQuest {
  if (screening.result === 'cleared') return quest;

  if (screening.result === 'blocked') {
    return { ...quest, objectives: [], isRestDay: true, status: 'pending' };
  }

  return {
    ...quest,
    rank: rankAtLeast(quest.rank, CAUTION_MAX_RANK) ? CAUTION_MAX_RANK : quest.rank,
    objectives: quest.objectives.map((o) => ({ ...o, targetValue: Math.round(o.targetValue * 0.7) })),
  };
}

export function isCautionPatternAllowed(pattern: Pattern, resistedIsLight: boolean): boolean {
  return CAUTION_ALLOWED_PATTERNS.includes(pattern) || resistedIsLight;
}

/** R4.8/R4.9 — toda 4ª semana é deload, e não é pulável. */
export function isDeloadWeek(weekIndex: number): boolean {
  return weekIndex > 0 && (weekIndex + 1) % DELOAD_EVERY_WEEKS === 0;
}

export function enforceDeload(volume: number, weekIndex: number): number {
  return isDeloadWeek(weekIndex) ? volume * DELOAD_VOLUME_FACTOR : volume;
}

/**
 * R15.5 — dor ARTICULAR (não muscular) duas vezes no mesmo padrão tira o
 * padrão do plano. Dor muscular tardia é esperada e não dispara nada.
 */
export function painfulPatterns(log: PainLogEntry[]): Pattern[] {
  const counts = new Map<Pattern, number>();
  for (const e of log) {
    if (e.kind !== 'joint') continue;
    counts.set(e.pattern, (counts.get(e.pattern) ?? 0) + 1);
  }
  return [...counts.entries()].filter(([, n]) => n >= 2).map(([p]) => p);
}

export function dropPainfulPatterns<T extends { pattern: Pattern }>(
  candidates: T[],
  log: PainLogEntry[],
): T[] {
  const blocked = new Set(painfulPatterns(log));
  return candidates.filter((c) => !blocked.has(c.pattern));
}

/** R15.7 — déficit calórico nunca acima de 20%. */
export function clampCalorieDeficit(tdee: number, requestedDeficit: number): number {
  return Math.min(Math.max(0, requestedDeficit), tdee * 0.2);
}
