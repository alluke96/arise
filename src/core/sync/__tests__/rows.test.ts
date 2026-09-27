import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { eventToRow } from '../rows';
import { EVENT_TABLE, type DomainEvent, type EventKind } from '../events';

const MIGRATIONS = join(__dirname, '../../../../supabase/migrations');

/** Colunas por tabela depois de aplicar todas as migrations, em ordem. */
function schemaColumns(): Map<string, Set<string>> {
  const tables = new Map<string, Set<string>>();
  for (const f of readdirSync(MIGRATIONS).filter((n) => n.endsWith('.sql')).sort()) {
    const sql = readFileSync(join(MIGRATIONS, f), 'utf8').replace(/--[^\n]*/g, '');
    for (const m of sql.matchAll(/create table (\w+) \(([\s\S]*?)\n\);/g)) {
      const cols = new Set<string>();
      for (const line of m[2]!.split('\n')) {
        const c = line.trim().match(/^(\w+)\s+(uuid|text|int|numeric|boolean|jsonb|timestamptz|date|smallint)/);
        if (c) cols.add(c[1]!);
      }
      tables.set(m[1]!, cols);
    }
    for (const m of sql.matchAll(/alter table (\w+)\s+((?:add column [^;]+))/g)) {
      for (const c of m[2]!.matchAll(/add column (\w+)/g)) tables.get(m[1]!)?.add(c[1]!);
    }
  }
  return tables;
}

const base = { at: '2026-09-27T12:00:00.000Z', deviceId: 'dev' };
const SAMPLES: Record<EventKind, DomainEvent> = {
  session_completed: {
    ...base, id: 'session:2026-09-27', kind: 'session_completed',
    session: {
      date: '2026-09-27', durationMin: 21.4, avgRpe: 5, completion: 'complete', resistedVolume: 120,
      aerobicMinutes: 10, formOkRatio: 1, results: [{ exerciseId: 'push_knee', value: 12, completed: true, formOk: true }],
      localHour: 19,
    },
  },
  penalty_completed: { ...base, id: 'penalty_done:2026-09-26', kind: 'penalty_completed' },
  penalty_skipped: { ...base, id: 'penalty_skip:2026-09-26', kind: 'penalty_skipped' },
  stone_granted: { ...base, id: 'stone_grant:2026-09', kind: 'stone_granted', amount: 1 },
  stone_used: { ...base, id: 'stone_use:2026-09-26', kind: 'stone_used' },
  injury_declared: { ...base, id: 'injury:on:1', kind: 'injury_declared' },
  injury_cleared: { ...base, id: 'injury:off:2', kind: 'injury_cleared' },
  inactivity_detected: { ...base, id: 'inactive:2026-09-20', kind: 'inactivity_detected', days: 2 },
  benchmark_passed: { ...base, id: 'bench:2026-09-27', kind: 'benchmark_passed', rankAfter: 'D' },
  shadow_unlocked: { ...base, id: 'shadow:sentinela', kind: 'shadow_unlocked', shadowId: 'sentinela' },
  points_spent: { ...base, id: 'p1', kind: 'points_spent', attribute: 'STR', amount: 1 },
  pain_logged: { ...base, id: 'pain:2026-09-27:squat:joint', kind: 'pain_logged', pattern: 'squat', painKind: 'joint' },
  exercise_adjusted: {
    ...base, id: 'adjust:2026-09-27:push_h:push_wall', kind: 'exercise_adjusted',
    pattern: 'push_h', direction: 'easier', fromId: 'push_knee', toId: 'push_wall',
  },
};

describe('evento → linha', () => {
  const schema = schemaColumns();

  it('toda tabela de evento existe nas migrations', () => {
    for (const table of new Set(Object.values(EVENT_TABLE))) expect(schema.has(table), table).toBe(true);
  });

  it.each(Object.keys(SAMPLES) as EventKind[])('%s gera só colunas que existem', (kind) => {
    const { table, row } = eventToRow(SAMPLES[kind], 'user-1');
    expect(table).toBe(EVENT_TABLE[kind]);
    const cols = schema.get(table)!;
    for (const k of Object.keys(row)) expect(cols.has(k), `${table}.${k}`).toBe(true);
    expect(row.user_id).toBe('user-1');
    expect(row.id).toBe(SAMPLES[kind].id);
  });

  it('sessão arredonda duração para inteiro e leva os resultados', () => {
    const { row } = eventToRow(SAMPLES.session_completed, 'u');
    expect(row.duration_min).toBe(21);
    expect(row.results).toHaveLength(1);
    expect(row.rest).toBe(false);
  });
});
