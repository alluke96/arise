import type { Progression } from '../types';

export type StreakState =
  | 'active' | 'penalty' | 'zeroed' | 'frozen' | 'injured' | 'dungeon_break';

export const PENALTY_DURATION_SECONDS = 240;
export const PENALTY_MAX_RPE = 3;
export const MONTHLY_RECOVERY_STONES = 2;
export const DUNGEON_BREAK_AFTER_DAYS = 3;
export const REENTRY_SESSIONS = 3;
export const REENTRY_VOLUME_FACTOR = 0.5;

export type StreakEvent =
  | { type: 'quest_completed' }
  | { type: 'deadline_missed' }
  | { type: 'penalty_completed' }
  | { type: 'penalty_skipped' }
  | { type: 'stone_used' }
  | { type: 'injury_declared' }
  | { type: 'injury_cleared' }
  | { type: 'days_inactive'; days: number };

export interface StreakSnapshot {
  state: StreakState;
  streakCurrent: number;
  streakBest: number;
  recoveryStones: number;
  reentrySessionsLeft: number;
}

/**
 * R8 — máquina de estados da sequência.
 *
 * REGRA CENTRAL (R8.5): esta função recebe e devolve APENAS estado de
 * sequência. Nível, rank, atributos e histórico não aparecem na assinatura,
 * então nenhuma transição pode tocá-los. A garantia é estrutural, não de
 * disciplina.
 */
export function streakTransition(s: StreakSnapshot, e: StreakEvent): StreakSnapshot {
  switch (e.type) {
    case 'quest_completed': {
      if (s.state === 'injured') return s;
      const next = s.streakCurrent + 1;
      return {
        ...s,
        state: s.reentrySessionsLeft > 1 ? 'dungeon_break' : 'active',
        streakCurrent: next,
        streakBest: Math.max(s.streakBest, next),
        reentrySessionsLeft: Math.max(0, s.reentrySessionsLeft - 1),
      };
    }
    case 'deadline_missed':
      if (s.state === 'injured' || s.state === 'frozen') return s;
      return { ...s, state: 'penalty' };

    /** R8.3 — concluir os 4 minutos restaura a sequência. */
    case 'penalty_completed':
      return { ...s, state: 'active' };

    /** R8.4 — não concluir zera SOMENTE a sequência. */
    case 'penalty_skipped':
      return { ...s, state: 'zeroed', streakCurrent: 0 };

    case 'stone_used':
      if (s.recoveryStones <= 0) return s;
      return { ...s, state: 'frozen', recoveryStones: s.recoveryStones - 1 };

    /** R8.9 — lesão pausa a sequência sem custo de pedra. */
    case 'injury_declared':
      return { ...s, state: 'injured' };
    case 'injury_cleared':
      return { ...s, state: 'active' };

    /** R9 — 3 dias parado dispara o Dungeon Break. */
    case 'days_inactive':
      if (e.days < DUNGEON_BREAK_AFTER_DAYS) return s;
      return {
        ...s,
        state: 'dungeon_break',
        streakCurrent: 0,
        reentrySessionsLeft: REENTRY_SESSIONS,
      };
    default:
      return s;
  }
}

/** R9.2 — durante a reentrada, metade do volume. */
export function reentryFactor(snapshot: StreakSnapshot): number {
  return snapshot.reentrySessionsLeft > 0 ? REENTRY_VOLUME_FACTOR : 1;
}

export function snapshotFrom(p: Progression, state: StreakState = 'active'): StreakSnapshot {
  return {
    state,
    streakCurrent: p.streakCurrent,
    streakBest: p.streakBest,
    recoveryStones: p.recoveryStones,
    reentrySessionsLeft: 0,
  };
}
