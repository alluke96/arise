import { normalizeEvents, type DomainEvent } from '../sync/events';
import { MAX_RECOVERY_STONES, MONTHLY_RECOVERY_STONES } from './penalty';

const DAY = 86400_000;
const toMs = (date: string) => Date.parse(`${date.slice(0, 10)}T00:00:00.000Z`);

export function addDays(date: string, n: number): string {
  return new Date(toMs(date) + n * DAY).toISOString().slice(0, 10);
}

/** b − a, em dias inteiros. */
export function daysBetween(a: string, b: string): number {
  return Math.round((toMs(b) - toMs(a)) / DAY);
}

/** 0 = domingo. */
export function weekday(date: string): number {
  return new Date(toMs(date)).getUTCDay();
}

/**
 * Dias da semana de treino a partir da frequência escolhida no onboarding.
 * Espalhados para sempre haver descanso entre sessões de força.
 */
export function trainingWeekdays(daysPerWeek: number): number[] {
  if (daysPerWeek <= 2) return [2, 5];        // ter, sex
  if (daysPerWeek === 3) return [1, 3, 5];    // seg, qua, sex
  if (daysPerWeek === 4) return [1, 2, 4, 5]; // seg, ter, qui, sex
  return [1, 2, 3, 4, 5];
}

/** Agenda: frequência (dias espalhados pelo padrão) ou os dias escolhidos. */
export type Schedule = number | readonly number[];

export function isTrainingDay(date: string, schedule: Schedule): boolean {
  const days = typeof schedule === 'number' ? trainingWeekdays(schedule) : schedule;
  return days.includes(weekday(date));
}

/**
 * Agenda em vigor em cada data, a partir dos eventos `schedule_changed`.
 *
 * Trocar os dias vale do dia da troca em diante; os dias anteriores seguem
 * julgados pela agenda antiga. Sem nenhum evento (perfis antigos), vale a
 * frequência do perfil.
 */
export function makeSchedule(events: DomainEvent[], fallbackDaysPerWeek: number): (date: string) => readonly number[] {
  const changes = normalizeEvents(events)
    .filter((e): e is DomainEvent & { kind: 'schedule_changed' } => e.kind === 'schedule_changed')
    .map((e) => ({ from: e.at.slice(0, 10), weekdays: e.weekdays }));
  const fallback = trainingWeekdays(fallbackDaysPerWeek);
  return (date) => {
    let current: readonly number[] = fallback;
    for (const c of changes) {
      if (c.from > date) break;
      current = c.weekdays;
    }
    return current;
  };
}

/**
 * Sugestão inicial: 3 dias espalhados COMEÇANDO HOJE (hoje, +2, +4). Quem
 * se cadastra num sábado não abre o app pela primeira vez num "descanse".
 */
export function suggestedWeekdays(today: string, count = 3): number[] {
  const start = weekday(today);
  return Array.from({ length: count }, (_, i) => (start + i * 2) % 7).sort((a, b) => a - b);
}

export const MIN_TRAINING_DAYS = 2;
export const MAX_TRAINING_DAYS = 5;

export function weekIndexOf(startedAt: string, today: string): number {
  return Math.max(0, Math.floor(daysBetween(startedAt, today) / 7));
}

/**
 * Ids determinísticos. Dois aparelhos que reconciliam o mesmo dia produzem o
 * mesmo id, e o servidor faz `on conflict do nothing` — nada duplica.
 */
export const eventId = {
  penaltyDone: (day: string) => `penalty_done:${day}`,
  penaltySkip: (day: string) => `penalty_skip:${day}`,
  stoneUse: (day: string) => `stone_use:${day}`,
  stoneGrant: (month: string) => `stone_grant:${month}`,
  inactivity: (firstMissedDay: string) => `inactive:${firstMissedDay}`,
  session: (day: string) => `session:${day}`,
};

const dayFromId = (id: string, prefix: string) =>
  id.startsWith(prefix) ? id.slice(prefix.length) : null;

/**
 * Dungeon Break quando se perdem DOIS dias de TREINO seguidos.
 *
 * A R9.1 fala em "3 dias consecutivos sem atividade". Lida como dias do
 * calendário, todo usuário de seg/qua/sex tomaria Dungeon Break em toda
 * segunda-feira — sábado e domingo são descanso previsto. O que importa para
 * o descondicionamento é treino que deveria ter acontecido e não aconteceu.
 */
export const DUNGEON_BREAK_MISSED_TRAINING_DAYS = 2;

export interface ReconcileInput {
  events: DomainEvent[];
  today: string;
  daysPerWeek: number;
  startedAt: string;
  deviceId: string;
}

export interface Reconciliation {
  /** Eventos que faltam no log e devem ser anexados. */
  toAppend: DomainEvent[];
  /** Dia perdido cuja Zona de Penalidade está aberta hoje. */
  penaltyOpenFor: string | null;
  /** Um Dungeon Break foi detectado nesta reconciliação. */
  dungeonBreak: boolean;
  missedDays: string[];
}

/**
 * Reconcilia o calendário com o log: concede as pedras do mês, fecha as Zonas
 * de Penalidade cujo prazo passou e detecta Dungeon Break.
 *
 * Pura e idempotente: rodar duas vezes, ou em dois aparelhos, produz os
 * mesmos eventos com os mesmos ids.
 */
export function reconcile(input: ReconcileInput): Reconciliation {
  const { today, daysPerWeek, startedAt, deviceId } = input;
  const events = normalizeEvents(input.events);
  const known = new Set(events.map((e) => e.id));
  const toAppend: DomainEvent[] = [];
  const add = (e: DomainEvent) => {
    if (known.has(e.id)) return;
    known.add(e.id);
    toAppend.push(e);
  };

  // 1. Pedras do mês.
  for (let m = startedAt.slice(0, 7); m <= today.slice(0, 7); m = nextMonth(m)) {
    const monthStart = `${m}-01`;
    const at = monthStart > startedAt ? monthStart : startedAt;
    add({
      id: eventId.stoneGrant(m), at: `${at}T00:00:00.000Z`, deviceId,
      kind: 'stone_granted', amount: MONTHLY_RECOVERY_STONES,
    });
  }

  // 2. O que já resolve cada dia.
  const all = normalizeEvents([...events, ...toAppend]);
  const scheduleOn = makeSchedule(all, daysPerWeek);
  const completed = new Set<string>();
  const penaltyDone = new Set<string>();
  const stoneUsed = new Set<string>();
  const injuries: [string, string | null][] = [];
  let balance = 0;

  for (const e of all) {
    const day = e.at.slice(0, 10);
    switch (e.kind) {
      case 'session_completed': completed.add(e.session.date ?? day); break;
      case 'penalty_completed': {
        const d = dayFromId(e.id, 'penalty_done:');
        if (d) penaltyDone.add(d);
        break;
      }
      case 'stone_granted': balance = Math.min(MAX_RECOVERY_STONES, balance + e.amount); break;
      case 'stone_used': {
        // Só vale se havia pedra no momento: sem isso, tocar o botão com zero
        // pedras protegeria a sequência de graça.
        if (balance > 0) {
          balance -= 1;
          const d = dayFromId(e.id, 'stone_use:');
          if (d) stoneUsed.add(d);
        }
        break;
      }
      case 'injury_declared': injuries.push([day, null]); break;
      case 'injury_cleared': {
        const open = injuries.find((i) => i[1] === null);
        if (open) open[1] = day;
        break;
      }
      default: break;
    }
  }
  const injured = (d: string) => injuries.some(([from, to]) => d >= from && (to === null || d < to));

  // 3. Caminha pelos dias de treino passados.
  const yesterday = addDays(today, -1);
  let penaltyOpenFor: string | null = null;
  let dungeonBreak = false;
  let lastActive = startedAt;
  let run: string[] = [];
  const missedDays: string[] = [];

  // O próprio dia do cadastro não gera penalidade: quem se cadastra às 23h
  // não deveria abrir o app no dia seguinte já em dívida.
  for (let d = addDays(startedAt, 1); d <= yesterday; d = addDays(d, 1)) {
    if (!isTrainingDay(d, scheduleOn(d)) && !completed.has(d)) continue;

    if (completed.has(d) || penaltyDone.has(d)) {
      run = [];
      lastActive = d;
      continue;
    }
    if (stoneUsed.has(d) || injured(d)) continue;

    missedDays.push(d);
    run.push(d);

    if (d === yesterday) {
      penaltyOpenFor = d;
    } else {
      add({
        id: eventId.penaltySkip(d), at: `${addDays(d, 1)}T23:59:59.000Z`, deviceId,
        kind: 'penalty_skipped',
      });
    }

    if (run.length === DUNGEON_BREAK_MISSED_TRAINING_DAYS) {
      const id = eventId.inactivity(run[0]);
      if (!known.has(id)) dungeonBreak = true;
      add({
        id, at: `${d}T23:59:59.500Z`, deviceId,
        kind: 'inactivity_detected', days: daysBetween(lastActive, d),
      });
    }
    // O Dungeon Break substitui a Zona de Penalidade: a sequência já zerou.
    if (run.length >= DUNGEON_BREAK_MISSED_TRAINING_DAYS && d === yesterday) {
      penaltyOpenFor = null;
    }
  }

  return { toAppend, penaltyOpenFor, dungeonBreak, missedDays };
}

function nextMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
}
