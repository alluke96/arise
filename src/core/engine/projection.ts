import type { DomainEvent } from '../sync/events';
import type { DailyQuest, Exercise, HealthScreening, PainLogEntry, UserProfile } from '../types';
import { addDays, reconcile } from './calendar';
import { buildQuestInput } from './context';
import { generateDailyQuest } from './quest';
import { completeQuest } from './session';
import type { ShadowRule } from './shadows';

export interface ProjectionInput {
  profile: UserProfile;
  events: DomainEvent[];
  quests: DailyQuest[];
  pain: PainLogEntry[];
  screening: HealthScreening;
  catalog: Exercise[];
  rules: Record<string, ShadowRule>;
  startedAt: string;
  today: string;
  /** Missão de hoje, se já gerada. A projeção supõe que ela será cumprida. */
  todayQuest: DailyQuest | null;
  /** Quantos dias de TREINO projetar. */
  count: number;
  deviceId?: string;
}

/** Tudo cumprido, com boa forma e esforço moderado. */
function doAll(q: DailyQuest): DailyQuest {
  return {
    ...q,
    status: 'completed',
    objectives: q.objectives.map((o) => ({ ...o, actualValue: o.targetValue, rpe: 5, formOk: true })),
  };
}

/**
 * "Se eu cumprir tudo, como ficam os próximos treinos?"
 *
 * Roda o MESMO ciclo do app — reconciliar, montar contexto, gerar, concluir —
 * sobre uma cópia do log. Nada é gravado. Serve para ver a escada andar e a
 * carga subir (no máximo 10% por semana) antes de viver as semanas.
 *
 * O rank não muda aqui: subir de rank exige passar na Reavaliação.
 */
export function projectTrainingDays(input: ProjectionInput): DailyQuest[] {
  const deviceId = input.deviceId ?? 'projection';
  const { profile, catalog, rules, startedAt, screening } = input;
  let events = [...input.events];
  const quests = [...input.quests];

  const complete = (q: DailyQuest, day: string) => {
    const done = doAll(q);
    // A versão pendente do mesmo dia sairia como "falha" na conta de
    // falhas consecutivas e derrubaria a carga da projeção.
    const same = quests.findIndex((x) => x.date === q.date);
    if (same >= 0) quests.splice(same, 1);
    quests.push(done);
    events = [...events, ...completeQuest({
      quest: done, catalog, events, deviceId, durationMin: profile.sessionMinutes, localHour: 19,
      rules, stats: { startedAt, today: day, daysPerWeek: profile.daysPerWeek },
    }).events];
  };

  const tq = input.todayQuest;
  if (tq && tq.status !== 'completed' && !tq.isRestDay) complete(tq, input.today);

  const out: DailyQuest[] = [];
  // Limite de segurança: nunca olha mais de um ano à frente.
  for (let i = 1; i <= 365 && out.length < input.count; i++) {
    const day = addDays(input.today, i);
    const rec = reconcile({ events, today: day, daysPerWeek: profile.daysPerWeek, startedAt, deviceId });
    events = [...events, ...rec.toAppend];
    const q = generateDailyQuest(buildQuestInput({
      profile, events, quests, pain: input.pain, screening, catalog, startedAt, today: day,
    }));
    if (q.isRestDay) continue;
    out.push(q);
    complete(q, day);
  }
  return out;
}
