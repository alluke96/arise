import {
  addDays, buildQuestInput, completeQuest, eventId, generateDailyQuest, isTrainingDay, reconcile,
} from '../../core/engine';
import type { DomainEvent } from '../../core/sync/events';
import type { DailyQuest, HealthScreening, UserProfile } from '../../core/types';
import { EXERCISES } from '../exercises';
import { SHADOW_RULES } from '../shadowRules';

/**
 * Caçador de demonstração.
 *
 * Não é um estado escrito à mão: é um LOG DE EVENTOS gerado pelo próprio
 * motor, simulando sete semanas de uso pelo mesmo caminho que o app percorre
 * (reconciliar → montar contexto → gerar missão → concluir). Por isso é
 * coerente por construção — nível, sequência, escada e sombras batem entre
 * si porque saíram das mesmas funções.
 *
 * Uma versão anterior guardava um "nível 14" solto num objeto; como a
 * progressão é recalculada a partir do log, concluir qualquer missão no modo
 * demo derrubava o caçador para o nível 1.
 */
export const DEMO_PROFILE: UserProfile = {
  hunterName: 'ALLYSON',
  age: 28,
  gender: 'male',
  weightKg: 89.1,
  heightCm: 178,
  waistCm: 97,
  goal: 'fat_loss',
  daysPerWeek: 3,
  sessionMinutes: 20,
  preferredTime: '19:00',
  location: 'home',
  equipment: ['none', 'band'],
  limitations: [],
  units: { mass: 'kg', length: 'cm' },
  locale: 'pt-BR',
  systemTone: 'cold',
};

export const DEMO_WEEKS = 7;

export interface DemoState {
  profile: UserProfile;
  screening: HealthScreening;
  startedAt: string;
  events: DomainEvent[];
  quests: DailyQuest[];
}

export function todayISO(now = new Date()): string {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

/** Sete semanas até ONTEM, relativas à data real, para o calendário bater. */
export function buildDemo(today: string = todayISO()): DemoState {
  const startedAt = addDays(today, -DEMO_WEEKS * 7);
  const screening: HealthScreening = {
    date: startedAt, answers: {}, result: 'cleared', restrictions: [],
    expiresAt: addDays(startedAt, 365),
  };

  let events: DomainEvent[] = [{
    id: 'placement', at: `${startedAt}T12:00:00.000Z`, deviceId: 'demo',
    kind: 'benchmark_passed', rankAfter: 'E',
  }];
  const quests: DailyQuest[] = [];

  // Um tropeço realista: perde um treino na semana 3 e cumpre a Zona de
  // Penalidade no dia seguinte.
  let missedOnce = false;

  for (let d = addDays(startedAt, 1); d < today; d = addDays(d, 1)) {
    events = [...events, ...reconcile({ events, today: d, daysPerWeek: 3, startedAt, deviceId: 'demo' }).toAppend];

    // Reavaliação aprovada na semana 6: sobe do E para o D.
    if (d === addDays(startedAt, 42)) {
      events = [...events, {
        id: 'bench-week-6', at: `${d}T09:00:00.000Z`, deviceId: 'demo',
        kind: 'benchmark_passed', rankAfter: 'D',
      }];
    }

    if (!isTrainingDay(d, DEMO_PROFILE.daysPerWeek)) continue;

    const q = generateDailyQuest(buildQuestInput({
      profile: DEMO_PROFILE, events, quests, pain: [], screening,
      catalog: EXERCISES, startedAt, today: d,
    }));

    if (!missedOnce && d >= addDays(startedAt, 17)) {
      missedOnce = true;
      quests.push({ ...q, status: 'failed' });
      events = [...events, {
        id: eventId.penaltyDone(d), at: `${addDays(d, 1)}T08:30:00.000Z`,
        deviceId: 'demo', kind: 'penalty_completed',
      }];
      continue;
    }

    const done: DailyQuest = {
      ...q,
      status: 'completed',
      objectives: q.objectives.map((o) => ({
        ...o, actualValue: o.targetValue, rpe: 5 as const, formOk: true, completedAt: `${d}T19:30:00`,
      })),
    };
    quests.push(done);
    events = [...events, ...completeQuest({
      quest: done, catalog: EXERCISES, events, deviceId: 'demo', durationMin: 18,
      localHour: 19, rules: SHADOW_RULES, stats: { startedAt, today: d, daysPerWeek: 3 },
    }).events];
  }

  return { profile: DEMO_PROFILE, screening, startedAt, events, quests };
}

/** Progresso parcial para a missão de hoje não nascer vazia no demo. */
export function withPartialProgress(quest: DailyQuest): DailyQuest {
  const fractions = [0.75, 1, 0, 0.55, 0];
  return {
    ...quest,
    status: 'partial',
    objectives: quest.objectives.map((o, i) => {
      const actual = Math.round(o.targetValue * (fractions[i] ?? 0));
      const done = actual >= o.targetValue;
      return { ...o, actualValue: actual, rpe: done ? 5 : null, formOk: done ? true : null };
    }),
  };
}
