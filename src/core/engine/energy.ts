import type { UserProfile } from '../types';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'high' | 'athlete';

export const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, high: 1.725, athlete: 1.9,
};

/** Mifflin-St Jeor. ±10% em ~70% das pessoas — melhor que Harris-Benedict,
 *  e perde precisão em extremos de peso. */
export function mifflinStJeor(p: Pick<UserProfile, 'weightKg' | 'heightCm' | 'age' | 'gender'>): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  const s = p.gender === 'male' ? 5 : p.gender === 'female' ? -161 : -78;
  return Math.round(base + s);
}

export function tdee(bmr: number, level: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_FACTOR[level]);
}

/**
 * R3.6 — depois de 2 semanas o fator vem dos DADOS, não da autodeclaração.
 * A autodeclaração é a maior fonte de erro da fórmula: as pessoas
 * superestimam a própria atividade em uma categoria inteira.
 */
export function derivedActivityLevel(avgSteps: number, sessionsPerWeek: number): ActivityLevel {
  const score = avgSteps / 2500 + sessionsPerWeek;
  if (score < 3) return 'sedentary';
  if (score < 5) return 'light';
  if (score < 7.5) return 'moderate';
  if (score < 10) return 'high';
  return 'athlete';
}

export function hydrationTargetMl(weightKg: number, trainedToday: boolean): number {
  return Math.round(weightKg * 35 + (trainedToday ? 500 : 0));
}
