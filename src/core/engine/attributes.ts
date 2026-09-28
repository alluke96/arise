import type { Attribute, SessionSummary } from '../types';

export interface AttributeInput {
  /** Média móvel de 4 semanas do volume resistido. */
  resistedVolume4w: number;
  aerobicMinutesPerWeek: number;
  /** 0 = não medido. */
  mobilityScore: number;
  /** Sessões por semana nas últimas 4 semanas. */
  sessionsPerWeek: number;
  /** 0 = não medido (sem HealthKit / Health Connect). */
  avgSteps: number;
  /** 0 = não medido. */
  avgSleepHours: number;
  /** Proporção de boa forma nas sessões RECENTES (0–1). */
  formOkRatio: number;
  /**
   * Soma da proporção de boa forma de TODAS as sessões de treino: 30 sessões
   * perfeitas somam 30. É o que faz a Percepção ser construída, não medida.
   */
  formOkTotal: number;
  articlesRead: number;
  weeksPlanned: number;
}

const norm = (v: number, max: number) => Math.min(Math.max(v, 0), max) / max * 100;

/** Sessões com boa forma para a Percepção chegar a 100 — ~30 semanas a 3×/semana. */
export const PER_FULL_SESSIONS = 90;

/**
 * Média ponderada que IGNORA o que não foi medido.
 *
 * Uma versão anterior tratava sono ausente como "7 h" e mobilidade ausente
 * como "50": VIT e AGI nasciam com ~15 pontos sem nenhum treino. Sem dado,
 * o peso vai para o que existe.
 */
function weighted(parts: { value: number; weight: number; measured: boolean }[]): number {
  const used = parts.filter((p) => p.measured);
  const total = used.reduce((a, p) => a + p.weight, 0);
  return total ? used.reduce((a, p) => a + p.value * p.weight, 0) / total : 0;
}

/** R6.7–R6.11 — todo atributo é derivado de dado real de treino e CONSTRUÍDO
 *  ao longo do tempo: nenhum chega perto de 100 em poucos dias. */
export function deriveAttributes(i: AttributeInput): Record<Attribute, number> {
  const STR = norm(i.resistedVolume4w, 4000);
  const AGI = weighted([
    { value: norm(i.aerobicMinutesPerWeek, 300), weight: 0.7, measured: true },
    { value: norm(i.mobilityScore, 100), weight: 0.3, measured: i.mobilityScore > 0 },
  ]);
  const VIT = weighted([
    { value: norm(i.sessionsPerWeek, 5), weight: 0.5, measured: true },
    { value: norm(i.avgSteps, 10000), weight: 0.3, measured: i.avgSteps > 0 },
    { value: norm(i.avgSleepHours, 8), weight: 0.2, measured: i.avgSleepHours > 0 },
  ]);
  // Percepção = técnica. Cresce com cada sessão de boa forma acumulada e cai
  // pela metade se a forma recente desandar. Antes era só a proporção recente:
  // UMA sessão com boa forma já valia 100.
  const PER = norm(i.formOkTotal, PER_FULL_SESSIONS) * (0.5 + 0.5 * Math.min(Math.max(i.formOkRatio, 0), 1));
  const INT = norm(i.articlesRead, 15) * 0.6 + norm(i.weeksPlanned, 12) * 0.4;

  return {
    STR: Math.round(STR),
    AGI: Math.round(AGI),
    VIT: Math.round(VIT),
    PER: Math.round(PER),
    INT: Math.round(INT),
  };
}

/** R6.12 — VIT baixa sinaliza deload. */
export function shouldSuggestDeload(vit: number): boolean {
  return vit < 35;
}

export function summarize4Weeks(history: SessionSummary[]): AttributeInput['resistedVolume4w'] {
  const recent = history.slice(-12);
  if (recent.length === 0) return 0;
  return recent.reduce((a, s) => a + s.resistedVolume, 0) / Math.max(1, recent.length / 3);
}
