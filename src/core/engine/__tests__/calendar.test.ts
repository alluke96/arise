import { describe, expect, it } from 'vitest';
import {
  addDays, daysBetween, eventId, isTrainingDay, makeSchedule, reconcile, suggestedWeekdays, trainingWeekdays, weekIndexOf,
} from '../calendar';
import { foldAll } from '../../sync/fold';
import type { DomainEvent } from '../../sync/events';

// 2026-09-13 é domingo. Treino seg/qua/sex: 14, 16, 18, 21, 23, 25.
const START = '2026-09-13';

const session = (day: string): DomainEvent => ({
  id: eventId.session(day), at: `${day}T12:00:00.000Z`, deviceId: 'd', kind: 'session_completed',
  session: {
    date: day, durationMin: 15, avgRpe: 5, completion: 'complete',
    resistedVolume: 200, aerobicMinutes: 10, formOkRatio: 1,
  },
});

const run = (events: DomainEvent[], today: string, daysPerWeek = 3) =>
  reconcile({ events, today, daysPerWeek, startedAt: START, deviceId: 'd' });

const kinds = (r: ReturnType<typeof run>) => r.toAppend.map((e) => e.id).filter((id) => !id.startsWith('stone_grant'));

describe('agenda', () => {
  it('3×/semana cai em seg, qua, sex', () => {
    expect(trainingWeekdays(3)).toEqual([1, 3, 5]);
    expect(isTrainingDay('2026-09-14', 3)).toBe(true);
    expect(isTrainingDay('2026-09-15', 3)).toBe(false);
  });

  it('sempre há descanso entre sessões com 2 a 4 dias por semana', () => {
    for (const n of [2, 3, 4]) {
      const days = trainingWeekdays(n);
      expect(days).toHaveLength(n);
      expect(days.includes(0) || days.includes(6)).toBe(false);
    }
  });

  it('aritmética de datas', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(daysBetween('2026-09-13', '2026-09-21')).toBe(8);
    expect(weekIndexOf('2026-09-13', '2026-09-27')).toBe(2);
  });
});

describe('reconciliação', () => {
  it('quem cumpriu tudo não recebe nada além das pedras do mês', () => {
    const r = run([session('2026-09-14'), session('2026-09-16'), session('2026-09-18')], '2026-09-21');
    expect(kinds(r)).toEqual([]);
    expect(r.penaltyOpenFor).toBeNull();
    expect(r.dungeonBreak).toBe(false);
  });

  /**
   * O caso que a leitura literal da R9.1 quebraria: sábado e domingo são
   * descanso previsto. Perder só a segunda abre penalidade — não Dungeon Break.
   */
  it('fim de semana não conta como inatividade', () => {
    const r = run([session('2026-09-14'), session('2026-09-16'), session('2026-09-18')], '2026-09-22');
    expect(r.penaltyOpenFor).toBe('2026-09-21');
    expect(r.dungeonBreak).toBe(false);
  });

  it('perder ontem abre a Zona de Penalidade hoje', () => {
    const r = run([session('2026-09-14'), session('2026-09-16')], '2026-09-19');
    expect(r.penaltyOpenFor).toBe('2026-09-18');
    expect(kinds(r)).toEqual([]);
  });

  it('se o prazo da penalidade passou, ela fecha como perdida', () => {
    const r = run([session('2026-09-14'), session('2026-09-16')], '2026-09-21');
    expect(kinds(r)).toEqual([eventId.penaltySkip('2026-09-18')]);
    expect(r.penaltyOpenFor).toBeNull();
  });

  it('cumprir a penalidade resolve o dia', () => {
    const done: DomainEvent = {
      id: eventId.penaltyDone('2026-09-18'), at: '2026-09-19T10:00:00.000Z',
      deviceId: 'd', kind: 'penalty_completed',
    };
    const r = run([session('2026-09-14'), session('2026-09-16'), done], '2026-09-21');
    expect(kinds(r)).toEqual([]);
  });

  it('dois dias de treino perdidos seguidos disparam o Dungeon Break', () => {
    const r = run([], '2026-09-17');
    expect(r.dungeonBreak).toBe(true);
    expect(kinds(r)).toContain(eventId.inactivity('2026-09-14'));
    // Substitui a penalidade: a sequência já zerou.
    expect(r.penaltyOpenFor).toBeNull();
  });

  it('o dia do cadastro não gera dívida', () => {
    const r = reconcile({ events: [], today: '2026-09-15', daysPerWeek: 3, startedAt: '2026-09-14', deviceId: 'd' });
    expect(r.missedDays).toEqual([]);
  });

  it('é idempotente: reconciliar de novo não produz nada', () => {
    const events: DomainEvent[] = [session('2026-09-14')];
    const first = run(events, '2026-09-24');
    const second = run([...events, ...first.toAppend], '2026-09-24');
    expect(second.toAppend).toEqual([]);
  });

  it('dois aparelhos produzem os mesmos ids', () => {
    const a = reconcile({ events: [], today: '2026-09-24', daysPerWeek: 3, startedAt: START, deviceId: 'A' });
    const b = reconcile({ events: [], today: '2026-09-24', daysPerWeek: 3, startedAt: START, deviceId: 'B' });
    expect(a.toAppend.map((e) => e.id)).toEqual(b.toAppend.map((e) => e.id));
  });

  it('só avisa Dungeon Break na primeira vez', () => {
    const first = run([], '2026-09-17');
    const again = run(first.toAppend, '2026-09-18');
    expect(again.dungeonBreak).toBe(false);
  });
});

describe('pedras de recuperação', () => {
  it('concede as pedras de cada mês desde o cadastro', () => {
    const r = reconcile({ events: [], today: '2026-10-02', daysPerWeek: 3, startedAt: '2026-08-20', deviceId: 'd' });
    const grants = r.toAppend.filter((e) => e.kind === 'stone_granted').map((e) => e.id);
    expect(grants).toEqual(['stone_grant:2026-08', 'stone_grant:2026-09', 'stone_grant:2026-10']);
  });

  it('pedra usada protege o dia', () => {
    const use: DomainEvent = {
      id: eventId.stoneUse('2026-09-18'), at: '2026-09-19T08:00:00.000Z', deviceId: 'd', kind: 'stone_used',
    };
    const r = run([session('2026-09-14'), session('2026-09-16'), use], '2026-09-21');
    expect(kinds(r)).toEqual([]);
  });

  it('usar pedra sem saldo não protege nada', () => {
    const uses: DomainEvent[] = ['2026-09-14', '2026-09-16', '2026-09-18'].map((d) => ({
      id: eventId.stoneUse(d), at: `${addDays(d, 1)}T08:00:00.000Z`, deviceId: 'd', kind: 'stone_used' as const,
    }));
    const r = run(uses, '2026-09-21');
    // 2 pedras no mês: a terceira não vale, então sexta fica perdida.
    expect(r.missedDays).toEqual(['2026-09-18']);
  });

  it('o saldo tem teto: não acumula ano após ano', () => {
    const r = reconcile({ events: [], today: '2026-12-01', daysPerWeek: 3, startedAt: '2026-01-01', deviceId: 'd' });
    const withSessions = [...r.toAppend];
    expect(foldAll(withSessions).progression.recoveryStones).toBe(2);
  });
});

describe('lesão', () => {
  it('dias lesionado não geram penalidade nem Dungeon Break', () => {
    const inj: DomainEvent = { id: 'inj', at: '2026-09-14T08:00:00.000Z', deviceId: 'd', kind: 'injury_declared' };
    const r = run([inj], '2026-09-24');
    expect(r.missedDays).toEqual([]);
    expect(r.dungeonBreak).toBe(false);
  });

  it('depois da alta a contagem volta', () => {
    const events: DomainEvent[] = [
      { id: 'inj', at: '2026-09-14T08:00:00.000Z', deviceId: 'd', kind: 'injury_declared' },
      { id: 'ok', at: '2026-09-20T08:00:00.000Z', deviceId: 'd', kind: 'injury_cleared' },
    ];
    expect(run(events, '2026-09-22').penaltyOpenFor).toBe('2026-09-21');
  });
});

describe('integração com o fold', () => {
  it('penalidade perdida zera a sequência, nunca o nível', () => {
    const events = [session('2026-09-14'), session('2026-09-16')];
    const before = foldAll(events).progression;
    const r = run(events, '2026-09-21');
    const after = foldAll([...events, ...r.toAppend]).progression;
    expect(after.streakCurrent).toBe(0);
    expect(after.level).toBe(before.level);
    expect(after.xp).toBe(before.xp);
  });

  it('Dungeon Break ativa a reentrada de 3 sessões a 50%', () => {
    const events = [session('2026-09-14')];
    const r = run(events, '2026-09-22');
    const { streak } = foldAll([...events, ...r.toAppend]);
    expect(streak.reentrySessionsLeft).toBe(3);
  });
});

describe('dias de treino escolhidos', () => {
  const schedule = (id: string, day: string, weekdays: number[]): DomainEvent => ({
    id, at: `${day}T12:00:00.000Z`, deviceId: 'd', kind: 'schedule_changed', weekdays,
  });

  it('a sugestão começa hoje: quem se cadastra num sábado treina no primeiro dia', () => {
    const sat = '2026-10-10';
    expect(new Date(`${sat}T00:00:00Z`).getUTCDay()).toBe(6);
    const days = suggestedWeekdays(sat);
    expect(days).toContain(6);
    expect(days).toHaveLength(3);
    expect(isTrainingDay(sat, days)).toBe(true);
  });

  it('a agenda escolhida decide o dia, e não a frequência padrão', () => {
    const at = makeSchedule([schedule('schedule:start', START, [0, 2, 4])], 3);
    expect(at('2026-09-13')).toEqual([0, 2, 4]); // domingo passa a ser treino
    expect(isTrainingDay('2026-09-14', at('2026-09-14'))).toBe(false); // segunda não
  });

  it('trocar os dias NÃO cria penalidade retroativa', () => {
    // Começou com ter/qui/sáb e treinou certinho por duas semanas…
    const history = [
      schedule('schedule:start', START, [2, 4, 6]),
      session('2026-09-15'), session('2026-09-17'), session('2026-09-19'),
      session('2026-09-22'), session('2026-09-24'), session('2026-09-26'),
    ];
    // …e no domingo 27 trocou para seg/qua/sex (o perfil passa a dizer 3/semana).
    const events = [...history, schedule('schedule:x', '2026-09-27', [1, 3, 5])];
    const r = run(events, '2026-09-28');
    // As segundas/quartas/sextas antigas eram descanso: nada de penalidade.
    expect(kinds(r)).toEqual([]);
    expect(r.penaltyOpenFor).toBeNull();
    expect(r.missedDays).toEqual([]);
  });

  it('a agenda nova vale do dia da troca em diante', () => {
    const events = [session('2026-09-14'), schedule('schedule:x', '2026-09-15', [2, 4, 6])];
    // Quarta 16 deixou de ser treino; terça 15 (dia da troca) já é. Hoje é quinta 17.
    const r = run(events, '2026-09-17');
    expect(r.missedDays).toEqual(['2026-09-15']);
    expect(r.penaltyOpenFor).toBeNull();
    expect(kinds(r)).toEqual([eventId.penaltySkip('2026-09-15')]);
  });

  it('sem nenhum evento de agenda (perfis antigos), vale a frequência do perfil', () => {
    expect(makeSchedule([], 3)('2026-09-14')).toEqual(trainingWeekdays(3));
  });
});
