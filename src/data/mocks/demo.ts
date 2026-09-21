import type {
  DailyQuest, HealthScreening, PainLogEntry, Progression,
  SessionSummary, UserProfile,
} from '../../core/types';

/** Estado de demonstração: o mesmo caçador do mock visual — Rank D,
 *  nível 14, 23 dias de sequência, 7 sombras extraídas. */

export const DEMO_PROFILE: UserProfile = {
  hunterName: 'ALLYSON',
  age: 28,
  gender: 'male',
  weightKg: 89.1,
  heightCm: 178,
  waistCm: 97,
  goal: 'fat_loss',
  daysPerWeek: 3,
  sessionMinutes: 20,
  preferredTime: '19:00',
  location: 'home',
  equipment: ['none', 'band'],
  limitations: ['wrist'],
  units: { mass: 'kg', length: 'cm' },
  locale: 'pt-BR',
  systemTone: 'cold',
};

export const DEMO_PROGRESSION: Progression = {
  level: 14,
  // Mantido dentro da faixa do nível 14: xpForLevel(14)=4591, xpForLevel(15)=5074.
  // 4915 → 324/483 na barra (67%), igual ao mock visual. Um valor acima de 5074
  // significaria que `applyXp` não rodou, e a barra estouraria.
  xp: 4915,
  rank: 'D',
  attributes: { STR: 27, AGI: 19, VIT: 34, PER: 22, INT: 12 },
  unspentPoints: 3,
  streakCurrent: 23,
  streakBest: 23,
  recoveryStones: 2,
};

export const DEMO_SCREENING: HealthScreening = {
  date: '2026-08-01',
  answers: {
    heart_condition: false, chest_pain_activity: false, chest_pain_rest: false,
    dizziness: false, bone_joint: true, blood_pressure_meds: false, other_reason: false,
  },
  // Punho declarado na triagem → limitação que filtra exercícios, mas sem
  // bandeira que exija Modo Prudência.
  result: 'cleared',
  restrictions: ['wrist'],
  expiresAt: '2027-08-01',
};

export const DEMO_PAIN_LOG: PainLogEntry[] = [];

const session = (date: string, over: Partial<SessionSummary> = {}): SessionSummary => ({
  date, durationMin: 20, avgRpe: 5, completion: 'complete',
  resistedVolume: 380, aerobicMinutes: 22, formOkRatio: 0.85, ...over,
});

export const DEMO_SESSIONS: SessionSummary[] = [
  session('2026-09-09'), session('2026-09-11', { completion: 'complete_good_form' }),
  session('2026-09-13'), session('2026-09-16', { resistedVolume: 410 }),
  session('2026-09-18', { completion: 'complete_good_form', resistedVolume: 430 }),
  session('2026-09-20', { resistedVolume: 445 }),
];

export const DEMO_TODAY = '2026-09-21';
export const DEMO_WEEK_INDEX = 6;
export const DEMO_LAST_WEEK_VOLUME = 1285;

/** Progresso parcial do dia, para a tela de Status não nascer vazia. */
export const DEMO_PARTIAL: Record<string, number> = {
  push_knee: 18,
  squat_partial: 30,
  plank_full: 0,
  walk_brisk: 14,
  row_band: 0,
};

export function applyDemoProgress(quest: DailyQuest): DailyQuest {
  return {
    ...quest,
    objectives: quest.objectives.map((o) => {
      const actual = DEMO_PARTIAL[o.exerciseId] ?? 0;
      const done = actual >= o.targetValue;
      return {
        ...o,
        actualValue: Math.min(actual, o.targetValue),
        rpe: done ? 5 : null,
        formOk: done ? true : null,
        completedAt: done ? `${quest.date}T18:40:00` : null,
      };
    }),
    status: 'partial',
  };
}
