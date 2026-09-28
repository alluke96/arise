import { describe, expect, it } from 'vitest';
import { projectTrainingDays } from '../projection';
import { rankAtLeast } from '../rank';
import { weekIndexOf } from '../calendar';
import { EXERCISES, exerciseById } from '../../../data/exercises';
import { SHADOW_RULES } from '../../../data/shadowRules';
import type { DomainEvent } from '../../sync/events';
import type { HealthScreening, Pattern, UserProfile } from '../../types';

/** Sedentário típico: rank E, só peso do corpo, 3 dias por semana. */
const profile: UserProfile = {
  hunterName: 'T', age: 38, gender: 'unspecified', weightKg: 92, heightCm: 172, waistCm: null,
  goal: 'habit', daysPerWeek: 3, sessionMinutes: 20, preferredTime: '19:00', location: 'home',
  equipment: ['none'], limitations: [], units: { mass: 'kg', length: 'cm' },
  locale: 'pt-BR', systemTone: 'cold',
};
const START = '2026-09-14';
const screening: HealthScreening = {
  date: START, answers: {}, result: 'cleared', restrictions: [], expiresAt: '2027-09-14',
};
const placement: DomainEvent = {
  id: 'placement', at: `${START}T12:00:00.000Z`, deviceId: 'd', kind: 'benchmark_passed', rankAfter: 'E',
};

const project = (count: number, events: DomainEvent[] = [placement]) => projectTrainingDays({
  profile, events, quests: [], pain: [], screening, catalog: EXERCISES, rules: SHADOW_RULES,
  startedAt: START, today: START, todayQuest: null, count,
});

const patternOf = (id: string) => exerciseById(id)!.pattern;

describe('projeção dos próximos treinos (12 semanas de um sedentário)', () => {
  const plan = project(36);

  it('gera exatamente os dias de treino pedidos, sem dia de descanso', () => {
    expect(plan).toHaveLength(36);
    expect(plan.every((q) => !q.isRestDay && q.objectives.length > 0)).toBe(true);
  });

  it('começa pelo degrau mais fácil de cada padrão', () => {
    const first = plan[0].objectives.map((o) => o.exerciseId);
    expect(first).toContain('push_wall');
    expect(first.some((id) => id === 'squat_chair_assisted')).toBe(true);
  });

  it('nunca prescreve acima do rank E', () => {
    for (const q of plan) {
      for (const o of q.objectives) {
        expect(rankAtLeast('E', exerciseById(o.exerciseId)!.minRank), o.exerciseId).toBe(true);
      }
    }
  });

  it('a dificuldade de cada padrão só sobe ou se mantém', () => {
    const last = new Map<Pattern, number>();
    for (const q of plan) {
      for (const o of q.objectives) {
        const ex = exerciseById(o.exerciseId)!;
        const prev = last.get(ex.pattern) ?? 0;
        expect(ex.difficulty, `${q.date} ${ex.id}`).toBeGreaterThanOrEqual(prev);
        last.set(ex.pattern, ex.difficulty);
      }
    }
  });

  it('a escada anda: a flexão sai da parede', () => {
    const push = plan.at(-1)!.objectives.find((o) => patternOf(o.exerciseId) === 'push_h')!;
    expect(push.exerciseId).not.toBe('push_wall');
  });

  it('carga por padrão sobe no máximo 10% de uma semana para a outra', () => {
    const byWeek = new Map<string, number>();
    for (const q of plan) {
      if (q.isDeload) continue;
      const w = weekIndexOf(START, q.date);
      for (const o of q.objectives) {
        const ex = exerciseById(o.exerciseId)!;
        if (o.unit !== 'reps') continue;
        const key = `${ex.pattern}:${w}`;
        byWeek.set(key, Math.max(byWeek.get(key) ?? 0, o.targetValue * ex.difficulty));
      }
    }
    for (const [key, load] of byWeek) {
      const [pattern, w] = key.split(':');
      const prev = byWeek.get(`${pattern}:${Number(w) - 1}`);
      if (prev) expect(load, key).toBeLessThanOrEqual(Math.ceil(prev * 1.1));
    }
  });

  it('a missão de hoje ainda pendente é tratada como cumprida, não como falha', () => {
    const today = plan[0];
    const pending = { ...today, status: 'pending' as const };
    const withToday = projectTrainingDays({
      profile, events: [placement], quests: [pending], pain: [], screening, catalog: EXERCISES,
      rules: SHADOW_RULES, startedAt: START, today: today.date, todayQuest: pending, count: 1,
    });
    // Igual ao segundo dia da projeção original, que também supôs o primeiro cumprido.
    expect(withToday[0].objectives).toEqual(plan[1].objectives);
  });

  it('não altera o log original', () => {
    const events = [placement];
    project(6, events);
    expect(events).toHaveLength(1);
  });
});
