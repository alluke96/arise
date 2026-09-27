import { describe, expect, it } from 'vitest';
import { ADVANCE_AFTER, eligibleRungs, foldLadder, neighborRung } from '../ladder';
import { EXERCISES } from '../../../data/exercises';
import type { DomainEvent } from '../../sync/events';
import type { ObjectiveResult, UserProfile } from '../../types';

const profile: Pick<UserProfile, 'equipment' | 'limitations'> = {
  equipment: ['none'], limitations: [],
};

let n = 0;
const at = (d: number) => `2026-09-${String(d).padStart(2, '0')}T12:00:00.000Z`;
const session = (day: number, results: ObjectiveResult[]): DomainEvent => ({
  id: `s${++n}`, at: at(day), deviceId: 'd', kind: 'session_completed',
  session: {
    date: at(day).slice(0, 10), durationMin: 15, avgRpe: 5, completion: 'complete',
    resistedVolume: 100, aerobicMinutes: 10, formOkRatio: 1, results,
  },
});
const good = (id: string): ObjectiveResult => ({ exerciseId: id, value: 10, completed: true, formOk: true });
const bad = (id: string): ObjectiveResult => ({ exerciseId: id, value: 4, completed: false, formOk: true });
const place = (day: number, rank: 'D' | 'C'): DomainEvent =>
  ({ id: `p${++n}`, at: at(day), deviceId: 'd', kind: 'benchmark_passed', rankAfter: rank });

describe('escada de progressão', () => {
  it('um usuário novo começa no primeiro degrau', () => {
    expect(foldLadder([], EXERCISES, profile).push_h?.exerciseId).toBe('push_wall');
  });

  it('duas sessões boas seguidas avançam um degrau', () => {
    const l = foldLadder([session(1, [good('push_wall')]), session(3, [good('push_wall')])], EXERCISES, profile);
    expect(ADVANCE_AFTER).toBe(2);
    expect(l.push_h?.exerciseId).toBe('push_bench');
  });

  it('uma sessão ruim no meio zera a contagem', () => {
    const l = foldLadder([
      session(1, [good('push_wall')]), session(3, [bad('push_wall')]), session(5, [good('push_wall')]),
    ], EXERCISES, profile);
    expect(l.push_h?.exerciseId).toBe('push_wall');
    expect(l.push_h?.streak).toBe(1);
  });

  it('boa forma é obrigatória: completar sem forma não conta', () => {
    const sloppy: ObjectiveResult = { exerciseId: 'push_wall', value: 15, completed: true, formOk: false };
    const l = foldLadder([session(1, [sloppy]), session(3, [sloppy])], EXERCISES, profile);
    expect(l.push_h?.exerciseId).toBe('push_wall');
  });

  it('o rank limita o topo: Rank E não passa dos degraus do E', () => {
    const events: DomainEvent[] = [];
    let id = 'push_wall';
    for (let d = 1; d <= 28; d += 2) {
      events.push(session(d, [good(id)]));
      id = foldLadder(events, EXERCISES, profile).push_h!.exerciseId;
    }
    const pos = foldLadder(events, EXERCISES, profile).push_h!;
    expect(EXERCISES.find((e) => e.id === pos.exerciseId)!.minRank).toBe('E');
    expect(pos.canGoHarder).toBe(false);
  });

  it('subir de rank libera o próximo degrau', () => {
    const l = foldLadder([place(1, 'D')], EXERCISES, profile);
    expect(l.push_h?.exerciseId).toBe('push_step');
  });

  it('padrão já tocado não pula quando o rank sobe — o usuário segue de onde está', () => {
    const l = foldLadder([session(1, [good('push_wall')]), place(2, 'D')], EXERCISES, profile);
    expect(l.push_h?.exerciseId).toBe('push_wall');
    expect(l.push_h?.canGoHarder).toBe(true);
  });

  /** R5.8 — "Muito difícil" regride na hora. */
  it('ajuste "mais fácil" regride e zera a contagem', () => {
    const l = foldLadder([
      place(1, 'D'),
      { id: 'a1', at: at(2), deviceId: 'd', kind: 'exercise_adjusted', pattern: 'push_h',
        direction: 'easier', fromId: 'push_step', toId: 'push_sofa' },
    ], EXERCISES, profile);
    expect(l.push_h?.exerciseId).toBe('push_sofa');
    expect(l.push_h?.streak).toBe(0);
  });

  it('ajuste "mais difícil" não passa do teto do rank', () => {
    const l = foldLadder([
      { id: 'a1', at: at(2), deviceId: 'd', kind: 'exercise_adjusted', pattern: 'push_h',
        direction: 'harder', fromId: 'push_wall', toId: 'push_full' },
    ], EXERCISES, profile);
    expect(EXERCISES.find((e) => e.id === l.push_h!.exerciseId)!.minRank).toBe('E');
  });

  it('a mesma lista de eventos em qualquer ordem dá o mesmo degrau', () => {
    const events = [
      session(1, [good('push_wall')]), session(3, [good('push_wall')]),
      place(4, 'D'), session(5, [good('push_bench')]),
    ];
    const ref = foldLadder(events, EXERCISES, profile);
    expect(foldLadder([...events].reverse(), EXERCISES, profile)).toEqual(ref);
  });

  it('limitação declarada tira o exercício da escada', () => {
    const rungs = eligibleRungs(EXERCISES, 'push_h', { equipment: ['none'], limitations: ['wrist'] });
    expect(rungs).toHaveLength(0);
    expect(foldLadder([], EXERCISES, { equipment: ['none'], limitations: ['wrist'] }).push_h).toBeUndefined();
  });
});

describe('degrau vizinho (botões da sessão)', () => {
  it('mais fácil devolve a regressão', () => {
    expect(neighborRung(EXERCISES, 'push_knee', 'easier', profile, 'D')?.id).toBe('push_step');
  });
  it('no primeiro degrau não há mais fácil', () => {
    expect(neighborRung(EXERCISES, 'push_wall', 'easier', profile, 'E')).toBeNull();
  });
  it('mais difícil respeita o rank', () => {
    expect(neighborRung(EXERCISES, 'push_negative', 'harder', profile, 'D')).toBeNull();
    expect(neighborRung(EXERCISES, 'push_negative', 'harder', profile, 'C')?.id).toBe('push_full');
  });
});
