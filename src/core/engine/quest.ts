import type {
  DailyQuest, Exercise, HealthScreening, PainLogEntry, Pattern,
  Progression, QuestObjective, SessionSummary, UserProfile,
} from '../types';
import { applyCautionMode, dropPainfulPatterns, isDeloadWeek } from './guards';
import { rankAtLeast } from './rank';
import {
  progressionFactor, readinessFactor, recalibrationFactor, scaleObjective,
} from './scaling';

/** R4.2/R4.3 — padrões obrigatórios por rank. */
function patternsFor(rank: Progression['rank']): Pattern[] {
  const core: Pattern[] = ['push_h', 'squat', 'core_anti_ext', 'aerobic'];
  return rankAtLeast(rank, 'C') ? [...core, 'pull_h'] : core;
}

/** Padrões que exigem par de ilustrações para serem prescritos (R11.3/R11.4). */
const LOAD_PATTERNS: Pattern[] = [
  'push_h', 'push_v', 'pull_h', 'pull_v', 'squat', 'hinge',
  'unilateral', 'core_anti_ext', 'core_anti_rot', 'trunk_flex',
];

export function isPrescribable(ex: Exercise): boolean {
  if (!LOAD_PATTERNS.includes(ex.pattern)) return true;
  return ex.illustrations !== null;
}

export function pickExercise(
  catalog: Exercise[],
  pattern: Pattern,
  profile: UserProfile,
  rank: Progression['rank'],
): Exercise | null {
  const eligible = catalog
    .filter((e) => e.pattern === pattern)
    .filter(isPrescribable)
    .filter((e) => rankAtLeast(rank, e.minRank))
    .filter((e) => e.equipment.some((eq) => profile.equipment.includes(eq)))
    .filter((e) => !e.contraindications.some((c) => profile.limitations.includes(c)))
    .sort((a, b) => b.difficulty - a.difficulty);

  return eligible[0] ?? null;
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
  lastWeekVolume: number;
  sleepHours: number;
  soreness: 0 | 1 | 2 | 3;
  consecutiveFailures: number;
  isTrainingDay: boolean;
}

export function generateDailyQuest(input: QuestInput): DailyQuest {
  const { profile, progression, screening, date } = input;

  const deadline = `${date}T23:59:59`;
  const base: DailyQuest = {
    id: `quest-${date}`,
    date,
    rank: progression.rank,
    objectives: [],
    status: 'pending',
    deadline,
    isDeload: isDeloadWeek(input.weekIndex),
    isRestDay: !input.isTrainingDay,
    xpAwarded: null,
  };

  /** R4.10 — descanso é missão, e vale XP. */
  if (!input.isTrainingDay) {
    return applyCautionMode(base, screening);
  }

  const readiness = readinessFactor(
    progression.attributes.VIT, input.sleepHours, input.soreness,
  );
  const progFactor = progressionFactor(input.history);
  const recal = recalibrationFactor(input.consecutiveFailures);

  const wanted = patternsFor(progression.rank).map((p) => ({ pattern: p }));
  const allowed = dropPainfulPatterns(wanted, input.painLog);

  const objectives: QuestObjective[] = [];
  for (const { pattern } of allowed) {
    const exercise = pickExercise(input.catalog, pattern, profile, progression.rank);
    if (!exercise) continue;

    const targetValue = scaleObjective({
      rank: progression.rank,
      pattern,
      isTrainingDay: true,
      readiness,
      progression: progFactor,
      recalibration: recal,
      weekIndex: input.weekIndex,
      lastWeekVolume: input.lastWeekVolume,
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
