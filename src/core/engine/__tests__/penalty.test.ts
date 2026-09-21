import { describe, expect, it } from 'vitest';
import {
  DUNGEON_BREAK_AFTER_DAYS, PENALTY_DURATION_SECONDS, REENTRY_VOLUME_FACTOR,
  reentryFactor, streakTransition, type StreakSnapshot,
} from '../penalty';

const snap = (over: Partial<StreakSnapshot> = {}): StreakSnapshot => ({
  state: 'active', streakCurrent: 23, streakBest: 30,
  recoveryStones: 2, reentrySessionsLeft: 0, ...over,
});

describe('Zona de Penalidade — R8', () => {
  it('dura exatamente 4 minutos', () => {
    expect(PENALTY_DURATION_SECONDS).toBe(240);
  });

  it('prazo perdido abre a penalidade sem zerar a sequência', () => {
    const out = streakTransition(snap(), { type: 'deadline_missed' });
    expect(out.state).toBe('penalty');
    expect(out.streakCurrent).toBe(23);
  });

  it('concluir a penalidade restaura a sequência', () => {
    const out = streakTransition(snap({ state: 'penalty' }), { type: 'penalty_completed' });
    expect(out.state).toBe('active');
    expect(out.streakCurrent).toBe(23);
  });

  it('não concluir zera apenas a sequência', () => {
    const out = streakTransition(snap({ state: 'penalty' }), { type: 'penalty_skipped' });
    expect(out.streakCurrent).toBe(0);
    expect(out.streakBest).toBe(30);
  });

  it('lesão pausa sem gastar pedra — R8.9', () => {
    const out = streakTransition(snap(), { type: 'injury_declared' });
    expect(out.state).toBe('injured');
    expect(out.recoveryStones).toBe(2);
    expect(out.streakCurrent).toBe(23);
  });

  it('pedra congela e desconta uma', () => {
    const out = streakTransition(snap(), { type: 'stone_used' });
    expect(out.state).toBe('frozen');
    expect(out.recoveryStones).toBe(1);
  });

  it('sem pedras, nada acontece', () => {
    const out = streakTransition(snap({ recoveryStones: 0 }), { type: 'stone_used' });
    expect(out).toEqual(snap({ recoveryStones: 0 }));
  });

  it('estado congelado protege do prazo perdido', () => {
    const s = snap({ state: 'frozen' });
    expect(streakTransition(s, { type: 'deadline_missed' })).toEqual(s);
  });
});

describe('Dungeon Break — R9', () => {
  it('dispara com 3 dias parado', () => {
    const out = streakTransition(snap(), { type: 'days_inactive', days: DUNGEON_BREAK_AFTER_DAYS });
    expect(out.state).toBe('dungeon_break');
    expect(out.reentrySessionsLeft).toBe(3);
  });

  it('não dispara com 2 dias', () => {
    expect(streakTransition(snap(), { type: 'days_inactive', days: 2 }).state).toBe('active');
  });

  it('reentrada corta o volume pela metade', () => {
    expect(reentryFactor(snap({ reentrySessionsLeft: 3 }))).toBe(REENTRY_VOLUME_FACTOR);
    expect(reentryFactor(snap({ reentrySessionsLeft: 0 }))).toBe(1);
  });

  it('três sessões encerram a reentrada', () => {
    let s = snap({ state: 'dungeon_break', reentrySessionsLeft: 3, streakCurrent: 0 });
    for (let i = 0; i < 3; i++) s = streakTransition(s, { type: 'quest_completed' });
    expect(s.reentrySessionsLeft).toBe(0);
    expect(s.state).toBe('active');
    expect(s.streakCurrent).toBe(3);
  });
});

/**
 * R8.5 — a garantia mais importante do app: nenhuma falha apaga progresso.
 * É estrutural: StreakSnapshot não carrega nível, rank nem atributos, então
 * a função não teria como tocá-los.
 */
describe('R8.5 — nada além da sequência é afetado', () => {
  it('nenhum evento altera streakBest para baixo', () => {
    const events = [
      { type: 'deadline_missed' }, { type: 'penalty_skipped' },
      { type: 'days_inactive', days: 10 }, { type: 'injury_declared' },
    ] as const;
    let s = snap();
    for (const e of events) {
      s = streakTransition(s, e);
      expect(s.streakBest).toBe(30);
    }
  });
});
