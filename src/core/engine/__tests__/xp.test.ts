import { describe, expect, it } from 'vitest';
import { applyXp, calcXp, levelProgress, xpForLevel } from '../xp';
import type { Progression, SessionSummary } from '../../types';

const prog = (over: Partial<Progression> = {}): Progression => ({
  level: 1, xp: 0, rank: 'E',
  attributes: { STR: 0, AGI: 0, VIT: 0, PER: 0, INT: 0 },
  unspentPoints: 0, streakCurrent: 0, streakBest: 0, recoveryStones: 2,
  ...over,
});

const session = (over: Partial<SessionSummary> = {}): SessionSummary => ({
  date: '2026-09-21', durationMin: 20, avgRpe: 5, completion: 'complete',
  resistedVolume: 400, aerobicMinutes: 10, formOkRatio: 1, ...over,
});

describe('xpForLevel — R6.3', () => {
  it('cresce monotonicamente', () => {
    for (let n = 1; n < 100; n++) expect(xpForLevel(n + 1)).toBeGreaterThan(xpForLevel(n));
  });
  it('nível 1 não exige XP', () => {
    expect(xpForLevel(1)).toBe(0);
  });
});

describe('calcXp — R6.2', () => {
  it('sessão parcial rende menos que completa', () => {
    expect(calcXp(session({ completion: 'partial' }), 0))
      .toBeLessThan(calcXp(session({ completion: 'complete' }), 0));
  });
  it('boa forma rende mais que apenas completa', () => {
    expect(calcXp(session({ completion: 'complete_good_form' }), 0))
      .toBeGreaterThan(calcXp(session({ completion: 'complete' }), 0));
  });
  it('bônus de sequência satura em 50', () => {
    const a = calcXp(session(), 25);
    const b = calcXp(session(), 900);
    expect(b - a).toBe(0);
  });
});

describe('applyXp — R6.4, R6.5', () => {
  it('concede exatamente 3 pontos por nível', () => {
    const out = applyXp(prog(), xpForLevel(2));
    expect(out.level).toBe(2);
    expect(out.unspentPoints).toBe(3);
  });

  it('acumula pontos em múltiplos níveis de uma vez', () => {
    const out = applyXp(prog(), xpForLevel(5));
    expect(out.unspentPoints).toBe((out.level - 1) * 3);
  });

  // TESTE DE VIOLAÇÃO: R6.4 — nível nunca decresce, nem com XP negativo.
  it('XP negativo não reduz nível nem XP', () => {
    const start = applyXp(prog(), 5000);
    const after = applyXp(start, -99999);
    expect(after.level).toBe(start.level);
    expect(after.xp).toBe(start.xp);
  });

  it('propriedade: 2000 ganhos aleatórios nunca reduzem o nível', () => {
    let p = prog();
    for (let i = 0; i < 2000; i++) {
      const next = applyXp(p, Math.random() * 400 - 100);
      expect(next.level).toBeGreaterThanOrEqual(p.level);
      p = next;
    }
  });
});

describe('levelProgress', () => {
  it('devolve razão entre 0 e 1', () => {
    const { ratio } = levelProgress(applyXp(prog(), 250));
    expect(ratio).toBeGreaterThanOrEqual(0);
    expect(ratio).toBeLessThanOrEqual(1);
  });
});
