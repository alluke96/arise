import type { SqlDriver } from './driver';

/**
 * Migrations locais. Numeradas e aplicadas em ordem, uma vez cada.
 *
 * Espelham o schema do servidor (`supabase/migrations/`): mesmas tabelas de
 * evento e de documento, para que a sincronização seja transferência de linha
 * e não tradução de modelo.
 */
export interface Migration {
  version: number;
  name: string;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'initial',
    sql: `
      create table profile (
        id                integer primary key check (id = 1),
        hunter_name       text not null,
        age               integer not null,
        gender            text not null,
        weight_kg         real not null,
        height_cm         real not null,
        waist_cm          real,
        goal              text not null,
        days_per_week     integer not null,
        session_minutes   integer not null,
        preferred_time    text not null,
        location          text not null,
        equipment         text not null default '[]',
        limitations       text not null default '[]',
        units             text not null default '{"mass":"kg","length":"cm"}',
        locale            text not null default 'pt-BR',
        system_tone       text not null default 'cold',
        onboarded         integer not null default 0,
        updated_at        text not null,
        updated_by_device text not null
      );

      create table progression_cache (
        id              integer primary key check (id = 1),
        level           integer not null,
        xp              integer not null,
        rank            text not null,
        attributes      text not null,
        unspent_points  integer not null,
        streak_current  integer not null,
        streak_best     integer not null,
        recovery_stones integer not null,
        folded_at       text not null
      );

      create table health_screening (
        id                text primary key,
        taken_on          text not null unique,
        answers           text not null,
        result            text not null,
        restrictions      text not null default '[]',
        expires_at        text not null,
        updated_at        text not null,
        updated_by_device text not null
      );

      create table daily_quest (
        id                text primary key,
        quest_date        text not null unique,
        rank              text not null,
        objectives        text not null,
        status            text not null,
        deadline          text not null,
        is_deload         integer not null default 0,
        is_rest_day       integer not null default 0,
        xp_awarded        integer,
        updated_at        text not null,
        updated_by_device text not null
      );

      create table domain_event (
        id          text primary key,
        kind        text not null,
        occurred_at text not null,
        device_id   text not null,
        payload     text not null,
        synced_at   text
      );

      create table session_log (
        id              text primary key,
        occurred_at     text not null,
        duration_min    integer not null,
        avg_rpe         integer not null,
        completion      text not null,
        resisted_volume real not null default 0,
        aerobic_minutes integer not null default 0,
        form_ok_ratio   real not null default 0
      );

      create table set_log (
        id          text primary key,
        session_id  text not null references session_log(id) on delete cascade,
        exercise_id text not null,
        set_index   integer not null,
        reps        integer,
        weight_kg   real,
        duration_s  integer,
        distance_m  integer,
        rpe         integer,
        form_ok     integer
      );

      create table shadow_state (
        shadow_id   text primary key,
        unlocked_at text
      );

      create table pain_log (
        id          text primary key,
        occurred_at text not null,
        pattern     text not null,
        kind        text not null
      );

      create table body_metric (
        id          text primary key,
        measured_on text not null unique,
        weight_kg   real,
        waist_cm    real
      );

      create table health_sample (
        measured_on text primary key,
        steps       integer,
        sleep_min   integer,
        resting_hr  integer
      );

      create table app_state (
        key   text primary key,
        value text not null
      );

      create index idx_event_unsynced on domain_event (synced_at, occurred_at);
      create index idx_event_kind     on domain_event (kind, occurred_at);
      create index idx_set_session    on set_log (session_id);
      create index idx_session_date   on session_log (occurred_at);
    `,
  },
];

const MIGRATION_TABLE = `
  create table if not exists schema_migrations (
    version    integer primary key,
    name       text not null,
    applied_at text not null
  );
`;

/** Idempotente: aplicar duas vezes não faz nada na segunda. */
export function migrate(db: SqlDriver, now = new Date().toISOString()): number[] {
  db.exec(MIGRATION_TABLE);
  const applied = new Set(
    db.all<{ version: number }>('select version from schema_migrations').map((r) => r.version),
  );

  const ran: number[] = [];
  for (const m of MIGRATIONS) {
    if (applied.has(m.version)) continue;
    db.transaction(() => {
      db.exec(m.sql);
      db.run('insert into schema_migrations (version, name, applied_at) values (?, ?, ?)',
        [m.version, m.name, now]);
    });
    ran.push(m.version);
  }
  return ran;
}

export function schemaVersion(db: SqlDriver): number {
  const row = db.get<{ v: number | null }>('select max(version) as v from schema_migrations');
  return row?.v ?? 0;
}
