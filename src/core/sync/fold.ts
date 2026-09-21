import { applyXp, calcXp } from '../engine/xp';
import { deriveAttributes, summarize4Weeks } from '../engine/attributes';
import { snapshotFrom, streakTransition, type StreakSnapshot } from '../engine/penalty';
import type { Attribute, Progression, SessionSummary } from '../types';
import { normalizeEvents, type DomainEvent } from './events';

export const INITIAL_PROGRESSION: Progression = {
  level: 1,
  xp: 0,
  rank: 'E',
  attributes: { STR: 0, AGI: 0, VIT: 0, PER: 0, INT: 0 },
  unspentPoints: 0,
  streakCurrent: 0,
  streakBest: 0,
  recoveryStones: 0,
};

/**
 * Entradas que não vêm do log de eventos: passos, sono e leitura vivem em
 * integrações de saúde e conteúdo, não em fatos de treino.
 */
export interface FoldContext {
  avgSteps: number;
  avgSleepHours: number;
  mobilityScore: number;
  articlesRead: number;
  weeksPlanned: number;
}

export const DEFAULT_FOLD_CONTEXT: FoldContext = {
  avgSteps: 0, avgSleepHours: 7, mobilityScore: 50, articlesRead: 0, weeksPlanned: 0,
};

/**
 * Progressão = fold(eventos).
 *
 * Dois aparelhos que viram o mesmo conjunto de eventos chegam ao mesmo estado,
 * em qualquer ordem de chegada. É o que elimina o conflito insolúvel de
 * sincronizar XP como número mutável.
 *
 * Reusa `calcXp`, `applyXp`, `streakTransition` e `deriveAttributes` do motor
 * de propósito: uma segunda implementação divergiria com o tempo, e a
 * divergência apareceria como progresso perdido.
 */
export function foldProgression(
  events: DomainEvent[],
  ctx: FoldContext = DEFAULT_FOLD_CONTEXT,
): Progression {
  const ordered = normalizeEvents(events);

  let prog: Progression = { ...INITIAL_PROGRESSION, attributes: { ...INITIAL_PROGRESSION.attributes } };
  let streak: StreakSnapshot = snapshotFrom(prog);
  const sessions: SessionSummary[] = [];
  const allocated: Record<Attribute, number> = { STR: 0, AGI: 0, VIT: 0, PER: 0, INT: 0 };

  for (const e of ordered) {
    switch (e.kind) {
      case 'session_completed': {
        // XP usa a sequência ANTES do incremento — a ordem é fixada aqui para
        // que o resultado não dependa de detalhe de implementação.
        const gained = calcXp(e.session, streak.streakCurrent);
        prog = applyXp(prog, gained);
        streak = streakTransition(streak, { type: 'quest_completed' });
        sessions.push(e.session);
        break;
      }
      case 'penalty_completed':
        streak = streakTransition(streak, { type: 'penalty_completed' });
        break;
      case 'penalty_skipped':
        streak = streakTransition(streak, { type: 'penalty_skipped' });
        break;
      case 'stone_granted':
        streak = { ...streak, recoveryStones: streak.recoveryStones + e.amount };
        break;
      case 'stone_used':
        streak = streakTransition(streak, { type: 'stone_used' });
        break;
      case 'injury_declared':
        streak = streakTransition(streak, { type: 'injury_declared' });
        break;
      case 'injury_cleared':
        streak = streakTransition(streak, { type: 'injury_cleared' });
        break;
      case 'benchmark_passed':
        prog = { ...prog, rank: e.rankAfter };
        break;
      case 'points_spent':
        // Só gasta o que existe: um evento corrompido não cria pontos.
        if (prog.unspentPoints >= e.amount && e.amount > 0) {
          allocated[e.attribute] += e.amount;
          prog = { ...prog, unspentPoints: prog.unspentPoints - e.amount };
        }
        break;
      case 'shadow_unlocked':
      case 'pain_logged':
        // Não afetam a progressão; foldados em outras projeções.
        break;
    }
  }

  const derived = deriveAttributes({
    resistedVolume4w: summarize4Weeks(sessions),
    aerobicMinutesPerWeek: weeklyAerobic(sessions),
    mobilityScore: ctx.mobilityScore,
    sessionsPerWeek: weeklySessions(sessions),
    avgSteps: ctx.avgSteps,
    avgSleepHours: ctx.avgSleepHours,
    formOkRatio: avgFormOk(sessions),
    articlesRead: ctx.articlesRead,
    weeksPlanned: ctx.weeksPlanned,
  });

  // Atributo = base derivada do treino real + pontos distribuídos pelo usuário.
  const attributes = Object.fromEntries(
    (Object.keys(derived) as Attribute[]).map((k) => [k, derived[k] + allocated[k]]),
  ) as Record<Attribute, number>;

  return {
    ...prog,
    attributes,
    streakCurrent: streak.streakCurrent,
    streakBest: streak.streakBest,
    recoveryStones: streak.recoveryStones,
  };
}

function recent(sessions: SessionSummary[], n: number) {
  return sessions.slice(-n);
}

function weeklyAerobic(sessions: SessionSummary[]): number {
  const r = recent(sessions, 12);
  if (r.length === 0) return 0;
  return r.reduce((a, s) => a + s.aerobicMinutes, 0) / Math.max(1, r.length / 3);
}

function weeklySessions(sessions: SessionSummary[]): number {
  const r = recent(sessions, 12);
  return r.length / 4;
}

function avgFormOk(sessions: SessionSummary[]): number {
  const r = recent(sessions, 12);
  if (r.length === 0) return 0;
  return r.reduce((a, s) => a + s.formOkRatio, 0) / r.length;
}
