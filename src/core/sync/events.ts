import type { Attribute, Pattern, Rank, SessionSummary } from '../types';

/**
 * Eventos do domínio — fatos imutáveis e datados.
 *
 * O `id` é gerado no CLIENTE (UUID). É o que torna o reenvio de um lote
 * idempotente: o servidor faz `on conflict do nothing` e o fold deduplica.
 *
 * Tudo que altera progressão é um evento. A progressão em si não é
 * armazenada nem sincronizada — ela é o fold disto. Ver
 * `.kiro/specs/arise-backend/design.md` §1.
 */
export interface EventBase {
  id: string;
  /** Quando o fato ocorreu, ISO-8601. Não é quando chegou ao servidor. */
  at: string;
  deviceId: string;
}

export type DomainEvent =
  | (EventBase & { kind: 'session_completed'; session: SessionSummary })
  | (EventBase & { kind: 'penalty_completed' })
  | (EventBase & { kind: 'penalty_skipped' })
  | (EventBase & { kind: 'stone_granted'; amount: number })
  | (EventBase & { kind: 'stone_used' })
  | (EventBase & { kind: 'injury_declared' })
  | (EventBase & { kind: 'injury_cleared' })
  | (EventBase & { kind: 'benchmark_passed'; rankAfter: Rank })
  | (EventBase & { kind: 'shadow_unlocked'; shadowId: string })
  | (EventBase & { kind: 'points_spent'; attribute: Attribute; amount: number })
  | (EventBase & { kind: 'pain_logged'; pattern: Pattern; painKind: 'joint' | 'muscle' });

export type EventKind = DomainEvent['kind'];

/** Tabela do Postgres que guarda cada tipo de evento. */
export const EVENT_TABLE: Record<EventKind, string> = {
  session_completed: 'sessions',
  penalty_completed: 'penalty_events',
  penalty_skipped: 'penalty_events',
  stone_granted: 'stone_events',
  stone_used: 'stone_events',
  injury_declared: 'injury_events',
  injury_cleared: 'injury_events',
  benchmark_passed: 'benchmarks',
  shadow_unlocked: 'shadow_unlocks',
  points_spent: 'point_allocations',
  pain_logged: 'pain_log',
};

/**
 * Ordem total e determinística.
 *
 * Desempate por `id` quando o instante coincide: sem isso, dois aparelhos com
 * eventos no mesmo milissegundo poderiam foldar em ordens diferentes e chegar
 * a estados diferentes — exatamente o que o modelo existe para evitar (B2.4).
 */
export function sortEvents(events: DomainEvent[]): DomainEvent[] {
  return [...events].sort((a, b) =>
    a.at === b.at ? (a.id < b.id ? -1 : a.id > b.id ? 1 : 0) : a.at < b.at ? -1 : 1);
}

/** Primeira ocorrência de cada id vence. Reenvio vira no-op (B2.5). */
export function dedupeEvents(events: DomainEvent[]): DomainEvent[] {
  const seen = new Set<string>();
  const out: DomainEvent[] = [];
  for (const e of events) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    out.push(e);
  }
  return out;
}

export function normalizeEvents(events: DomainEvent[]): DomainEvent[] {
  return sortEvents(dedupeEvents(events));
}
