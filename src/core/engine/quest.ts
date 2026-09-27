import type {
  DailyQuest, Exercise, HealthScreening, PainLogEntry, Pattern,
  Progression, QuestObjective, Rank, SessionSummary, UserProfile,
} from '../types';
import { CAUTION_MAX_RANK, applyCautionMode, dropPainfulPatterns, isDeloadWeek } from './guards';
import { eligibleRungs, entryIndex, type LadderPosition } from './ladder';
import { rankAtLeast } from './rank';
import {
  progressionFactor, readinessFactor, recalibrationFactor, scaleObjective,
  type WeeklyReference,
} from './scaling';

export { isPrescribable, LOAD_PATTERNS } from './ladder';

/** R4.2/R4.3 — padrões obrigatórios por rank. */
function patternsFor(rank: Rank): Pattern[] {
  const core: Pattern[] = ['push_h', 'squat', 'core_anti_ext', 'aerobic'];
  return rankAtLeast(rank, 'C') ? [...core, 'pull_h'] : core;
}

/** Degrau de entrada do rank para um padrão, sem histórico de escada. */
export function pickExercise(
  catalog: Exercise[],
  pattern: Pattern,
  profile: UserProfile,
  rank: Rank,
): Exercise | null {
  const rungs = eligibleRungs(catalog, pattern, profile);
  const i = entryIndex(rungs, rank);
  return i >= 0 ? rungs[i] : null;
}

export interface QuestInput {
  profile: UserProfile;
  progression: Progression;
  screening: HealthScreening;
  history: SessionSummary[];
  painLog: PainLogEntry[];
  catalog: Exercise[];
  date: string;
  weekIndex: number;
  /** Carga prescrita por padrão na última semana não-deload (R4.5). */
  lastWeek: Partial<Record<Pattern, WeeklyReference>>;
  /** Degrau atual de cada padrão, vindo de `foldLadder`. */
  ladder?: Partial<Record<Pattern, LadderPosition>>;
  /** R9.2 — reentrada pós-Dungeon Break. */
  reentry?: boolean;
  sleepHours: number;
  soreness: 0 | 1 | 2 | 3;
  consecutiveFailures: number;
  isTrainingDay: boolean;
}

export function generateDailyQuest(input: QuestInput): DailyQuest {
  const { profile, progression, screening, date } = input;

  /**
   * R2.5 — no Modo Prudência o rank efetivo é no máximo D, e é ELE que escolhe
   * exercícios e alvos. Uma versão anterior só trocava o rótulo do rank depois
   * de montar a missão com os exercícios do rank real.
   */
  const rank: Rank = screening.result !== 'cleared' && rankAtLeast(progression.rank, CAUTION_MAX_RANK)
    ? CAUTION_MAX_RANK
    : progression.rank;

  const base: DailyQuest = {
    id: `quest-${date}`,
    date,
    rank,
    objectives: [],
    status: 'pending',
    deadline: `${date}T23:59:59`,
    isDeload: isDeloadWeek(input.weekIndex),
    isRestDay: !input.isTrainingDay,
    xpAwarded: null,
  };

  /** R4.10 — descanso é missão, e vale XP. */
  if (!input.isTrainingDay) {
    return applyCautionMode(base, screening);
  }

  const readiness = readinessFactor(progression.attributes.VIT, input.sleepHours, input.soreness);
  const progFactor = progressionFactor(input.history);
  const recal = recalibrationFactor(input.consecutiveFailures);

  const wanted = patternsFor(rank).map((p) => ({ pattern: p }));
  const allowed = dropPainfulPatterns(wanted, input.painLog);

  const objectives: QuestObjective[] = [];
  for (const { pattern } of allowed) {
    const exercise = chooseExercise(input, pattern, rank);
    if (!exercise) continue;

    const targetValue = scaleObjective({
      rank,
      pattern,
      unit: exercise.unit,
      difficulty: exercise.difficulty,
      isTrainingDay: true,
      readiness,
      progression: progFactor,
      recalibration: recal,
      weekIndex: input.weekIndex,
      lastWeek: input.lastWeek[pattern],
      reentry: input.reentry,
    });

    objectives.push({
      exerciseId: exercise.id,
      targetValue,
      unit: exercise.unit,
      actualValue: 0,
      rpe: null,
      formOk: null,
      completedAt: null,
    });
  }

  return applyCautionMode({ ...base, objectives }, screening);
}

/**
 * Usa o degrau da escada quando ele ainda é válido para este usuário e este
 * rank efetivo; senão, o degrau de entrada do rank.
 */
function chooseExercise(input: QuestInput, pattern: Pattern, rank: Rank): Exercise | null {
  const pos = input.ladder?.[pattern];
  if (pos) {
    const rungs = eligibleRungs(input.catalog, pattern, input.profile);
    const ex = rungs.find((e) => e.id === pos.exerciseId);
    if (ex && rankAtLeast(rank, ex.minRank)) return ex;
  }
  return pickExercise(input.catalog, pattern, input.profile, rank);
}

export function questProgress(quest: DailyQuest): number {
  if (quest.objectives.length === 0) return 0;
  const total = quest.objectives.reduce(
    (acc, o) => acc + Math.min(o.actualValue / o.targetValue, 1), 0,
  );
  return total / quest.objectives.length;
}

export function isQuestComplete(quest: DailyQuest): boolean {
  return quest.objectives.length > 0
    && quest.objectives.every((o) => o.actualValue >= o.targetValue);
}
