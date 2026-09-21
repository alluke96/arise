import type { HealthScreening, Limitation, ScreeningResult } from '../types';

/** As 7 perguntas iniciais do PAR-Q+. Os textos oficiais (versão brasileira
 *  validada e original em inglês) entram via i18n na tarefa 37 — traduzir
 *  por conta própria invalidaria o instrumento. */
export const PARQ_KEYS = [
  'heart_condition', 'chest_pain_activity', 'chest_pain_rest', 'dizziness',
  'bone_joint', 'blood_pressure_meds', 'other_reason',
] as const;
export type ParqKey = (typeof PARQ_KEYS)[number];

/** Respostas que, sozinhas, bloqueiam qualquer prescrição (R2.6). */
const BLOCKING: ParqKey[] = ['chest_pain_rest'];

export const SCREENING_VALIDITY_MONTHS = 12;

export interface ScreeningInput {
  answers: Partial<Record<ParqKey, boolean>>;
  limitations: Limitation[];
  pregnancyRisk?: boolean;
  date: string;
}

export function evaluateParq(input: ScreeningInput): HealthScreening {
  const answers = Object.fromEntries(
    PARQ_KEYS.map((k) => [k, input.answers[k] ?? false]),
  ) as Record<string, boolean>;

  let result: ScreeningResult = 'cleared';
  if (BLOCKING.some((k) => answers[k])) {
    result = 'blocked';
  } else if (PARQ_KEYS.some((k) => answers[k]) || input.pregnancyRisk) {
    /** R15.10 — gravidez ativa o Modo Prudência. */
    result = 'caution';
  }

  return {
    date: input.date,
    answers,
    result,
    restrictions: input.limitations,
    expiresAt: addMonths(input.date, SCREENING_VALIDITY_MONTHS),
  };
}

/** R2.8 — a triagem expira em 12 meses e precisa ser refeita. */
export function isScreeningExpired(s: HealthScreening, today: string): boolean {
  return today >= s.expiresAt;
}

function addMonths(iso: string, months: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}
