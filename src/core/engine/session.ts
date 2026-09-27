import type { DomainEvent } from '../sync/events';
import { DEFAULT_FOLD_CONTEXT, foldAll, type FoldContext } from '../sync/fold';
import type {
  DailyQuest, Exercise, ObjectiveResult, Progression, Rank, RpeBand,
  SessionSummary, UserProfile,
} from '../types';
import { eventId } from './calendar';
import { neighborRung } from './ladder';
import {
  computeStats, evaluateShadows, shadowUnlockEvent, unlockedFromEvents,
  type ShadowRule, type StatsContext,
} from './shadows';
import { POINTS_PER_LEVEL } from './xp';

function toBand(avg: number): RpeBand {
  if (avg < 4.5) return 3;
  if (avg < 6.5) return 5;
  if (avg < 8.5) return 7;
  return 9;
}

/** Transforma a missão do dia no resumo de sessão que vira evento. */
export function summarizeQuest(
  quest: DailyQuest,
  catalog: Exercise[],
  opts: { durationMin: number; localHour?: number },
): SessionSummary {
  if (quest.isRestDay) {
    return {
      date: quest.date, durationMin: 0, avgRpe: 3, completion: 'complete',
      resistedVolume: 0, aerobicMinutes: 0, formOkRatio: 1, results: [],
      localHour: opts.localHour, rest: true,
    };
  }

  const byId = new Map(catalog.map((e) => [e.id, e]));
  const results: ObjectiveResult[] = quest.objectives.map((o) => ({
    exerciseId: o.exerciseId,
    value: o.actualValue,
    completed: o.actualValue >= o.targetValue,
    formOk: o.formOk ?? false,
  }));

  const rated = quest.objectives.filter((o) => o.rpe !== null);
  const avgRpe = rated.length
    ? rated.reduce((a, o) => a + (o.rpe as number), 0) / rated.length
    : 5;

  const judged = quest.objectives.filter((o) => o.formOk !== null);
  const formOkRatio = judged.length ? judged.filter((o) => o.formOk).length / judged.length : 0;

  let resistedVolume = 0;
  let aerobicMinutes = 0;
  for (const o of quest.objectives) {
    const ex = byId.get(o.exerciseId);
    if (!ex) continue;
    if (ex.pattern === 'aerobic') {
      aerobicMinutes += o.unit === 'minutes' ? o.actualValue : 0;
    } else if (ex.pattern !== 'mobility') {
      resistedVolume += o.actualValue * ex.difficulty;
    }
  }

  const allDone = results.length > 0 && results.every((r) => r.completed);
  const allGoodForm = allDone && results.every((r) => r.formOk);

  return {
    date: quest.date,
    durationMin: Math.max(1, Math.round(opts.durationMin)),
    avgRpe: toBand(avgRpe),
    completion: allGoodForm ? 'complete_good_form' : allDone ? 'complete' : 'partial',
    resistedVolume,
    aerobicMinutes,
    formOkRatio,
    results,
    localHour: opts.localHour,
  };
}

export interface CompletionInput {
  quest: DailyQuest;
  catalog: Exercise[];
  events: DomainEvent[];
  deviceId: string;
  durationMin: number;
  localHour?: number;
  rules: Record<string, ShadowRule>;
  stats: Omit<StatsContext, 'streakBest' | 'catalog'>;
  foldCtx?: FoldContext;
}

export interface Completion {
  /** Eventos a anexar ao log: a sessão e as sombras extraídas. */
  events: DomainEvent[];
  session: SessionSummary;
  before: Progression;
  after: Progression;
  xpGained: number;
  levelsGained: number;
  pointsGained: number;
  newShadowIds: string[];
}

/**
 * Conclui a missão do dia.
 *
 * O XP não é calculado aqui: é a diferença entre foldar o log antes e depois
 * do evento. Uma fórmula paralela divergiria da que o resto do app usa, e a
 * divergência apareceria como XP que some ou aparece do nada.
 *
 * O id da sessão é o dia. Concluir a mesma missão em dois aparelhos não dá
 * XP em dobro — o segundo evento é descartado como duplicata.
 */
export function completeQuest(input: CompletionInput): Completion {
  const ctx = input.foldCtx ?? DEFAULT_FOLD_CONTEXT;
  const session = summarizeQuest(input.quest, input.catalog, {
    durationMin: input.durationMin, localHour: input.localHour,
  });
  const at = `${input.quest.date}T12:00:00.000Z`;
  const sessionEvent: DomainEvent = {
    id: eventId.session(input.quest.date), at, deviceId: input.deviceId,
    kind: 'session_completed', session,
  };

  const before = foldAll(input.events, ctx);
  const withSession = [...input.events, sessionEvent];
  const afterSession = foldAll(withSession, ctx);

  const stats = computeStats(withSession, {
    ...input.stats, catalog: input.catalog, streakBest: afterSession.progression.streakBest,
  });
  const { newlyUnlocked } = evaluateShadows(input.rules, stats, unlockedFromEvents(input.events));
  const shadowEvents = newlyUnlocked.map((id) => shadowUnlockEvent(id, at, input.deviceId));

  const after = afterSession.progression;
  const levelsGained = after.level - before.progression.level;

  return {
    events: [sessionEvent, ...shadowEvents],
    session,
    before: before.progression,
    after,
    xpGained: after.xp - before.progression.xp,
    levelsGained,
    pointsGained: levelsGained * POINTS_PER_LEVEL,
    newShadowIds: newlyUnlocked,
  };
}

export interface Adjustment {
  quest: DailyQuest;
  event: DomainEvent;
  toExercise: Exercise;
}

/**
 * R5.8/R5.9 — "Muito difícil" e "Muito fácil" trocam o exercício NA HORA.
 *
 * O alvo novo nunca aumenta a carga: ao subir de degrau as repetições caem na
 * proporção da dificuldade, ao descer ficam iguais. Os dois botões existem
 * para ajustar, não para contornar o teto semanal.
 */
export function adjustObjective(input: {
  quest: DailyQuest; exerciseId: string; direction: 'easier' | 'harder';
  catalog: Exercise[]; profile: Pick<UserProfile, 'equipment' | 'limitations'>;
  rank: Rank; deviceId: string; at: string;
}): Adjustment | null {
  const from = input.catalog.find((e) => e.id === input.exerciseId);
  const to = neighborRung(input.catalog, input.exerciseId, input.direction, input.profile, input.rank);
  if (!from || !to) return null;

  const quest: DailyQuest = {
    ...input.quest,
    objectives: input.quest.objectives.map((o) => {
      if (o.exerciseId !== input.exerciseId) return o;
      // floor, não round: arredondar para cima furaria a carga por uma repetição.
      const loadPreserving = Math.floor((o.targetValue * from.difficulty) / to.difficulty);
      const targetValue = to.unit === from.unit
        ? Math.max(1, Math.min(o.targetValue, loadPreserving))
        : o.targetValue;
      return {
        ...o, exerciseId: to.id, unit: to.unit, targetValue,
        actualValue: Math.min(o.actualValue, targetValue), rpe: null, formOk: null, completedAt: null,
      };
    }),
  };

  const event: DomainEvent = {
    id: `adjust:${input.quest.date}:${from.pattern}:${to.id}`,
    at: input.at, deviceId: input.deviceId, kind: 'exercise_adjusted',
    pattern: from.pattern, direction: input.direction, fromId: from.id, toId: to.id,
  };

  return { quest, event, toExercise: to };
}
