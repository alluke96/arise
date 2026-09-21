import { describe, expect, it } from 'vitest';
import {
  MAX_WEEKLY_INCREASE, applyCautionMode, assertCanonicalAllowed,
  clampCalorieDeficit, clampWeeklyVolume, dropPainfulPatterns,
  enforceDeload, isDeloadWeek, painfulPatterns,
} from '../guards';
import type { DailyQuest, HealthScreening, PainLogEntry, Rank } from '../../types';

const screening = (result: HealthScreening['result']): HealthScreening => ({
  date: '2026-09-21', answers: {}, result, restrictions: [], expiresAt: '2027-09-21',
});

const quest = (targets: number[]): DailyQuest => ({
  id: 'q', date: '2026-09-21', rank: 'B',
  objectives: targets.map((t) => ({
    exerciseId: 'x', targetValue: t, unit: 'reps' as const,
    actualValue: 0, rpe: null, formOk: null, completedAt: null,
  })),
  status: 'pending', deadline: '2026-09-21T23:59:59',
  isDeload: false, isRestDay: false, xpAwarded: null,
});

describe('clampWeeklyVolume — R4.5', () => {
  it('permite aumento dentro do teto', () => {
    expect(clampWeeklyVolume(105, 100)).toBe(105);
  });

  it('corta aumento acima de 10%', () => {
    expect(clampWeeklyVolume(200, 100)).toBeCloseTo(110);
  });

  it('não impõe teto quando não há semana anterior', () => {
    expect(clampWeeklyVolume(50, 0)).toBe(50);
  });

  // TESTE DE VIOLAÇÃO: nenhuma entrada, por mais hostil, fura o teto.
  it.each([
    [Number.MAX_SAFE_INTEGER, 100],
    [Infinity, 100],
    [1e9, 1],
    [-5, 100],
    [NaN, 100],
  ])('entrada hostil (%s sobre %s) nunca excede o teto', (proposed, last) => {
    const out = clampWeeklyVolume(proposed, last);
    expect(out).toBeLessThanOrEqual(last * (1 + MAX_WEEKLY_INCREASE));
    expect(Number.isFinite(out)).toBe(true);
    expect(out).toBeGreaterThanOrEqual(0);
  });

  // PROPRIEDADE: para qualquer histórico aleatório, nunca passa de +10%.
  it('propriedade: 5000 entradas aleatórias respeitam o teto', () => {
    for (let i = 0; i < 5000; i++) {
      const last = Math.random() * 5000;
      const proposed = Math.random() * 100000;
      expect(clampWeeklyVolume(proposed, last)).toBeLessThanOrEqual(last * 1.1 + 1e-9);
    }
  });
});

describe('assertCanonicalAllowed — R15.2 a R15.4', () => {
  it.each<Rank>(['E', 'D', 'C', 'B'])('bloqueia a missão canônica no Rank %s', (rank) => {
    const r = assertCanonicalAllowed(rank, false);
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe('canonical_requires_rank_a');
  });

  it('libera em blocos a partir do Rank A', () => {
    expect(assertCanonicalAllowed('A', false).allowed).toBe(true);
  });

  it('exige aviso de rabdomiólise em sessão única', () => {
    const r = assertCanonicalAllowed('S', true);
    expect(r.allowed).toBe(true);
    expect(r.requiresAcknowledgement).toBe(true);
    expect(r.reason).toBe('rhabdomyolysis_warning');
  });

  // TESTE DE VIOLAÇÃO: sessão única no Rank A jamais passa sem aviso.
  it('nenhum rank permite sessão única sem aviso', () => {
    for (const rank of ['A', 'S'] as Rank[]) {
      expect(assertCanonicalAllowed(rank, true).requiresAcknowledgement).toBe(true);
    }
  });
});

describe('applyCautionMode — R2.5, R2.6, R15.9', () => {
  it('não altera nada quando a triagem está liberada', () => {
    const q = quest([30, 40]);
    expect(applyCautionMode(q, screening('cleared'))).toEqual(q);
  });

  it('zera os objetivos quando a triagem bloqueia', () => {
    const out = applyCautionMode(quest([30, 40]), screening('blocked'));
    expect(out.objectives).toHaveLength(0);
    expect(out.isRestDay).toBe(true);
  });

  it('trava o rank em D e reduz volume no Modo Prudência', () => {
    const out = applyCautionMode(quest([100]), screening('caution'));
    expect(out.rank).toBe('D');
    expect(out.objectives[0].targetValue).toBe(70);
  });

  // TESTE DE VIOLAÇÃO: rank alto não escapa do Modo Prudência.
  it('rank S é rebaixado a D sob prudência', () => {
    const q = { ...quest([50]), rank: 'S' as Rank };
    expect(applyCautionMode(q, screening('caution')).rank).toBe('D');
  });
});

describe('deload — R4.8, R4.9', () => {
  it('a 4ª semana é deload', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(isDeloadWeek))
      .toEqual([false, false, false, true, false, false, false, true]);
  });

  it('reduz 40% do volume na semana de deload', () => {
    expect(enforceDeload(100, 3)).toBeCloseTo(60);
    expect(enforceDeload(100, 2)).toBe(100);
  });
});

describe('dor articular — R15.5', () => {
  const log = (kind: PainLogEntry['kind'], n: number): PainLogEntry[] =>
    Array.from({ length: n }, (_, i) => ({ date: `2026-09-0${i + 1}`, pattern: 'squat' as const, kind }));

  it('remove o padrão após duas dores articulares', () => {
    expect(painfulPatterns(log('joint', 2))).toEqual(['squat']);
  });

  it('uma única ocorrência não remove', () => {
    expect(painfulPatterns(log('joint', 1))).toEqual([]);
  });

  it('dor muscular nunca remove padrão — DOMS é esperada', () => {
    expect(painfulPatterns(log('muscle', 9))).toEqual([]);
  });

  it('filtra os candidatos pelo padrão bloqueado', () => {
    const candidates = [{ pattern: 'squat' as const }, { pattern: 'push_h' as const }];
    expect(dropPainfulPatterns(candidates, log('joint', 2)))
      .toEqual([{ pattern: 'push_h' }]);
  });
});

describe('clampCalorieDeficit — R15.7', () => {
  it('limita o déficit a 20% do GET', () => {
    expect(clampCalorieDeficit(2500, 1200)).toBe(500);
  });
  it('nunca devolve déficit negativo', () => {
    expect(clampCalorieDeficit(2500, -300)).toBe(0);
  });
});
