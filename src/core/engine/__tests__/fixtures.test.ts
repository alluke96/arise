import { describe, expect, it } from 'vitest';
import { levelProgress, xpForLevel } from '../xp';
import { DEMO_PROGRESSION } from '../../../data/mocks/demo';
import { EXERCISES } from '../../../data/exercises';
import { isPrescribable } from '../quest';

/**
 * Os fixtures são dados que aparecem na tela. Quando saem do contrato do
 * motor, o sintoma é visual (barra de XP estourada em "649 / 483") e passa
 * despercebido — por isso a consistência é testada, não confiada.
 */
describe('DEMO_PROGRESSION é consistente com o motor', () => {
  it('o XP cai dentro da faixa do nível declarado', () => {
    const floor = xpForLevel(DEMO_PROGRESSION.level);
    const ceil = xpForLevel(DEMO_PROGRESSION.level + 1);
    expect(DEMO_PROGRESSION.xp).toBeGreaterThanOrEqual(floor);
    // XP acima do teto significa que `applyXp` não rodou: o nível estaria
    // atrasado em relação ao XP, e a barra passaria de 100%.
    expect(DEMO_PROGRESSION.xp).toBeLessThan(ceil);
  });

  it('a barra de XP fica entre 0 e 1', () => {
    const { ratio, current, needed } = levelProgress(DEMO_PROGRESSION);
    expect(ratio).toBeGreaterThanOrEqual(0);
    expect(ratio).toBeLessThanOrEqual(1);
    expect(current).toBeLessThanOrEqual(needed);
  });

  it('os atributos ficam na escala 0–100', () => {
    for (const [key, v] of Object.entries(DEMO_PROGRESSION.attributes)) {
      expect(v, key).toBeGreaterThanOrEqual(0);
      expect(v, key).toBeLessThanOrEqual(100);
    }
  });

  it('a melhor sequência nunca é menor que a atual', () => {
    expect(DEMO_PROGRESSION.streakBest).toBeGreaterThanOrEqual(DEMO_PROGRESSION.streakCurrent);
  });
});

describe('catálogo de exercícios', () => {
  it('não tem id duplicado', () => {
    const ids = EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('toda regressão e progressão aponta para um exercício existente', () => {
    const ids = new Set(EXERCISES.map((e) => e.id));
    for (const e of EXERCISES) {
      if (e.regressionId) expect(ids.has(e.regressionId), `${e.id}.regressionId`).toBe(true);
      if (e.progressionId) expect(ids.has(e.progressionId), `${e.id}.progressionId`).toBe(true);
    }
  });

  it('a escada é monotônica: a progressão nunca é mais fácil', () => {
    for (const e of EXERCISES) {
      if (!e.progressionId) continue;
      const next = EXERCISES.find((x) => x.id === e.progressionId)!;
      expect(next.difficulty, `${e.id} → ${next.id}`).toBeGreaterThan(e.difficulty);
    }
  });

  it('todo exercício tem 3 cues e ao menos um erro comum', () => {
    for (const e of EXERCISES) {
      expect(e.cues.length, `${e.id}.cues`).toBe(3);
      expect(e.commonErrors.length, `${e.id}.commonErrors`).toBeGreaterThan(0);
    }
  });

  /** R11.4 — padrão de carga sem ilustração não pode ser prescrito. */
  it('exercício de carga sem ilustração fica não-prescritível', () => {
    const blocked = EXERCISES.filter((e) => !isPrescribable(e));
    for (const e of blocked) {
      expect(e.illustrations, `${e.id}`).toBeNull();
    }
    // O seed mantém um caso de propósito, para a regra ser exercitada.
    expect(blocked.length).toBeGreaterThan(0);
  });
});
