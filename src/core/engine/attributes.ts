import type { Attribute, SessionSummary } from '../types';

export interface AttributeInput {
  /** Média móvel de 4 semanas do volume resistido. */
  resistedVolume4w: number;
  aerobicMinutesPerWeek: number;
  mobilityScore: number;
  sessionsPerWeek: number;
  avgSteps: number;
  avgSleepHours: number;
  formOkRatio: number;
  articlesRead: number;
  weeksPlanned: number;
}

const norm = (v: number, max: number) => Math.min(Math.max(v, 0), max) / max * 100;

/** R6.7–R6.11 — todo atributo é derivado de dado real de treino.
 *  Nenhum deles é decorativo: cada um alimenta o motor de volta. */
export function deriveAttributes(i: AttributeInput): Record<Attribute, number> {
  const STR = norm(i.resistedVolume4w, 4000);
  const AGI = norm(i.aerobicMinutesPerWeek, 300) * 0.7 + norm(i.mobilityScore, 100) * 0.3;
  const VIT =
    norm(i.sessionsPerWeek, 5) * 0.5 +
    norm(i.avgSteps, 10000) * 0.3 +
    norm(i.avgSleepHours, 8) * 0.2;
  const PER = norm(i.formOkRatio * 100, 100);
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
