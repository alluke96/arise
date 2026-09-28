import { describe, expect, it } from 'vitest';
import { PER_FULL_SESSIONS, deriveAttributes, type AttributeInput } from '../attributes';
import { foldAll } from '../../sync/fold';
import type { DomainEvent } from '../../sync/events';

const base: AttributeInput = {
  resistedVolume4w: 0, aerobicMinutesPerWeek: 0, mobilityScore: 0, sessionsPerWeek: 0,
  avgSteps: 0, avgSleepHours: 0, formOkRatio: 0, formOkTotal: 0, articlesRead: 0, weeksPlanned: 0,
};

const session = (day: number, formOkRatio = 1): DomainEvent => {
  const date = `2026-${String(9 + Math.floor(day / 28)).padStart(2, '0')}-${String(1 + (day % 28)).padStart(2, '0')}`;
  return {
    id: `session:${date}`, at: `${date}T12:00:00.000Z`, deviceId: 'd', kind: 'session_completed',
    session: {
      date, durationMin: 15, avgRpe: 5, completion: 'complete_good_form',
      resistedVolume: 30, aerobicMinutes: 8, formOkRatio, results: [],
    },
  };
};

describe('atributos são construídos, não medidos', () => {
  it('sem treino, tudo é zero — nada nasce de dado inventado', () => {
    expect(deriveAttributes(base)).toEqual({ STR: 0, AGI: 0, VIT: 0, PER: 0, INT: 0 });
  });

  it('o caso reportado: UM dia de treino com boa forma não leva a Percepção a 100', () => {
    const { attributes } = foldAll([session(0)]).progression;
    expect(attributes.PER).toBeLessThanOrEqual(2);
    for (const v of Object.values(attributes)) expect(v).toBeLessThan(10);
  });

  it('a Percepção cresce sessão a sessão e só chega a 100 depois de muitas', () => {
    const at = (n: number) => foldAll(Array.from({ length: n }, (_, i) => session(i * 2))).progression.attributes.PER;
    expect(at(10)).toBeLessThan(at(30));
    expect(at(30)).toBeLessThan(50);
    expect(at(PER_FULL_SESSIONS)).toBe(100);
  });

  it('forma recente ruim derruba a Percepção pela metade', () => {
    const good = deriveAttributes({ ...base, formOkTotal: PER_FULL_SESSIONS, formOkRatio: 1 }).PER;
    const sloppy = deriveAttributes({ ...base, formOkTotal: PER_FULL_SESSIONS, formOkRatio: 0 }).PER;
    expect(good).toBe(100);
    expect(sloppy).toBe(50);
  });

  it('sono e passos só contam quando medidos', () => {
    const noHealth = deriveAttributes({ ...base, sessionsPerWeek: 3 }).VIT;
    expect(noHealth).toBe(60);
    const withSleep = deriveAttributes({ ...base, sessionsPerWeek: 3, avgSleepHours: 8 }).VIT;
    expect(withSleep).toBeGreaterThan(noHealth);
  });
});
