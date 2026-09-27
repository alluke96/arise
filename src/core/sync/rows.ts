import { EVENT_TABLE, type DomainEvent } from './events';

/**
 * Evento → linha do Postgres.
 *
 * Puro: quem envia (adaptador Supabase) só faz `insert ... on conflict
 * (user_id, id) do nothing` com o que sai daqui. O teste de contrato compara
 * as colunas geradas com as migrations — se alguém mudar uma sem a outra, o
 * teste quebra antes do envio falhar em produção.
 */
export interface EventRow {
  table: string;
  row: Record<string, unknown>;
}

export function eventToRow(e: DomainEvent, userId: string): EventRow {
  const base = { id: e.id, user_id: userId, occurred_at: e.at, device_id: e.deviceId };
  const table = EVENT_TABLE[e.kind];
  switch (e.kind) {
    case 'session_completed': {
      const s = e.session;
      return {
        table,
        row: {
          ...base,
          duration_min: Math.max(0, Math.round(s.durationMin)),
          avg_rpe: s.avgRpe,
          completion: s.completion,
          resisted_volume: s.resistedVolume,
          aerobic_minutes: Math.round(s.aerobicMinutes),
          form_ok_ratio: s.formOkRatio,
          results: s.results ?? [],
          local_hour: s.localHour ?? null,
          rest: s.rest ?? false,
        },
      };
    }
    case 'penalty_completed': return { table, row: { ...base, outcome: 'completed' } };
    case 'penalty_skipped': return { table, row: { ...base, outcome: 'skipped' } };
    case 'stone_granted': return { table, row: { ...base, kind: 'granted', amount: e.amount } };
    case 'stone_used': return { table, row: { ...base, kind: 'used', amount: 1 } };
    case 'injury_declared': return { table, row: { ...base, kind: 'declared' } };
    case 'injury_cleared': return { table, row: { ...base, kind: 'cleared' } };
    case 'inactivity_detected': return { table, row: { ...base, days: e.days } };
    case 'benchmark_passed': return { table, row: { ...base, rank_after: e.rankAfter, passed: true } };
    case 'shadow_unlocked': return { table, row: { ...base, shadow_id: e.shadowId } };
    case 'points_spent': return { table, row: { ...base, attribute: e.attribute, amount: e.amount } };
    case 'pain_logged': return { table, row: { ...base, pattern: e.pattern, kind: e.painKind } };
    case 'exercise_adjusted':
      return {
        table,
        row: { ...base, pattern: e.pattern, direction: e.direction, from_id: e.fromId, to_id: e.toId },
      };
  }
}
