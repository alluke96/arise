import { describe, expect, it } from 'vitest';
import {
  MIN_WEEKLY_STEP, loadFactor, scaleObjective, weeklyCeiling, type ScalingContext,
} from '../scaling';
import { generateDailyQuest, type QuestInput } from '../quest';
import { EXERCISES, exerciseById } from '../../../data/exercises';
import { MAX_WEEKLY_INCREASE } from '../guards';
import { RANKS, type Pattern, type Rank, type UserProfile } from '../../types';

/**
 * R4.5 DE PONTA A PONTA.
 *
 * Os testes de `clampWeeklyVolume` passavam enquanto a regra não funcionava:
 * a função estava certa, a CHAMADA não — ela comparava o alvo de um exercício
 * (dezenas de repetições) com o volume total da semana (milhares). Estes
 * testes exercitam o caminho real, do contexto até o número que vai para a
 * tela, que é onde a regra precisa valer.
 */
function ctx(over: Partial<ScalingContext> = {}): ScalingContext {
  return {
    rank: 'B', pattern: 'push_h', unit: 'reps', difficulty: 7, isTrainingDay: true,
    readiness: 1.1, progression: 1.1, recalibration: 1, weekIndex: 1, ...over,
  };
}

describe('teto semanal no caminho real', () => {
  it('o caso que estava quebrado: 20 flexões semana passada não viram 54', () => {
    const lastLoad = 20 * 7; // 20 repetições de um exercício de dificuldade 7
    const target = scaleObjective(ctx({ lastWeek: { load: lastLoad, unit: 'reps' } }));
    expect(target).toBeLessThanOrEqual(22);
  });

  it('propriedade: 20.000 contextos aleatórios nunca furam +10% de carga', () => {
    const patterns: Pattern[] = ['push_h', 'squat', 'pull_h', 'core_anti_ext', 'aerobic'];
    const units = ['reps', 'seconds', 'minutes'] as const;
    let rng = 7;
    const r = () => { rng = (rng * 1103515245 + 12345) & 0x7fffffff; return rng / 0x7fffffff; };

    for (let i = 0; i < 20000; i++) {
      const difficulty = 1 + Math.floor(r() * 10);
      const unit = units[Math.floor(r() * units.length)];
      const lastLoad = 1 + r() * 800;
      const c = ctx({
        rank: RANKS[Math.floor(r() * RANKS.length)] as Rank,
        pattern: patterns[Math.floor(r() * patterns.length)],
        unit, difficulty,
        readiness: 0.7 + r() * 0.4,
        progression: 1 + r() * 0.5,
        recalibration: r() > 0.5 ? 1 : 0.85,
        weekIndex: Math.floor(r() * 30),
        lastWeek: { load: lastLoad, unit },
        reentry: r() > 0.8,
      });
      const target = scaleObjective(c);
      // +10% de carga, ou o passo mínimo da unidade quando 10% não chega a ele.
      const f = loadFactor(unit, difficulty);
      const allowed = Math.max(
        lastLoad * (1 + MAX_WEEKLY_INCREASE),
        (Math.floor(lastLoad / f) + MIN_WEEKLY_STEP[unit]) * f,
      );
      if (Math.floor(allowed / f) >= 1) {
        expect(target * f, JSON.stringify(c)).toBeLessThanOrEqual(allowed + 1e-9);
      }
    }
  });

  it('número pequeno não congela: 9 minutos viram 10, 6 repetições viram 7', () => {
    expect(weeklyCeiling({ load: 9, unit: 'minutes' }, 'minutes', 3)).toBe(10);
    expect(weeklyCeiling({ load: 6 * 3, unit: 'reps' }, 'reps', 3)).toBe(7);
    expect(weeklyCeiling({ load: 13, unit: 'seconds' }, 'seconds', 1)).toBe(15);
    // Número grande segue os 10%.
    expect(weeklyCeiling({ load: 40, unit: 'reps' }, 'reps', 1)).toBe(44);
  });

  it('referência da própria semana (primeira semana de uso) não deixa crescer', () => {
    expect(weeklyCeiling({ load: 9, unit: 'reps', growth: false }, 'reps', 1)).toBe(9);
    // Trocar para um degrau com o dobro da dificuldade divide o alvo.
    expect(weeklyCeiling({ load: 9, unit: 'reps', growth: false }, 'reps', 2)).toBe(4);
  });

  it('quem vem cumprindo vai ao teto; quem não vem, fica na base', () => {
    const lastWeek = { load: 20, unit: 'reps' as const };
    expect(scaleObjective(ctx({ rank: 'E', difficulty: 1, progression: 1.05, readiness: 1, lastWeek }))).toBe(22);
    expect(scaleObjective(ctx({ rank: 'E', difficulty: 1, progression: 1, readiness: 1, lastWeek }))).toBe(10);
  });

  it('minutos de aeróbico não se dividem pela dificuldade do degrau', () => {
    expect(loadFactor('minutes', 8)).toBe(1);
    expect(loadFactor('reps', 8)).toBe(8);
  });

  it('subir para um degrau mais difícil reduz as repetições permitidas', () => {
    const lastLoad = 24 * 5; // 24 flexões de joelhos (dificuldade 5)
    const knee = scaleObjective(ctx({ difficulty: 5, lastWeek: { load: lastLoad, unit: 'reps' } }));
    const full = scaleObjective(ctx({ difficulty: 7, lastWeek: { load: lastLoad, unit: 'reps' } }));
    expect(full).toBeLessThan(knee);
  });

  it('trocar de unidade não abre brecha: nunca passa da base do rank', () => {
    const t = scaleObjective(ctx({
      pattern: 'core_anti_ext', unit: 'reps', difficulty: 3, rank: 'D',
      progression: 1.5, readiness: 1.1, lastWeek: { load: 30 * 2, unit: 'seconds' },
    }));
    expect(t).toBeLessThanOrEqual(16); // base de repetições de core no Rank D
  });

  it('sem histórico, o alvo é a base do rank ajustada', () => {
    const t = scaleObjective(ctx({ rank: 'E', pattern: 'push_h', readiness: 1, progression: 1 }));
    expect(t).toBe(10);
  });

  it('reentrada pós-Dungeon Break corta pela metade', () => {
    const normal = scaleObjective(ctx({ readiness: 1, progression: 1 }));
    const reentry = scaleObjective(ctx({ readiness: 1, progression: 1, reentry: true }));
    expect(reentry).toBe(Math.round(normal / 2));
  });

  it('prancha usa segundos e dead bug usa repetições — tabelas diferentes', () => {
    const plank = scaleObjective(ctx({ rank: 'C', pattern: 'core_anti_ext', unit: 'seconds', readiness: 1, progression: 1 }));
    const bug = scaleObjective(ctx({ rank: 'C', pattern: 'core_anti_ext', unit: 'reps', readiness: 1, progression: 1 }));
    expect(plank).toBe(45);
    expect(bug).toBe(20);
  });
});

describe('Modo Prudência escolhe exercícios do Rank D de verdade (R2.5)', () => {
  const profile: UserProfile = {
    hunterName: 'T', age: 40, gender: 'female', weightKg: 70, heightCm: 165, waistCm: null,
    goal: 'health', daysPerWeek: 3, sessionMinutes: 20, preferredTime: '07:00', location: 'home',
    equipment: ['none', 'band', 'dumbbell', 'gym', 'pullup_bar'], limitations: [],
    units: { mass: 'kg', length: 'cm' }, locale: 'pt-BR', systemTone: 'cold',
  };
  const input = (rank: Rank, result: 'cleared' | 'caution'): QuestInput => ({
    profile,
    progression: {
      level: 30, xp: 0, rank, attributes: { STR: 50, AGI: 50, VIT: 50, PER: 50, INT: 50 },
      unspentPoints: 0, streakCurrent: 0, streakBest: 0, recoveryStones: 0,
    },
    screening: { date: '2026-09-01', answers: {}, result, restrictions: [], expiresAt: '2027-09-01' },
    history: [], painLog: [], catalog: EXERCISES, date: '2026-09-21', weekIndex: 1,
    lastWeek: {}, sleepHours: 7, soreness: 0, consecutiveFailures: 0, isTrainingDay: true,
  });

  it.each(['C', 'B', 'A', 'S'] as Rank[])('Rank %s sob prudência só recebe exercícios até o D', (rank) => {
    const q = generateDailyQuest(input(rank, 'caution'));
    expect(q.rank).toBe('D');
    for (const o of q.objectives) {
      const ex = exerciseById(o.exerciseId)!;
      expect(['E', 'D'], `${rank}: ${ex.id} é do Rank ${ex.minRank}`).toContain(ex.minRank);
    }
  });

  it('sem prudência, o rank real vale', () => {
    const q = generateDailyQuest(input('A', 'cleared'));
    expect(q.rank).toBe('A');
    expect(q.objectives.some((o) => exerciseById(o.exerciseId)!.minRank === 'A')).toBe(true);
  });
});

describe('degrau de entrada', () => {
  it('um usuário novo no Rank E começa pelo exercício mais acessível', () => {
    const profile = {
      equipment: ['none'] as UserProfile['equipment'], limitations: [] as UserProfile['limitations'],
    } as UserProfile;
    const q = generateDailyQuest({
      profile: { ...profile, hunterName: 'N', age: 30, gender: 'male', weightKg: 90, heightCm: 175,
        waistCm: null, goal: 'habit', daysPerWeek: 3, sessionMinutes: 10, preferredTime: '19:00',
        location: 'home', units: { mass: 'kg', length: 'cm' }, locale: 'pt-BR', systemTone: 'cold' },
      progression: {
        level: 1, xp: 0, rank: 'E', attributes: { STR: 0, AGI: 0, VIT: 0, PER: 0, INT: 0 },
        unspentPoints: 0, streakCurrent: 0, streakBest: 0, recoveryStones: 0,
      },
      screening: { date: '2026-09-01', answers: {}, result: 'cleared', restrictions: [], expiresAt: '2027-09-01' },
      history: [], painLog: [], catalog: EXERCISES, date: '2026-09-21', weekIndex: 0,
      lastWeek: {}, sleepHours: 7, soreness: 0, consecutiveFailures: 0, isTrainingDay: true,
    });
    const ids = q.objectives.map((o) => o.exerciseId);
    expect(ids).toContain('push_wall');
    expect(ids).toContain('squat_chair_assisted');
  });
});
