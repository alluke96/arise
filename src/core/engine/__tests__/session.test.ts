import { describe, expect, it } from 'vitest';
import { adjustObjective, completeQuest, summarizeQuest } from '../session';
import { buildQuestInput, consecutiveFailures, lastWeekReference, sorenessFrom } from '../context';
import { generateDailyQuest } from '../quest';
import { addDays, eventId, reconcile } from '../calendar';
import { computeStats, evaluateShadows, ruleProgress } from '../shadows';
import { foldAll } from '../../sync/fold';
import { EXERCISES, exerciseById } from '../../../data/exercises';
import { SHADOWS } from '../../../data/shadows';
import { SHADOW_RULES } from '../../../data/shadowRules';
import type { DomainEvent } from '../../sync/events';
import type { DailyQuest, HealthScreening, UserProfile } from '../../types';

const profile: UserProfile = {
  hunterName: 'T', age: 30, gender: 'male', weightKg: 85, heightCm: 178, waistCm: null,
  goal: 'habit', daysPerWeek: 3, sessionMinutes: 20, preferredTime: '19:00', location: 'home',
  equipment: ['none', 'band'], limitations: [], units: { mass: 'kg', length: 'cm' },
  locale: 'pt-BR', systemTone: 'cold',
};
const screening: HealthScreening = {
  date: '2026-09-13', answers: {}, result: 'cleared', restrictions: [], expiresAt: '2027-09-13',
};
const START = '2026-09-13';

const quest = (date: string, over: Partial<DailyQuest> = {}): DailyQuest => ({
  id: `quest-${date}`, date, rank: 'E', status: 'pending', deadline: `${date}T23:59:59`,
  isDeload: false, isRestDay: false, xpAwarded: null,
  objectives: [
    { exerciseId: 'push_wall', targetValue: 10, unit: 'reps', actualValue: 10, rpe: 5, formOk: true, completedAt: null },
    { exerciseId: 'squat_chair_assisted', targetValue: 15, unit: 'reps', actualValue: 15, rpe: 5, formOk: true, completedAt: null },
    { exerciseId: 'walk', targetValue: 10, unit: 'minutes', actualValue: 10, rpe: 3, formOk: true, completedAt: null },
  ],
  ...over,
});

const complete = (q: DailyQuest, events: DomainEvent[], today = q.date) => completeQuest({
  quest: q, catalog: EXERCISES, events, deviceId: 'd', durationMin: 14, localHour: 19,
  rules: SHADOW_RULES, stats: { startedAt: START, today, daysPerWeek: 3 },
});

describe('resumo da sessão', () => {
  it('tudo cumprido com boa forma', () => {
    const s = summarizeQuest(quest('2026-09-14'), EXERCISES, { durationMin: 14 });
    expect(s.completion).toBe('complete_good_form');
    expect(s.aerobicMinutes).toBe(10);
    expect(s.resistedVolume).toBe(10 * 1 + 15 * 1);
    expect(s.results).toHaveLength(3);
  });

  it('parcial quando falta algo', () => {
    const q = quest('2026-09-14');
    q.objectives[0].actualValue = 4;
    expect(summarizeQuest(q, EXERCISES, { durationMin: 10 }).completion).toBe('partial');
  });

  it('descanso honrado vale como dia, não como treino', () => {
    const s = summarizeQuest(quest('2026-09-15', { isRestDay: true, objectives: [] }), EXERCISES, { durationMin: 0 });
    expect(s.rest).toBe(true);
    expect(s.resistedVolume).toBe(0);
  });
});

describe('concluir a missão', () => {
  it('o XP é a diferença do fold, não uma fórmula paralela', () => {
    const c = complete(quest('2026-09-14'), []);
    expect(c.xpGained).toBeGreaterThan(0);
    expect(c.after.xp - c.before.xp).toBe(c.xpGained);
  });

  it('a primeira missão extrai a Sentinela', () => {
    expect(complete(quest('2026-09-14'), []).newShadowIds).toContain('sentinela');
  });

  it('concluir de novo o mesmo dia não dá XP em dobro', () => {
    const first = complete(quest('2026-09-14'), []);
    const again = complete(quest('2026-09-14'), first.events);
    expect(again.xpGained).toBe(0);
    expect(again.newShadowIds).toEqual([]);
  });

  it('subir de nível concede exatamente 3 pontos por nível', () => {
    let events: DomainEvent[] = [];
    let last = complete(quest('2026-09-14'), events);
    for (let d = 0; d < 40 && last.levelsGained === 0; d++) {
      events = [...events, ...last.events];
      last = complete(quest(addDays('2026-09-16', d)), events);
    }
    expect(last.levelsGained).toBeGreaterThan(0);
    expect(last.pointsGained).toBe(last.levelsGained * 3);
  });
});

describe('ajuste na hora (R5.8/R5.9)', () => {
  const q = () => quest('2026-09-21', {
    rank: 'D',
    objectives: [{ exerciseId: 'push_knee', targetValue: 20, unit: 'reps', actualValue: 5, rpe: null, formOk: null, completedAt: null }],
  });

  it('"muito difícil" troca pela regressão sem aumentar o alvo', () => {
    const a = adjustObjective({
      quest: q(), exerciseId: 'push_knee', direction: 'easier', catalog: EXERCISES,
      profile, rank: 'D', deviceId: 'd', at: '2026-09-21T19:00:00Z',
    })!;
    expect(a.toExercise.id).toBe('push_step');
    expect(a.quest.objectives[0].targetValue).toBe(20);
    expect(a.event.kind).toBe('exercise_adjusted');
  });

  it('"muito fácil" sobe de degrau e reduz as repetições na proporção da dificuldade', () => {
    const a = adjustObjective({
      quest: q(), exerciseId: 'push_knee', direction: 'harder', catalog: EXERCISES,
      profile, rank: 'D', deviceId: 'd', at: '2026-09-21T19:00:00Z',
    })!;
    const from = exerciseById('push_knee')!;
    expect(a.toExercise.id).toBe('push_negative');
    expect(a.quest.objectives[0].targetValue * a.toExercise.difficulty)
      .toBeLessThanOrEqual(20 * from.difficulty);
  });

  it('no topo do rank não há "mais difícil"', () => {
    expect(adjustObjective({
      quest: q(), exerciseId: 'push_negative', direction: 'harder', catalog: EXERCISES,
      profile, rank: 'D', deviceId: 'd', at: '2026-09-21T19:00:00Z',
    })).toBeNull();
  });
});

describe('contexto a partir de dados reais', () => {
  const pushQuest = (date: string, target: number, isDeload = false): DailyQuest => ({
    ...quest(date, { isDeload }),
    rank: 'D',
    objectives: [{ exerciseId: 'push_knee', targetValue: target, unit: 'reps', actualValue: target, rpe: 5, formOk: true, completedAt: null }],
  });

  it('a referência é a semana passada, não ontem', () => {
    const today = '2026-09-28';
    const quests = [pushQuest('2026-09-16', 20), pushQuest('2026-09-25', 21)];
    // Janela da semana anterior: 15–21. O 25 (esta semana) não entra.
    expect(lastWeekReference(quests, EXERCISES, today).push_h).toEqual({ load: 20 * 5, unit: 'reps' });
  });

  it('pula semana de deload', () => {
    const today = '2026-09-28';
    const quests = [pushQuest('2026-09-09', 20), pushQuest('2026-09-16', 12, true)];
    expect(lastWeekReference(quests, EXERCISES, today).push_h?.load).toBe(20 * 5);
  });

  it('falhas consecutivas contam só missões de treino passadas', () => {
    const qs = [
      { ...pushQuest('2026-09-14', 20), status: 'completed' as const },
      { ...pushQuest('2026-09-16', 20), status: 'partial' as const },
      { ...pushQuest('2026-09-17', 0), isRestDay: true },
      { ...pushQuest('2026-09-18', 20), status: 'pending' as const },
    ];
    expect(consecutiveFailures(qs, '2026-09-21')).toBe(2);
  });

  it('dor muscular recente reduz a prontidão', () => {
    expect(sorenessFrom([
      { date: '2026-09-20', pattern: 'squat', kind: 'muscle' },
      { date: '2026-09-20', pattern: 'squat', kind: 'joint' },
      { date: '2026-09-10', pattern: 'push_h', kind: 'muscle' },
    ], '2026-09-21')).toBe(1);
  });
});

/**
 * O ciclo inteiro, dia a dia, pelo caminho que o app usa: reconciliar,
 * montar o contexto, gerar a missão, concluir. Um mês de uso.
 */
describe('um mês de uso real', () => {
  it('o alvo de cada padrão nunca sobe mais de 10% por semana, com a escada andando', () => {
    let events: DomainEvent[] = [];
    const quests: DailyQuest[] = [];
    const loadByWeek = new Map<number, number>();

    for (let d = 1; d <= 42; d++) {
      const today = addDays(START, d);
      const rec = reconcile({ events, today, daysPerWeek: 3, startedAt: START, deviceId: 'd' });
      events = [...events, ...rec.toAppend];

      const input = buildQuestInput({
        profile, events, quests, pain: [], screening, catalog: EXERCISES, startedAt: START, today,
      });
      const q = generateDailyQuest(input);
      if (q.isRestDay) continue;

      const push = q.objectives.find((o) => exerciseById(o.exerciseId)!.pattern === 'push_h')!;
      const load = push.targetValue * exerciseById(push.exerciseId)!.difficulty;
      const week = input.weekIndex;
      loadByWeek.set(week, Math.max(loadByWeek.get(week) ?? 0, load));

      // O usuário cumpre tudo, com boa forma.
      const done: DailyQuest = {
        ...q, status: 'completed',
        objectives: q.objectives.map((o) => ({ ...o, actualValue: o.targetValue, rpe: 5, formOk: true })),
      };
      quests.push(done);
      events = [...events, ...complete(done, events, today).events];
    }

    const weeks = [...loadByWeek.keys()].sort((a, b) => a - b);
    for (let i = 1; i < weeks.length; i++) {
      const prev = loadByWeek.get(weeks[i - 1])!;
      const cur = loadByWeek.get(weeks[i])!;
      expect(cur, `semana ${weeks[i]}: ${cur} vs ${prev}`).toBeLessThanOrEqual(prev * 1.1 + 1e-9);
    }
    // E a escada efetivamente andou: saiu da flexão na parede.
    const lastPush = quests.at(-1)!.objectives.find((o) => exerciseById(o.exerciseId)!.pattern === 'push_h')!;
    expect(lastPush.exerciseId).not.toBe('push_wall');
    // Sequência, sombras e nível refletem o mês.
    const { progression } = foldAll(events);
    expect(progression.streakCurrent).toBeGreaterThan(10);
    expect(progression.level).toBeGreaterThan(1);
  });
});

describe('sombras por regra', () => {
  it('toda sombra do catálogo tem regra, e vice-versa', () => {
    expect(Object.keys(SHADOW_RULES).sort()).toEqual(SHADOWS.map((s) => s.id).sort());
  });

  it('sombra indisponível nunca é extraída', () => {
    const stats = computeStats([], { startedAt: START, today: '2027-09-13', daysPerWeek: 3, catalog: EXERCISES, streakBest: 999 });
    const { newlyUnlocked } = evaluateShadows(SHADOW_RULES, stats, new Set());
    for (const id of ['berserker', 'estrategista', 'mentor', 'arquiteto']) {
      expect(newlyUnlocked).not.toContain(id);
    }
  });

  it('o progresso fica entre 0 e 1', () => {
    const stats = computeStats([], { startedAt: START, today: '2026-10-13', daysPerWeek: 3, catalog: EXERCISES, streakBest: 4 });
    for (const rule of Object.values(SHADOW_RULES)) {
      const p = ruleProgress(rule, stats);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });

  it('a primeira flexão completa extrai o Espadachim Carmesim', () => {
    const e: DomainEvent = {
      id: 's1', at: '2026-10-01T12:00:00.000Z', deviceId: 'd', kind: 'session_completed',
      session: {
        date: '2026-10-01', durationMin: 20, avgRpe: 7, completion: 'complete', resistedVolume: 70,
        aerobicMinutes: 0, formOkRatio: 1, results: [{ exerciseId: 'push_full', value: 10, completed: true, formOk: true }],
      },
    };
    const stats = computeStats([e], { startedAt: START, today: '2026-10-01', daysPerWeek: 3, catalog: EXERCISES, streakBest: 1 });
    expect(evaluateShadows(SHADOW_RULES, stats, new Set()).newlyUnlocked).toContain('carmesim');
  });

  it('a sombra de sequência usa a frequência do usuário', () => {
    const stats = computeStats([], { startedAt: START, today: '2026-10-13', daysPerWeek: 3, catalog: EXERCISES, streakBest: 12 });
    expect(ruleProgress({ kind: 'streak_weeks', weeks: 4 }, stats)).toBe(1);
  });

  it('treino noturno conta pela hora local', () => {
    const late: DomainEvent[] = Array.from({ length: 5 }, (_, i) => ({
      id: `n${i}`, at: `2026-09-${14 + i}T12:00:00.000Z`, deviceId: 'd', kind: 'session_completed' as const,
      session: {
        date: `2026-09-${14 + i}`, durationMin: 15, avgRpe: 5 as const, completion: 'complete' as const,
        resistedVolume: 100, aerobicMinutes: 10, formOkRatio: 1, localHour: 22,
      },
    }));
    const stats = computeStats(late, { startedAt: START, today: '2026-09-20', daysPerWeek: 3, catalog: EXERCISES, streakBest: 5 });
    expect(ruleProgress(SHADOW_RULES.vigia_noturno, stats)).toBe(1);
  });
});

void eventId;
