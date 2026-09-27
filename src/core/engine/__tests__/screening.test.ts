import { describe, expect, it } from 'vitest';
import { PARQ_KEYS, evaluateParq, isScreeningExpired } from '../screening';
import { generateDailyQuest } from '../quest';
import { EXERCISES } from '../../../data/exercises';

const run = (answers: Record<string, boolean>, extra: { pregnancyRisk?: boolean } = {}) =>
  evaluateParq({ answers, limitations: [], date: '2026-09-21', ...extra });

describe('triagem (R2)', () => {
  it('tudo "não" libera', () => {
    expect(run({}).result).toBe('cleared');
  });

  it('segue a estrutura de 7 perguntas do PAR-Q+', () => {
    expect(PARQ_KEYS).toHaveLength(7);
  });

  it.each([
    'heart_or_bp', 'chest_pain', 'dizziness', 'chronic_condition', 'chronic_meds',
  ])('"sim" em %s ativa o Modo Prudência', (key) => {
    expect(run({ [key]: true }).result).toBe('caution');
  });

  it('dor no peito em repouso bloqueia', () => {
    expect(run({ chest_pain: true, chest_pain_rest: true }).result).toBe('blocked');
  });

  it('orientação médica de só treinar supervisionado bloqueia — app não é supervisão', () => {
    expect(run({ supervised_only: true }).result).toBe('blocked');
  });

  it('problema articular sozinho é tratado pela limitação, não pela prudência', () => {
    const s = evaluateParq({ answers: { bone_joint: true }, limitations: ['knee'], date: '2026-09-21' });
    expect(s.result).toBe('cleared');
    expect(s.restrictions).toEqual(['knee']);
  });

  it('articular mais outra condição ativa a prudência', () => {
    expect(run({ bone_joint: true, heart_or_bp: true }).result).toBe('caution');
  });

  it('gravidez ativa a prudência (R15.10)', () => {
    expect(run({ pregnancy: true }).result).toBe('caution');
    expect(run({}, { pregnancyRisk: true }).result).toBe('caution');
  });

  it('a triagem vale 12 meses', () => {
    const s = run({});
    expect(s.expiresAt).toBe('2027-09-21');
    expect(isScreeningExpired(s, '2027-09-20')).toBe(false);
    expect(isScreeningExpired(s, '2027-09-21')).toBe(true);
  });

  it('triagem bloqueada nunca gera missão com exercício (R2.6)', () => {
    const screening = run({ supervised_only: true });
    const q = generateDailyQuest({
      profile: {
        hunterName: 'T', age: 50, gender: 'male', weightKg: 90, heightCm: 175, waistCm: null,
        goal: 'health', daysPerWeek: 3, sessionMinutes: 20, preferredTime: '07:00', location: 'home',
        equipment: ['none'], limitations: [], units: { mass: 'kg', length: 'cm' }, locale: 'pt-BR', systemTone: 'cold',
      },
      progression: {
        level: 1, xp: 0, rank: 'E', attributes: { STR: 0, AGI: 0, VIT: 0, PER: 0, INT: 0 },
        unspentPoints: 0, streakCurrent: 0, streakBest: 0, recoveryStones: 0,
      },
      screening, history: [], painLog: [], catalog: EXERCISES, date: '2026-09-21', weekIndex: 0,
      lastWeek: {}, sleepHours: 7, soreness: 0, consecutiveFailures: 0, isTrainingDay: true,
    });
    expect(q.objectives).toEqual([]);
  });
});
