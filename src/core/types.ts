/** Tipos do domínio. Mock e SQLite implementam exatamente estes tipos. */

export const RANKS = ['E', 'D', 'C', 'B', 'A', 'S'] as const;
export type Rank = (typeof RANKS)[number];

export type Pattern =
  | 'push_h' | 'push_v' | 'pull_h' | 'pull_v' | 'squat' | 'hinge'
  | 'unilateral' | 'core_anti_ext' | 'core_anti_rot' | 'trunk_flex'
  | 'carry' | 'aerobic' | 'mobility';

export type Attribute = 'STR' | 'AGI' | 'VIT' | 'PER' | 'INT';
export type Equipment = 'none' | 'band' | 'dumbbell' | 'pullup_bar' | 'gym';
export type Limitation = 'knee' | 'lower_back' | 'shoulder' | 'wrist' | 'neck';
export type Unit = 'reps' | 'seconds' | 'minutes' | 'meters';

/** Faixa de RPE. Iniciantes não estimam número exato de forma confiável. */
export type RpeBand = 3 | 5 | 7 | 9;

export type ScreeningResult = 'cleared' | 'caution' | 'blocked';

export interface UserProfile {
  hunterName: string;
  age: number;
  gender: 'male' | 'female' | 'unspecified';
  weightKg: number;
  heightCm: number;
  waistCm: number | null;
  goal: 'fat_loss' | 'strength' | 'health' | 'habit';
  daysPerWeek: 2 | 3 | 4 | 5;
  sessionMinutes: 10 | 20 | 30 | 45;
  preferredTime: string;
  location: 'home' | 'gym' | 'outdoor';
  equipment: Equipment[];
  limitations: Limitation[];
  units: { mass: 'kg' | 'lb'; length: 'cm' | 'ft' };
  locale: 'pt-BR' | 'en-US';
  systemTone: 'cold' | 'companion';
}

export interface Progression {
  level: number;
  xp: number;
  rank: Rank;
  attributes: Record<Attribute, number>;
  unspentPoints: number;
  streakCurrent: number;
  streakBest: number;
  recoveryStones: number;
}

export interface Exercise {
  id: string;
  namePt: string;
  nameEn: string;
  systemNamePt: string;
  pattern: Pattern;
  /** 1–10. Usada para ordenar a escada de progressão. */
  difficulty: number;
  minRank: Rank;
  unit: Unit;
  equipment: Equipment[];
  contraindications: Limitation[];
  regressionId: string | null;
  progressionId: string | null;
  cues: string[];
  commonErrors: string[];
  /** R11.4: sem ilustrações, exercício de carga fica bloqueado. */
  illustrations: { start: string; end: string } | null;
  progressionCriteria: string;
  attribute: Attribute;
}

export interface QuestObjective {
  exerciseId: string;
  targetValue: number;
  unit: Unit;
  actualValue: number;
  rpe: RpeBand | null;
  formOk: boolean | null;
  completedAt: string | null;
}

export interface DailyQuest {
  id: string;
  date: string;
  rank: Rank;
  objectives: QuestObjective[];
  status: 'pending' | 'partial' | 'completed' | 'failed';
  deadline: string;
  isDeload: boolean;
  isRestDay: boolean;
  xpAwarded: number | null;
}

export interface SessionSummary {
  date: string;
  durationMin: number;
  avgRpe: RpeBand;
  completion: 'partial' | 'complete' | 'complete_good_form';
  /** séries × reps × dificuldade relativa */
  resistedVolume: number;
  aerobicMinutes: number;
  formOkRatio: number;
}

export interface HealthScreening {
  date: string;
  answers: Record<string, boolean>;
  result: ScreeningResult;
  restrictions: Limitation[];
  expiresAt: string;
}

export interface Shadow {
  id: string;
  namePt: string;
  nameEn: string;
  grade: 'soldier' | 'elite' | 'knight' | 'commander' | 'marshal' | 'general';
  conditionPt: string;
  perkPt: string;
  unlockedAt: string | null;
}

export interface PainLogEntry {
  date: string;
  pattern: Pattern;
  kind: 'joint' | 'muscle';
}
