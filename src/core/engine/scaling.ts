import type { Pattern, Rank, SessionSummary, Unit } from '../types';
import { MAX_WEEKLY_INCREASE, clampWeeklyVolume, enforceDeload } from './guards';
import { REENTRY_VOLUME_FACTOR } from './penalty';

/**
 * Alvo base por rank, separado por UNIDADE.
 *
 * Uma tabela única por padrão misturava segundos de prancha com repetições de
 * dead bug no mesmo número — "90" era 90 segundos para um exercício e 90
 * repetições para outro do mesmo padrão. A unidade agora decide a tabela.
 */
const REPS: Record<Rank, Partial<Record<Pattern, number>>> = {
  E: { push_h: 10, push_v: 10, pull_h: 8, pull_v: 10, squat: 15, hinge: 12, unilateral: 8, core_anti_ext: 8, core_anti_rot: 8, trunk_flex: 12 },
  D: { push_h: 24, push_v: 16, pull_h: 12, pull_v: 12, squat: 30, hinge: 20, unilateral: 12, core_anti_ext: 16, core_anti_rot: 12, trunk_flex: 20 },
  C: { push_h: 30, push_v: 20, pull_h: 18, pull_v: 12, squat: 45, hinge: 30, unilateral: 16, core_anti_ext: 20, core_anti_rot: 16, trunk_flex: 30 },
  B: { push_h: 45, push_v: 24, pull_h: 24, pull_v: 15, squat: 60, hinge: 36, unilateral: 20, core_anti_ext: 24, core_anti_rot: 20, trunk_flex: 36 },
  A: { push_h: 70, push_v: 30, pull_h: 30, pull_v: 24, squat: 80, hinge: 40, unilateral: 24, core_anti_ext: 30, core_anti_rot: 24, trunk_flex: 50 },
  S: { push_h: 100, push_v: 40, pull_h: 40, pull_v: 30, squat: 100, hinge: 50, unilateral: 30, core_anti_ext: 40, core_anti_rot: 30, trunk_flex: 100 },
};
/** Sustentações. Espelham o critério de core de cada rank (§6.2). */
const HOLD_SECONDS: Record<Rank, number> = { E: 15, D: 30, C: 45, B: 60, A: 90, S: 120 };
const AEROBIC_MINUTES: Record<Rank, number> = { E: 10, D: 25, C: 30, B: 40, A: 45, S: 60 };
const AEROBIC_REPS: Record<Rank, number> = { E: 20, D: 40, C: 60, B: 80, A: 100, S: 120 };
const CARRY_METERS: Record<Rank, number> = { E: 40, D: 60, C: 80, B: 100, A: 120, S: 150 };

export function baseTarget(rank: Rank, pattern: Pattern, unit: Unit = 'reps'): number {
  switch (unit) {
    case 'seconds': return pattern === 'mobility' ? 30 : HOLD_SECONDS[rank];
    case 'minutes': return AEROBIC_MINUTES[rank];
    case 'meters': return CARRY_METERS[rank];
    case 'reps':
      if (pattern === 'aerobic') return AEROBIC_REPS[rank];
      if (pattern === 'mobility') return 10;
      return REPS[rank][pattern] ?? 10;
  }
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

/**
 * Carga de referência de um padrão: o que foi prescrito para ele na última
 * semana que não foi deload. Carga = alvo × dificuldade do exercício.
 */
export interface WeeklyReference {
  load: number;
  unit: Unit;
}

export interface ScalingContext {
  rank: Rank;
  pattern: Pattern;
  unit: Unit;
  /** Dificuldade (1–10) do degrau escolhido. */
  difficulty: number;
  isTrainingDay: boolean;
  readiness: number;
  progression: number;
  recalibration: number;
  weekIndex: number;
  /** Referência da semana anterior PARA ESTE PADRÃO. Ausente = sem histórico. */
  lastWeek?: WeeklyReference;
  /** R9.2 — reentrada pós-Dungeon Break: metade do volume. */
  reentry?: boolean;
}

/**
 * Composição completa. A saída SEMPRE passa pelos guardas.
 *
 * R4.5 — o teto de +10%/semana é aplicado sobre a CARGA DO MESMO PADRÃO na
 * semana anterior. Uma versão anterior comparava o alvo de um exercício
 * (dezenas de repetições) com o volume total da semana (milhares): o teto
 * nunca travava. Carga, não repetições, porque trocar para um degrau mais
 * difícil com as mesmas repetições também é aumento de volume.
 */
export function scaleObjective(ctx: ScalingContext): number {
  const base = baseTarget(ctx.rank, ctx.pattern, ctx.unit) * dayFactor(ctx.isTrainingDay);
  const grown = base
    * ctx.readiness
    * ctx.progression
    * ctx.recalibration
    * (ctx.reentry ? REENTRY_VOLUME_FACTOR : 1);

  let target = enforceDeload(grown, ctx.weekIndex);
  let ceiling = Infinity;

  if (ctx.lastWeek && ctx.lastWeek.load > 0) {
    if (ctx.lastWeek.unit === ctx.unit) {
      const difficulty = Math.max(ctx.difficulty, 1);
      target = clampWeeklyVolume(target * difficulty, ctx.lastWeek.load) / difficulty;
      ceiling = Math.floor((ctx.lastWeek.load * (1 + MAX_WEEKLY_INCREASE)) / difficulty);
    } else {
      // Unidade mudou (ex.: prancha em segundos → dead bug em repetições): não
      // há comparação justa. Nunca passa da base do rank, sem crescimento.
      target = Math.min(target, base);
    }
  }

  // Arredondar para cima poderia furar o teto por meia repetição.
  const rounded = Math.min(Math.round(target), ceiling);
  return Math.max(1, rounded);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(Math.max(n, lo), hi);
}
