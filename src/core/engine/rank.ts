import { RANKS, type Rank } from '../types';

export function rankIndex(rank: Rank): number {
  return RANKS.indexOf(rank);
}

export function rankAtLeast(rank: Rank, min: Rank): boolean {
  return rankIndex(rank) >= rankIndex(min);
}

export function nextRank(rank: Rank): Rank | null {
  const i = rankIndex(rank);
  return i < RANKS.length - 1 ? RANKS[i + 1] : null;
}

export interface RankCriteria {
  rank: Rank;
  /** Nome temático do estágio. */
  titlePt: string;
  pushReps: number;
  pushVariantPt: string;
  squatReps: number;
  squatVariantPt: string;
  coreSeconds: number;
  coreVariantPt: string;
  aerobicPt: string;
  aerobicMinutes: number;
  /** Semanas medianas de treino até alcançar, partindo do sedentarismo. */
  medianWeeks: number;
}

/** §6.2 do product brief. Promoção exige TODOS os critérios. */
export const RANK_CRITERIA: Record<Rank, RankCriteria> = {
  E: { rank: 'E', titlePt: 'Despertar', pushReps: 5, pushVariantPt: 'na parede', squatReps: 10, squatVariantPt: 'sentar-levantar', coreSeconds: 15, coreVariantPt: 'prancha de joelho', aerobicPt: '10 min de caminhada', aerobicMinutes: 10, medianWeeks: 0 },
  D: { rank: 'D', titlePt: 'Caçador Licenciado', pushReps: 10, pushVariantPt: 'inclinadas', squatReps: 15, squatVariantPt: 'livres parciais', coreSeconds: 30, coreVariantPt: 'prancha de joelho', aerobicPt: '20 min contínuos', aerobicMinutes: 20, medianWeeks: 4 },
  C: { rank: 'C', titlePt: 'Caçador de Campo', pushReps: 10, pushVariantPt: 'de joelhos', squatReps: 20, squatVariantPt: 'livres completos', coreSeconds: 45, coreVariantPt: 'prancha completa', aerobicPt: '30 min rápidos', aerobicMinutes: 30, medianWeeks: 10 },
  B: { rank: 'B', titlePt: 'Caçador de Elite', pushReps: 15, pushVariantPt: 'completas', squatReps: 30, squatVariantPt: 'livres', coreSeconds: 60, coreVariantPt: 'prancha completa', aerobicPt: '5 km run-walk', aerobicMinutes: 40, medianWeeks: 18 },
  A: { rank: 'A', titlePt: 'Monarca em Ascensão', pushReps: 30, pushVariantPt: 'completas', squatReps: 50, squatVariantPt: 'livres', coreSeconds: 90, coreVariantPt: 'prancha + 10 barras', aerobicPt: '5 km contínuos', aerobicMinutes: 35, medianWeeks: 26 },
  S: { rank: 'S', titlePt: 'A Missão Diária', pushReps: 100, pushVariantPt: 'completas', squatReps: 100, squatVariantPt: 'livres + 100 abdominais', coreSeconds: 120, coreVariantPt: 'prancha completa', aerobicPt: '10 km de corrida', aerobicMinutes: 60, medianWeeks: 32 },
};

export interface BenchmarkAttempt {
  pushReps: number;
  squatReps: number;
  coreSeconds: number;
  aerobicMinutes: number;
}

export interface BenchmarkOutcome {
  passed: boolean;
  targetRank: Rank;
  results: { key: keyof BenchmarkAttempt; actual: number; required: number; passed: boolean }[];
}

/** R7.2 — promoção exige aprovação em TODOS os critérios. */
export function evaluateBenchmark(current: Rank, attempt: BenchmarkAttempt): BenchmarkOutcome {
  const target = nextRank(current);
  if (!target) {
    return { passed: false, targetRank: current, results: [] };
  }
  const c = RANK_CRITERIA[target];
  const results = [
    { key: 'pushReps' as const, actual: attempt.pushReps, required: c.pushReps },
    { key: 'squatReps' as const, actual: attempt.squatReps, required: c.squatReps },
    { key: 'coreSeconds' as const, actual: attempt.coreSeconds, required: c.coreSeconds },
    { key: 'aerobicMinutes' as const, actual: attempt.aerobicMinutes, required: c.aerobicMinutes },
  ].map((r) => ({ ...r, passed: r.actual >= r.required }));

  return { passed: results.every((r) => r.passed), targetRank: target, results };
}

export interface BaselineAnswers {
  /** 0 = nem um lance sem perder o fôlego, 3 = quatro ou mais */
  stairs: 0 | 1 | 2 | 3;
  /** flexões com boa forma */
  pushups: 0 | 1 | 2 | 3 | 4;
  /** consegue caminhar 20 min */
  walk20: 0 | 1 | 2 | 3;
  /** tempo sem treinar: 0 = nunca treinou, 4 = treina hoje */
  detraining: 0 | 1 | 2 | 3 | 4;
}

/** R3.3 — Rank inicial entre E e C. Nunca mais que C no onboarding:
 *  autorrelato não é benchmark. */
export function initialRank(a: BaselineAnswers): Rank {
  const score = a.stairs + a.pushups + a.walk20 + a.detraining;
  if (score <= 3) return 'E';
  if (score <= 8) return 'D';
  return 'C';
}

/** R7.7 — projeção recalculada com o ritmo real do usuário. */
export function weeksToRankS(current: Rank, observedPaceFactor = 1): number {
  const remaining = RANK_CRITERIA.S.medianWeeks - RANK_CRITERIA[current].medianWeeks;
  return Math.max(1, Math.round(remaining * observedPaceFactor));
}
