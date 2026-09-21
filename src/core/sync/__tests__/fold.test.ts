import { describe, expect, it } from 'vitest';
import { foldProgression } from '../fold';
import { dedupeEvents, normalizeEvents, sortEvents } from '../events';
import type { DomainEvent } from '../events';
import type { SessionSummary } from '../../types';

let seq = 0;
const uid = () => `evt-${String(++seq).padStart(4, '0')}`;

const session = (over: Partial<SessionSummary> = {}): SessionSummary => ({
  date: '2026-09-01', durationMin: 20, avgRpe: 5, completion: 'complete',
  resistedVolume: 400, aerobicMinutes: 20, formOkRatio: 0.9, ...over,
});

const ev = {
  session: (at: string, over: Partial<SessionSummary> = {}): DomainEvent =>
    ({ id: uid(), at, deviceId: 'a', kind: 'session_completed', session: session({ date: at.slice(0, 10), ...over }) }),
  penaltyDone: (at: string): DomainEvent => ({ id: uid(), at, deviceId: 'a', kind: 'penalty_completed' }),
  penaltySkip: (at: string): DomainEvent => ({ id: uid(), at, deviceId: 'a', kind: 'penalty_skipped' }),
  stoneGrant: (at: string, amount = 2): DomainEvent => ({ id: uid(), at, deviceId: 'a', kind: 'stone_granted', amount }),
  stoneUse: (at: string): DomainEvent => ({ id: uid(), at, deviceId: 'a', kind: 'stone_used' }),
  rank: (at: string, rankAfter: 'D' | 'C' | 'B'): DomainEvent =>
    ({ id: uid(), at, deviceId: 'a', kind: 'benchmark_passed', rankAfter }),
  spend: (at: string, amount: number): DomainEvent =>
    ({ id: uid(), at, deviceId: 'a', kind: 'points_spent', attribute: 'STR', amount }),
};

function shuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const HISTORY: DomainEvent[] = [
  ev.stoneGrant('2026-08-01T00:00:00Z'),
  ev.session('2026-08-02T19:00:00Z'),
  ev.session('2026-08-04T19:00:00Z', { completion: 'complete_good_form' }),
  ev.penaltySkip('2026-08-06T23:59:00Z'),
  ev.session('2026-08-07T19:00:00Z'),
  ev.stoneUse('2026-08-08T10:00:00Z'),
  ev.rank('2026-08-10T12:00:00Z', 'D'),
  ev.session('2026-08-11T19:00:00Z'),
  ev.penaltyDone('2026-08-13T08:00:00Z'),
  ev.session('2026-08-14T19:00:00Z', { resistedVolume: 520 }),
];

describe('foldProgression — convergência (B2.4)', () => {
  it('qualquer ordem de chegada produz o mesmo estado', () => {
    const reference = foldProgression(HISTORY);
    for (let seed = 1; seed <= 200; seed++) {
      expect(foldProgression(shuffle(HISTORY, seed))).toEqual(reference);
    }
  });

  it('eventos duplicados não alteram o resultado (B2.5)', () => {
    const reference = foldProgression(HISTORY);
    const withDupes = [...HISTORY, ...HISTORY, ...shuffle(HISTORY, 7)];
    expect(foldProgression(withDupes)).toEqual(reference);
  });

  it('dois aparelhos com os mesmos eventos convergem', () => {
    const deviceA = shuffle(HISTORY, 42);
    const deviceB = shuffle(HISTORY, 99);
    expect(foldProgression(deviceA)).toEqual(foldProgression(deviceB));
  });

  it('log vazio devolve o estado inicial', () => {
    const p = foldProgression([]);
    expect(p.level).toBe(1);
    expect(p.xp).toBe(0);
    expect(p.rank).toBe('E');
    expect(p.streakCurrent).toBe(0);
  });
});

describe('foldProgression — semântica', () => {
  it('XP acumula e o nível sobe', () => {
    const p = foldProgression(HISTORY);
    expect(p.xp).toBeGreaterThan(0);
    expect(p.level).toBeGreaterThan(1);
  });

  it('o rank vem do último benchmark aprovado', () => {
    expect(foldProgression(HISTORY).rank).toBe('D');
    expect(foldProgression([...HISTORY, ev.rank('2026-09-01T12:00:00Z', 'C')]).rank).toBe('C');
  });

  it('penalidade perdida zera a sequência mas não o nível', () => {
    const before = foldProgression(HISTORY.slice(0, 3));
    const after = foldProgression(HISTORY.slice(0, 4));
    expect(after.streakCurrent).toBe(0);
    expect(after.level).toBe(before.level);
    expect(after.xp).toBe(before.xp);
  });

  it('pedras concedidas e usadas se compensam', () => {
    const p = foldProgression(HISTORY);
    expect(p.recoveryStones).toBe(1); // 2 concedidas, 1 usada
  });

  it('não gasta ponto que não existe', () => {
    const p = foldProgression([ev.spend('2026-08-01T00:00:00Z', 999)]);
    expect(p.unspentPoints).toBe(0);
    expect(p.attributes.STR).toBe(0);
  });

  it('ponto distribuído soma sobre o atributo derivado', () => {
    const base = foldProgression(HISTORY);
    const spent = foldProgression([...HISTORY, ev.spend('2026-09-01T00:00:00Z', 2)]);
    expect(spent.attributes.STR).toBe(base.attributes.STR + 2);
    expect(spent.unspentPoints).toBe(base.unspentPoints - 2);
  });
});

describe('ordenação de eventos', () => {
  it('desempata pelo id quando o instante coincide', () => {
    const at = '2026-08-01T00:00:00Z';
    const a: DomainEvent = { id: 'zzz', at, deviceId: 'x', kind: 'penalty_completed' };
    const b: DomainEvent = { id: 'aaa', at, deviceId: 'y', kind: 'penalty_completed' };
    expect(sortEvents([a, b]).map((e) => e.id)).toEqual(['aaa', 'zzz']);
    expect(sortEvents([b, a]).map((e) => e.id)).toEqual(['aaa', 'zzz']);
  });

  it('dedupe mantém a primeira ocorrência', () => {
    const e: DomainEvent = { id: 'dup', at: '2026-08-01T00:00:00Z', deviceId: 'x', kind: 'penalty_completed' };
    expect(dedupeEvents([e, e, e])).toHaveLength(1);
  });

  it('normalize é idempotente', () => {
    const once = normalizeEvents(HISTORY);
    expect(normalizeEvents(once)).toEqual(once);
  });
});
