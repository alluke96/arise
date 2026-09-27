import type { HealthScreening, Limitation, ScreeningResult } from '../types';

/**
 * Triagem pré-participação na estrutura do PAR-Q+ (7 perguntas gerais).
 *
 * Os TEXTOS exibidos são paráfrases fiéis, rotuladas como "baseado no
 * PAR-Q+". O texto oficial — original em inglês e a versão brasileira
 * validada — deve entrar pela fonte licenciada (tarefa 37). Reescrever o
 * instrumento e chamá-lo de validado seria transferir a responsabilidade
 * clínica para nós.
 */
export const PARQ_KEYS = [
  'heart_or_bp',       // 1. problema cardíaco ou pressão alta diagnosticados
  'chest_pain',        // 2. dor no peito em repouso, no dia a dia ou em atividade
  'dizziness',         // 3. tontura com perda de equilíbrio ou desmaio (12 meses)
  'chronic_condition', // 4. outra doença crônica diagnosticada
  'chronic_meds',      // 5. medicação contínua para doença crônica
  'bone_joint',        // 6. problema ósseo, articular ou de tecido mole
  'supervised_only',   // 7. médico disse para só fazer atividade supervisionada
] as const;

/** Perguntas de acompanhamento, abertas conforme as respostas. */
export const PARQ_FOLLOWUPS = ['chest_pain_rest', 'pregnancy'] as const;

export type ParqKey = (typeof PARQ_KEYS)[number] | (typeof PARQ_FOLLOWUPS)[number];

/**
 * R2.6 — bloqueiam qualquer prescrição.
 *
 * `supervised_only`: se um médico disse que só pode treinar sob supervisão,
 * um app não é supervisão. Liberar qualquer coisa além de caminhada leve
 * seria contrariar a orientação médica.
 */
const BLOCKING: ParqKey[] = ['chest_pain_rest', 'supervised_only'];

/**
 * Respostas que, sozinhas, NÃO ativam o Modo Prudência.
 *
 * Problema articular é tratado pela limitação declarada, que já remove da
 * escada os exercícios daquela articulação. Ativar a prudência por um joelho
 * dolorido travaria a pessoa no Rank D sem necessidade.
 */
const HANDLED_BY_LIMITATIONS: ParqKey[] = ['bone_joint'];

export const SCREENING_VALIDITY_MONTHS = 12;

export interface ScreeningInput {
  answers: Partial<Record<ParqKey, boolean>>;
  limitations: Limitation[];
  pregnancyRisk?: boolean;
  date: string;
}

export function evaluateParq(input: ScreeningInput): HealthScreening {
  const all = [...PARQ_KEYS, ...PARQ_FOLLOWUPS];
  const answers = Object.fromEntries(all.map((k) => [k, input.answers[k] ?? false])) as Record<string, boolean>;

  let result: ScreeningResult = 'cleared';
  if (BLOCKING.some((k) => answers[k])) {
    result = 'blocked';
  } else if (
    all.some((k) => answers[k] && !HANDLED_BY_LIMITATIONS.includes(k))
    || input.pregnancyRisk
  ) {
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
