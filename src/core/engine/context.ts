import type { DomainEvent } from '../sync/events';
import { foldAll } from '../sync/fold';
import type {
  DailyQuest, Exercise, HealthScreening, PainLogEntry, Pattern, UserProfile,
} from '../types';
import { addDays, isTrainingDay, weekIndexOf } from './calendar';
import { foldLadder } from './ladder';
import type { QuestInput } from './quest';
import type { WeeklyReference } from './scaling';

/**
 * R4.5 — referência de carga da semana anterior, POR PADRÃO.
 *
 * "Semana anterior" é a janela de 7 dias que termina uma semana atrás, não os
 * últimos 7 dias: comparar com ontem permitiria +10% por dia, que compõe para
 * +95% numa semana. Semanas de deload são puladas — senão a volta do deload
 * ficaria presa a 110% de um volume reduzido de propósito.
 */
export function lastWeekReference(
  quests: DailyQuest[], catalog: Exercise[], today: string,
): Partial<Record<Pattern, WeeklyReference>> {
  const byId = new Map(catalog.map((e) => [e.id, e]));
  const out: Partial<Record<Pattern, WeeklyReference>> = {};
  const patterns = new Set(catalog.map((e) => e.pattern));

  for (const pattern of patterns) {
    for (let k = 1; k <= 3; k++) {
      const to = addDays(today, -7 * k);
      const from = addDays(to, -6);
      const objectives = quests
        .filter((q) => q.date >= from && q.date <= to && !q.isDeload && !q.isRestDay)
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .flatMap((q) => q.objectives)
        .filter((o) => byId.get(o.exerciseId)?.pattern === pattern);

      if (objectives.length === 0) continue;
      const unit = objectives[0].unit;
      const load = Math.max(...objectives
        .filter((o) => o.unit === unit)
        .map((o) => o.targetValue * (byId.get(o.exerciseId)?.difficulty ?? 1)));
      out[pattern] = { load, unit };
      break;
    }
  }
  return out;
}

/** R4.7 — missões de treino não concluídas em sequência, das mais recentes. */
export function consecutiveFailures(quests: DailyQuest[], today: string): number {
  let n = 0;
  for (const q of [...quests].filter((q) => q.date < today && !q.isRestDay)
    .sort((a, b) => (a.date < b.date ? 1 : -1))) {
    if (q.status === 'completed') break;
    n += 1;
  }
  return n;
}

/** Dor MUSCULAR recente reduz a prontidão; dor articular é tratada pelos guardas. */
export function sorenessFrom(pain: PainLogEntry[], today: string): 0 | 1 | 2 | 3 {
  const since = addDays(today, -2);
  const n = pain.filter((p) => p.kind === 'muscle' && p.date >= since).length;
  return Math.min(3, n) as 0 | 1 | 2 | 3;
}

export interface QuestSources {
  profile: UserProfile;
  events: DomainEvent[];
  quests: DailyQuest[];
  pain: PainLogEntry[];
  screening: HealthScreening;
  catalog: Exercise[];
  startedAt: string;
  today: string;
  sleepHours?: number;
}

/**
 * Monta a entrada do motor a partir dos dados REAIS do usuário.
 *
 * Substitui os números fixos de demonstração: semana, carga anterior,
 * falhas, dor e reentrada passam a vir do log e do histórico de missões.
 */
export function buildQuestInput(src: QuestSources): QuestInput {
  const folded = foldAll(src.events);
  return {
    profile: src.profile,
    progression: folded.progression,
    screening: src.screening,
    history: folded.sessions,
    painLog: src.pain,
    catalog: src.catalog,
    date: src.today,
    weekIndex: weekIndexOf(src.startedAt, src.today),
    lastWeek: lastWeekReference(src.quests, src.catalog, src.today),
    ladder: foldLadder(src.events, src.catalog, src.profile),
    reentry: folded.streak.reentrySessionsLeft > 0,
    sleepHours: src.sleepHours ?? 7,
    soreness: sorenessFrom(src.pain, src.today),
    consecutiveFailures: consecutiveFailures(src.quests, src.today),
    isTrainingDay: isTrainingDay(src.today, src.profile.daysPerWeek),
  };
}
