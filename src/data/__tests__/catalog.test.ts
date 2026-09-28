import { describe, expect, it } from 'vitest';
import { EXERCISES, exerciseById, exercisesByPattern, ladderFor } from '../exercises';
import { GRADE_ORDER, SHADOWS } from '../shadows';
import { PROGRAMS, stepGoalFor } from '../programs';
import { generateDailyQuest, isPrescribable } from '../../core/engine';
import { RANKS, type Limitation, type Rank, type UserProfile } from '../../core/types';

const LOAD_PATTERNS = [
  'push_h', 'push_v', 'pull_h', 'pull_v', 'squat', 'hinge',
  'unilateral', 'core_anti_ext', 'core_anti_rot', 'trunk_flex',
] as const;

describe('catalogo de exercicios', () => {
  it('tem os 80 exercicios previstos', () => {
    expect(EXERCISES).toHaveLength(80);
  });

  it('nao tem id duplicado', () => {
    const ids = EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('todo link de escada aponta para exercicio existente', () => {
    for (const e of EXERCISES) {
      if (e.regressionId) expect(exerciseById(e.regressionId), `${e.id}.regressionId`).toBeDefined();
      if (e.progressionId) expect(exerciseById(e.progressionId), `${e.id}.progressionId`).toBeDefined();
    }
  });

  it('a escada e monotonica: progredir nunca fica mais facil', () => {
    for (const e of EXERCISES) {
      if (!e.progressionId) continue;
      const next = exerciseById(e.progressionId)!;
      expect(next.difficulty, `${e.id} -> ${next.id}`).toBeGreaterThan(e.difficulty);
    }
  });

  it('as escadas sao simetricas: se A progride para B, B regride para A', () => {
    for (const e of EXERCISES) {
      if (!e.progressionId) continue;
      const next = exerciseById(e.progressionId)!;
      expect(next.regressionId, `${next.id} deveria regredir para ${e.id}`).toBe(e.id);
    }
  });

  it('nenhuma escada tem ciclo', () => {
    for (const e of EXERCISES) {
      const chain = ladderFor(e.id);
      expect(new Set(chain.map((x) => x.id)).size, `ciclo em ${e.id}`).toBe(chain.length);
    }
  });

  /**
   * O cue e a UNICA instrucao de forma que o usuario recebe enquanto nao ha
   * ilustracao. Um cue de uma palavra nao ensina nada, entao a assercao mede
   * substancia: duas palavras por cue, e os tres somados precisam dizer algo.
   */
  it('todo exercicio tem 3 cues com substancia e ao menos um erro comum', () => {
    for (const e of EXERCISES) {
      expect(e.cues, `${e.id}.cues`).toHaveLength(3);
      expect(e.commonErrors.length, `${e.id}.commonErrors`).toBeGreaterThan(0);

      for (const c of [...e.cues, ...e.commonErrors]) {
        expect(c.trim().split(/\s+/).length, `${e.id}: "${c}" tem menos de 2 palavras`)
          .toBeGreaterThanOrEqual(2);
        expect(c.trim(), `${e.id}: "${c}" nao deveria terminar em ponto`).not.toMatch(/\.$/);
      }
      expect(e.cues.join(' ').length, `${e.id}: os 3 cues somados dizem pouco`)
        .toBeGreaterThan(70);
    }
  });

  it('todo exercicio tem criterio de progressao', () => {
    for (const e of EXERCISES) {
      expect(e.progressionCriteria.length, `${e.id}`).toBeGreaterThan(10);
    }
  });

  it('exercicio de carga sem ilustracao e nao-prescritivel quando a regra esta ligada', () => {
    for (const e of EXERCISES) {
      if (!LOAD_PATTERNS.includes(e.pattern as (typeof LOAD_PATTERNS)[number])) continue;
      expect(isPrescribable(e, true), `${e.id}`).toBe(e.illustrations !== null);
      // Build de teste: a regra desligada libera tudo.
      expect(isPrescribable(e, false), `${e.id}`).toBe(true);
    }
  });

  it('exercicio sem equipamento nao pede objeto que a pessoa nao marcou', () => {
    // Parede, chao, cadeira, sofa, mesa e degrau de escada existem em qualquer casa.
    const OBJECTS = /\b(bola|bast[aã]o|caixa|halter|elástico|barra|banco|anilha|kettlebell|corda|toalha)\b/i;
    for (const e of EXERCISES) {
      if (!e.equipment.includes('none')) continue;
      for (const text of [e.namePt, ...e.cues]) expect(OBJECTS.test(text), `${e.id}: ${text}`).toBe(false);
    }
  });

  it('cada padrao tem a quantidade prevista no spec', () => {
    const counts: Record<string, number> = {
      push_h: 9, push_v: 5, pull_h: 7, pull_v: 5, squat: 9, hinge: 7,
      unilateral: 6, core_anti_ext: 6, core_anti_rot: 4, trunk_flex: 4,
      carry: 3, aerobic: 8, mobility: 7,
    };
    for (const [pattern, n] of Object.entries(counts)) {
      expect(exercisesByPattern(pattern as never).length, pattern).toBe(n);
    }
  });
});

/**
 * O teste que mais importa deste arquivo: prova que o motor monta uma Missao
 * Diaria em QUALQUER rank, com qualquer combinacao de limitacao e
 * equipamento. Um buraco de catalogo aqui significa um usuario real abrindo o
 * app e nao recebendo missao nenhuma.
 */
describe('cobertura: o motor monta missao em qualquer cenario', () => {
  const baseProfile: UserProfile = {
    hunterName: 'T', age: 30, gender: 'male', weightKg: 80, heightCm: 175, waistCm: null,
    goal: 'health', daysPerWeek: 3, sessionMinutes: 20, preferredTime: '19:00',
    location: 'home', equipment: ['none'], limitations: [],
    units: { mass: 'kg', length: 'cm' }, locale: 'pt-BR', systemTone: 'cold',
  };

  const makeQuest = (rank: Rank, limitations: Limitation[], equipment: UserProfile['equipment']) =>
    generateDailyQuest({
      profile: { ...baseProfile, limitations, equipment },
      progression: {
        level: 1, xp: 0, rank,
        attributes: { STR: 20, AGI: 20, VIT: 40, PER: 20, INT: 10 },
        unspentPoints: 0, streakCurrent: 0, streakBest: 0, recoveryStones: 2,
      },
      screening: {
        date: '2026-09-01', answers: {}, result: 'cleared',
        restrictions: limitations, expiresAt: '2027-09-01',
      },
      history: [], painLog: [], catalog: EXERCISES, date: '2026-09-21',
      weekIndex: 0, lastWeek: {}, sleepHours: 7, soreness: 0,
      consecutiveFailures: 0, isTrainingDay: true,
    });

  it.each(RANKS)('rank %s recebe missao so com peso corporal', (rank) => {
    expect(makeQuest(rank, [], ['none']).objectives.length).toBeGreaterThanOrEqual(3);
  });

  const ALL_LIMITS: Limitation[] = ['knee', 'lower_back', 'shoulder', 'wrist', 'neck'];

  it.each(ALL_LIMITS)('limitacao de %s ainda rende missao em todos os ranks', (limit) => {
    for (const rank of RANKS) {
      expect(makeQuest(rank, [limit], ['none', 'band']).objectives.length,
        `${rank} com ${limit}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('mesmo com todas as limitacoes juntas o usuario recebe algo para fazer', () => {
    for (const rank of RANKS) {
      const q = makeQuest(rank, ALL_LIMITS, ['none', 'band', 'dumbbell', 'gym', 'pullup_bar']);
      expect(q.objectives.length, rank).toBeGreaterThanOrEqual(1);
    }
  });

  it('nenhuma missao prescreve exercicio contraindicado', () => {
    for (const rank of RANKS) {
      for (const limit of ALL_LIMITS) {
        const q = makeQuest(rank, [limit], ['none', 'band', 'dumbbell', 'gym', 'pullup_bar']);
        for (const o of q.objectives) {
          const ex = exerciseById(o.exerciseId)!;
          expect(ex.contraindications, `${rank}/${limit}/${ex.id}`).not.toContain(limit);
        }
      }
    }
  });

  it('nenhuma missao prescreve exercicio bloqueado por falta de ilustracao', () => {
    for (const rank of RANKS) {
      const q = makeQuest(rank, [], ['none', 'band', 'dumbbell', 'gym', 'pullup_bar']);
      for (const o of q.objectives) {
        expect(isPrescribable(exerciseById(o.exerciseId)!), o.exerciseId).toBe(true);
      }
    }
  });

  it('nenhuma missao prescreve exercicio sem o equipamento do usuario', () => {
    for (const rank of RANKS) {
      const q = makeQuest(rank, [], ['none']);
      for (const o of q.objectives) {
        expect(exerciseById(o.exerciseId)!.equipment, o.exerciseId).toContain('none');
      }
    }
  });
});

describe('sombras', () => {
  it('sao 40', () => { expect(SHADOWS).toHaveLength(40); });

  it('nao tem id duplicado', () => {
    expect(new Set(SHADOWS.map((s) => s.id)).size).toBe(40);
  });

  it('toda sombra tem condicao e beneficio funcional descritos', () => {
    for (const s of SHADOWS) {
      expect(s.conditionPt.length, `${s.id}.condition`).toBeGreaterThan(10);
      expect(s.perkPt.length, `${s.id}.perk`).toBeGreaterThan(10);
    }
  });

  it('cobre todos os graus', () => {
    for (const g of GRADE_ORDER) {
      expect(SHADOWS.filter((s) => s.grade === g).length, g).toBeGreaterThan(0);
    }
  });
});

describe('programas', () => {
  it('ha um programa por rank', () => {
    for (const rank of RANKS) expect(PROGRAMS[rank].rank).toBe(rank);
  });

  it('frequencia, volume e RPE nunca regridem ao subir de rank', () => {
    for (let i = 1; i < RANKS.length; i++) {
      const prev = PROGRAMS[RANKS[i - 1]];
      const cur = PROGRAMS[RANKS[i]];
      expect(cur.weeksFrom, RANKS[i]).toBeGreaterThan(prev.weeksFrom);
      expect(cur.daysPerWeek[1]).toBeGreaterThanOrEqual(prev.daysPerWeek[1]);
      expect(cur.sets).toBeGreaterThanOrEqual(prev.sets);
      expect(cur.rpe[1]).toBeGreaterThanOrEqual(prev.rpe[1]);
    }
  });

  it('o Rank E e conservador, como a literatura exige para destreinados', () => {
    const e = PROGRAMS.E;
    expect(e.sets).toBe(2);
    expect(e.rpe[1]).toBeLessThanOrEqual(5);
    expect(e.sessionMinutes[1]).toBeLessThanOrEqual(15);
  });

  it('todo padrao listado num programa existe no catalogo', () => {
    for (const rank of RANKS) {
      for (const p of PROGRAMS[rank].patterns) {
        expect(exercisesByPattern(p).length, `${rank}/${p}`).toBeGreaterThan(0);
      }
    }
  });

  it('a meta de passos sobe gradualmente e respeita o teto do rank', () => {
    expect(stepGoalFor('E', 0)).toBe(3000);
    expect(stepGoalFor('E', 4)).toBe(PROGRAMS.E.stepGoal);
    expect(stepGoalFor('C', 20)).toBe(PROGRAMS.C.stepGoal);
    for (let w = 0; w < 30; w++) {
      expect(stepGoalFor('B', w)).toBeLessThanOrEqual(PROGRAMS.B.stepGoal);
    }
  });
});
