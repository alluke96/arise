import { normalizeEvents, type DomainEvent } from '../sync/events';
import type { Exercise, Rank } from '../types';
import { addDays, daysBetween, eventId } from './calendar';
import { isDeloadWeek } from './guards';
import { RANKS } from '../types';
import { rankAtLeast } from './rank';

/**
 * Regra de desbloqueio de uma sombra.
 *
 * Estruturada, não texto: é o que permite o motor decidir sozinho quando uma
 * sombra é extraída e mostrar o progresso até a próxima. As que dependem de
 * funcionalidade ainda inexistente são `unavailable` — aparecem bloqueadas com
 * o motivo, em vez de fingir que são alcançáveis.
 */
export type ShadowRule =
  | { kind: 'sessions'; count: number }
  | { kind: 'streak'; days: number }
  | { kind: 'streak_weeks'; weeks: number }
  | { kind: 'rank'; rank: Rank }
  | { kind: 'rank_held'; rank: Rank; weeks: number }
  | { kind: 'from_e_to'; rank: Rank }
  | { kind: 'penalties_cleared'; count: number }
  | { kind: 'exercise_done'; exerciseId: string }
  | { kind: 'exercise_value'; exerciseId: string; min: number }
  | { kind: 'distinct_exercises'; count: number }
  | { kind: 'progressions'; count: number }
  | { kind: 'late_sessions'; count: number }
  | { kind: 'early_sessions'; count: number }
  | { kind: 'days_active'; days: number }
  | { kind: 'injury_free_days'; days: number }
  | { kind: 'dungeon_return'; weeks: number }
  | { kind: 'deload_honored' }
  | { kind: 'canonical_day' }
  | { kind: 'steps_day'; steps: number }
  | { kind: 'steps_streak'; days: number }
  | { kind: 'articles'; count: number }
  | { kind: 'walk_km'; km: number }
  | { kind: 'body_weeks'; weeks: number }
  | { kind: 'unavailable'; reason: string };

/** Dados que não vivem no log de treino: saúde, leitura, medidas. */
export interface StatsExtras {
  maxStepsDay: number;
  stepsStreak7k: number;
  articlesRead: number;
  walkKm: number;
  bodyMetricWeeks: number;
}

export const NO_EXTRAS: StatsExtras = {
  maxStepsDay: 0, stepsStreak7k: 0, articlesRead: 0, walkKm: 0, bodyMetricWeeks: 0,
};

export interface HunterStats extends StatsExtras {
  sessions: number;
  streakBest: number;
  rank: Rank;
  placedRank: Rank;
  rankReachedOn: Partial<Record<Rank, string>>;
  penaltiesCleared: number;
  exercisesDone: Set<string>;
  bestValue: Map<string, number>;
  progressions: number;
  lateSessions: number;
  earlySessions: number;
  daysActive: number;
  injuryFreeDays: number;
  sessionsSinceBreak: number | null;
  deloadWeeksHonored: number;
  canonicalDay: boolean;
  daysPerWeek: number;
  today: string;
}

export interface StatsContext {
  startedAt: string;
  today: string;
  daysPerWeek: number;
  catalog: Exercise[];
  streakBest: number;
  extras?: StatsExtras;
}

export function computeStats(events: DomainEvent[], ctx: StatsContext): HunterStats {
  const byId = new Map(ctx.catalog.map((e) => [e.id, e]));
  const s: HunterStats = {
    ...(ctx.extras ?? NO_EXTRAS),
    sessions: 0, streakBest: ctx.streakBest, rank: 'E', placedRank: 'E', rankReachedOn: { E: ctx.startedAt },
    penaltiesCleared: 0, exercisesDone: new Set(), bestValue: new Map(), progressions: 0,
    lateSessions: 0, earlySessions: 0, daysActive: Math.max(0, daysBetween(ctx.startedAt, ctx.today)),
    injuryFreeDays: Math.max(0, daysBetween(ctx.startedAt, ctx.today)), sessionsSinceBreak: null,
    deloadWeeksHonored: 0, canonicalDay: false, daysPerWeek: ctx.daysPerWeek, today: ctx.today,
  };

  let placed = false;
  const sessionDays: string[] = [];

  for (const e of normalizeEvents(events)) {
    const day = e.at.slice(0, 10);
    switch (e.kind) {
      case 'benchmark_passed':
        if (!placed) { s.placedRank = e.rankAfter; placed = true; }
        s.rank = e.rankAfter;
        for (const r of RANKS) {
          if (rankAtLeast(e.rankAfter, r) && !s.rankReachedOn[r]) s.rankReachedOn[r] = day;
        }
        break;
      case 'penalty_completed': s.penaltiesCleared += 1; break;
      case 'injury_declared':
        s.injuryFreeDays = Math.max(0, daysBetween(day, ctx.today));
        break;
      case 'inactivity_detected': s.sessionsSinceBreak = 0; break;
      case 'session_completed': {
        if (e.session.rest) break;
        s.sessions += 1;
        sessionDays.push(e.session.date ?? day);
        if (s.sessionsSinceBreak !== null) s.sessionsSinceBreak += 1;
        const h = e.session.localHour;
        if (h !== undefined) {
          if (h >= 21) s.lateSessions += 1;
          if (h < 7) s.earlySessions += 1;
        }
        const canon = { push: false, trunk: false, squat: false, run: false };
        for (const r of e.session.results ?? []) {
          if (!r.completed) continue;
          const ex = byId.get(r.exerciseId);
          if (!ex) continue;
          if (!s.exercisesDone.has(ex.id) && ex.regressionId) s.progressions += 1;
          s.exercisesDone.add(ex.id);
          s.bestValue.set(ex.id, Math.max(s.bestValue.get(ex.id) ?? 0, r.value));
          if (ex.pattern === 'push_h' && r.value >= 100) canon.push = true;
          if (ex.pattern === 'trunk_flex' && r.value >= 100) canon.trunk = true;
          if (ex.pattern === 'squat' && r.value >= 100) canon.squat = true;
          if (ex.id === 'run_long') canon.run = true;
        }
        if (canon.push && canon.trunk && canon.squat && canon.run) s.canonicalDay = true;
        break;
      }
      default: break;
    }
  }

  // Semanas de deload já encerradas, cumpridas sem pular dia de treino.
  const weeksElapsed = Math.floor(s.daysActive / 7);
  for (let w = 0; w < weeksElapsed; w++) {
    if (!isDeloadWeek(w)) continue;
    const from = addDays(ctx.startedAt, w * 7);
    const to = addDays(from, 6);
    const n = sessionDays.filter((d) => d >= from && d <= to).length;
    if (n >= ctx.daysPerWeek) s.deloadWeeksHonored += 1;
  }

  return s;
}

const ratio = (have: number, need: number) => (need <= 0 ? 1 : Math.min(1, have / need));

/** Progresso de 0 a 1. 1 = desbloqueada. */
export function ruleProgress(rule: ShadowRule, s: HunterStats): number {
  switch (rule.kind) {
    case 'sessions': return ratio(s.sessions, rule.count);
    case 'streak': return ratio(s.streakBest, rule.days);
    case 'streak_weeks': return ratio(s.streakBest, rule.weeks * s.daysPerWeek);
    case 'rank': return ratio(RANKS.indexOf(s.rank), RANKS.indexOf(rule.rank));
    case 'rank_held': {
      if (!rankAtLeast(s.rank, rule.rank)) return ratio(RANKS.indexOf(s.rank), RANKS.indexOf(rule.rank)) * 0.9;
      const since = s.rankReachedOn[rule.rank];
      return since ? ratio(daysBetween(since, s.today), rule.weeks * 7) : 0;
    }
    case 'from_e_to':
      return s.placedRank === 'E' ? ratio(RANKS.indexOf(s.rank), RANKS.indexOf(rule.rank)) : 0;
    case 'penalties_cleared': return ratio(s.penaltiesCleared, rule.count);
    case 'exercise_done': return s.exercisesDone.has(rule.exerciseId) ? 1 : 0;
    case 'exercise_value': return ratio(s.bestValue.get(rule.exerciseId) ?? 0, rule.min);
    case 'distinct_exercises': return ratio(s.exercisesDone.size, rule.count);
    case 'progressions': return ratio(s.progressions, rule.count);
    case 'late_sessions': return ratio(s.lateSessions, rule.count);
    case 'early_sessions': return ratio(s.earlySessions, rule.count);
    case 'days_active': return ratio(s.daysActive, rule.days);
    case 'injury_free_days': return ratio(s.injuryFreeDays, rule.days);
    case 'dungeon_return':
      return s.sessionsSinceBreak === null ? 0 : ratio(s.sessionsSinceBreak, rule.weeks * s.daysPerWeek);
    case 'deload_honored': return s.deloadWeeksHonored > 0 ? 1 : 0;
    case 'canonical_day': return s.canonicalDay ? 1 : 0;
    case 'steps_day': return ratio(s.maxStepsDay, rule.steps);
    case 'steps_streak': return ratio(s.stepsStreak7k, rule.days);
    case 'articles': return ratio(s.articlesRead, rule.count);
    case 'walk_km': return ratio(s.walkKm, rule.km);
    case 'body_weeks': return ratio(s.bodyMetricWeeks, rule.weeks);
    case 'unavailable': return 0;
  }
}

export interface ShadowEvaluation {
  newlyUnlocked: string[];
  progress: Record<string, number>;
}

export function evaluateShadows(
  rules: Record<string, ShadowRule>, stats: HunterStats, alreadyUnlocked: Set<string>,
): ShadowEvaluation {
  const progress: Record<string, number> = {};
  const newlyUnlocked: string[] = [];
  for (const [id, rule] of Object.entries(rules)) {
    const p = alreadyUnlocked.has(id) ? 1 : ruleProgress(rule, stats);
    progress[id] = p;
    if (p >= 1 && !alreadyUnlocked.has(id) && rule.kind !== 'unavailable') newlyUnlocked.push(id);
  }
  return { newlyUnlocked, progress };
}

export function unlockedFromEvents(events: DomainEvent[]): Set<string> {
  return new Set(events.filter((e) => e.kind === 'shadow_unlocked')
    .map((e) => (e as Extract<DomainEvent, { kind: 'shadow_unlocked' }>).shadowId));
}

export function shadowUnlockEvent(id: string, at: string, deviceId: string): DomainEvent {
  return { id: `shadow:${id}`, at, deviceId, kind: 'shadow_unlocked', shadowId: id };
}

