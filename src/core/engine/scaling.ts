import type { Pattern, Rank, SessionSummary } from '../types';
import { clampWeeklyVolume, enforceDeload } from './guards';

/** Alvo base por rank e padrão, antes de qualquer fator. */
const BASE: Record<Rank, Partial<Record<Pattern, number>>> = {
  E: { push_h: 10, squat: 15, core_anti_ext: 15, aerobic: 10, pull_h: 8 },
  D: { push_h: 24, squat: 30, core_anti_ext: 45, aerobic: 25, pull_h: 12 },
  C: { push_h: 30, squat: 45, core_anti_ext: 60, aerobic: 30, pull_h: 18 },
  B: { push_h: 45, squat: 60, core_anti_ext: 90, aerobic: 40, pull_h: 24 },
  A: { push_h: 70, squat: 80, core_anti_ext: 120, aerobic: 45, pull_h: 30 },
  S: { push_h: 100, squat: 100, core_anti_ext: 120, aerobic: 60, pull_h: 40 },
};

export function baseTarget(rank: Rank, pattern: Pattern): number {
  return BASE[rank][pattern] ?? 10;
}

/** Dia leve rende 40% do volume de um dia de treino. */
export function dayFactor(isTrainingDay: boolean): number {
  return isTrainingDay ? 1.0 : 0.4;
}

/**
 * R4.11 — prontidão a partir de VIT, sono e dor. Faixa fechada em 0,7–1,1:
 * um dia ruim reduz a missão, um dia ótimo não a infla além de 10%.
 */
export function readinessFactor(vit: number, sleepHours: number, soreness: 0 | 1 | 2 | 3): number {
  const vitPart = 0.85 + Math.min(Math.max(vit, 0), 100) / 100 * 0.25;
  const sleepPart = sleepHours >= 7 ? 1.0 : sleepHours >= 6 ? 0.95 : 0.88;
  const sorenessPart = [1.0, 0.95, 0.85, 0.75][soreness];
  return clamp(vitPart * sleepPart * sorenessPart, 0.7, 1.1);
}

/** R4.6 — duas sessões bem-sucedidas seguidas rendem +2,5%. */
export function progressionFactor(history: SessionSummary[]): number {
  let streak = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].completion === 'partial') break;
    streak++;
  }
  return 1 + Math.floor(streak / 2) * 0.025;
}

/** R4.7 — duas falhas seguidas na mesma missão reduzem 15%. */
export function recalibrationFactor(consecutiveFailures: number): number {
  return consecutiveFailures >= 2 ? 0.85 : 1.0;
}

export interface ScalingContext {
  rank: Rank;
  pattern: Pattern;
  isTrainingDay: boolean;
  readiness: number;
  progression: number;
  recalibration: number;
  weekIndex: number;
  lastWeekVolume: number;
}

/** Composição completa. A saída SEMPRE passa pelos guardas. */
export function scaleObjective(ctx: ScalingContext): number {
  const raw =
    baseTarget(ctx.rank, ctx.pattern) *
    dayFactor(ctx.isTrainingDay) *
    ctx.readiness *
    ctx.progression *
    ctx.recalibration;

  const afterDeload = enforceDeload(raw, ctx.weekIndex);
  const clamped = clampWeeklyVolume(afterDeload, ctx.lastWeekVolume);
  return Math.max(1, Math.round(clamped));
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(Math.max(n, lo), hi);
}
