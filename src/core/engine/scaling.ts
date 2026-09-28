import type { Pattern, Rank, SessionSummary, Unit } from '../types';
import { MAX_WEEKLY_INCREASE, enforceDeload } from './guards';
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
  /**
   * `false` quando a referência vem da PRÓPRIA semana (ainda não existe semana
   * anterior, ex.: primeira semana de uso). Aí o alvo pode repetir a carga,
   * nunca subir — senão a segunda semana começaria sem teto nenhum.
   */
  growth?: boolean;
}

/**
 * Quanto uma unidade de alvo "pesa" num degrau.
 *
 * Repetições, segundos e metros escalam com a dificuldade: 9 flexões na parede
 * não equivalem a 9 no sofá. Minutos de aeróbico não: trocar a marcha parada
 * pela caminhada muda a intensidade, e dividir o tempo pela dificuldade daria
 * "caminhe 4 minutos" para quem já marchava 9.
 */
export function loadFactor(unit: Unit, difficulty: number): number {
  return unit === 'minutes' ? 1 : Math.max(difficulty, 1);
}

/**
 * Alvo máximo da semana, em unidades do degrau atual.
 *
 * +10% de carga, ou +1 unidade quando 10% não chega a uma unidade inteira:
 * com números pequenos o arredondamento para baixo congelava o alvo — 9
 * minutos viravam 9,9 → 9 para sempre, e 6 flexões no sofá nunca viravam 7.
 */
export function weeklyCeiling(ref: WeeklyReference, unit: Unit, difficulty: number): number {
  const f = loadFactor(unit, difficulty);
  const same = Math.floor(ref.load / f);
  if (ref.growth === false) return same;
  return Math.max(Math.floor((ref.load * (1 + MAX_WEEKLY_INCREASE)) / f), same + MIN_WEEKLY_STEP[unit]);
}

/**
 * Menor passo semanal por unidade, quando 10% não chega a isso. Sustentação
 * sobe de 2 em 2 segundos: de 1 em 1, uma prancha de 13 s levaria quatro
 * meses para chegar a 30 s.
 */
export const MIN_WEEKLY_STEP: Record<Unit, number> = { reps: 1, seconds: 2, minutes: 1, meters: 5 };

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
      ceiling = weeklyCeiling(ctx.lastWeek, ctx.unit, ctx.difficulty);
      // Sobrecarga progressiva: quem vem cumprindo (fator de progressão > 1)
      // constrói sobre a semana passada e vai ao teto. Partir sempre da base
      // do rank fazia o alvo crescer ~3%/semana — 9 flexões viravam 14 em
      // três meses. Falha, reentrada e dia ruim continuam reduzindo.
      const earned = ctx.progression > 1;
      const proposal = earned
        ? ceiling
          * ctx.recalibration
          * (ctx.reentry ? REENTRY_VOLUME_FACTOR : 1)
          * Math.min(1, ctx.readiness / 0.9)
        : grown;
      target = Math.min(enforceDeload(proposal, ctx.weekIndex), ceiling);
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
