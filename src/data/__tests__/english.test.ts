import { describe, expect, it } from 'vitest';
import { EXERCISES, exerciseCriteria, exerciseCues, exerciseErrors, systemName } from '../exercises';
import { EXERCISES_EN } from '../exercises.en';
import { SHADOWS, shadowText } from '../shadows';
import { SHADOWS_EN } from '../shadows.en';

/**
 * Sem estes testes, faltar uma entrada em inglês caía silenciosamente no
 * português (o fallback de `systemName` & cia.) — o usuário em en-US veria
 * texto misturado sem ninguém perceber.
 */
describe('conteúdo em inglês', () => {
  it('toda entrada em inglês corresponde a um exercício real, e vice-versa', () => {
    expect(Object.keys(EXERCISES_EN).sort()).toEqual(EXERCISES.map((e) => e.id).sort());
  });

  it.each(EXERCISES.map((e) => [e.id, e] as const))('%s tem conteúdo completo em inglês', (_, e) => {
    const en = EXERCISES_EN[e.id]!;
    expect(en.sys.length).toBeGreaterThan(2);
    expect(en.cues).toHaveLength(3);
    expect(en.errs.length).toBe(e.commonErrors.length);
    expect(en.crit.length).toBeGreaterThan(3);
    expect(systemName(e, 'en-US')).toBe(en.sys);
    expect(exerciseCues(e, 'en-US')).toEqual(en.cues);
    expect(exerciseErrors(e, 'en-US')).toEqual(en.errs);
    expect(exerciseCriteria(e, 'en-US')).toBe(en.crit);
  });

  it('nenhum texto em inglês ficou em português', () => {
    const PT = /\b(séries?|segundos|com|sem|para|joelho|quadril|ombro|não)\b|[ãõçáéíóú]/i;
    for (const [id, en] of Object.entries(EXERCISES_EN)) {
      for (const s of [en.sys, ...en.cues, ...en.errs, en.crit]) expect({ id, s, pt: PT.test(s) }).toEqual({ id, s, pt: false });
    }
    for (const [id, en] of Object.entries(SHADOWS_EN)) {
      for (const s of [en.condition, en.perk]) expect({ id, s, pt: PT.test(s) }).toEqual({ id, s, pt: false });
    }
  });

  it('toda sombra tem condição e benefício em inglês', () => {
    expect(Object.keys(SHADOWS_EN).sort()).toEqual(SHADOWS.map((s) => s.id).sort());
    for (const s of SHADOWS) {
      const en = shadowText(s, 'en-US');
      expect(en.name).toBe(s.nameEn);
      expect(en.condition).toBe(SHADOWS_EN[s.id]!.condition);
      expect(en.perk).toBe(SHADOWS_EN[s.id]!.perk);
    }
  });
});
