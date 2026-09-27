-- Arise — ids de evento determinísticos e os dois tipos de evento novos
--
-- 1. O cliente passou a gerar ids DETERMINÍSTICOS para eventos que só podem
--    acontecer uma vez por dia/mês (`session:2026-09-27`, `stone_grant:2026-09`).
--    É o que torna idempotente a reconciliação feita em dois aparelhos: os
--    dois geram o mesmo id e o segundo envio vira ON CONFLICT DO NOTHING.
--    Esses ids não são UUID e se repetem ENTRE usuários — a chave passa a
--    ser (user_id, id), texto.
--
-- 2. `inactivity_detected` (Dungeon Break, R9) e `exercise_adjusted` (escada
--    de progressão, R5.8/R5.9) ganham tabela própria.
--
-- 3. `sessions` guarda o resultado por exercício, a hora local e se foi dia
--    de descanso — o fold de escada e de sombras depende disso.

-- ── Chave composta em texto ────────────────────────────────────────────────

alter table set_logs drop constraint set_logs_session_id_fkey;

do $$
declare t text;
begin
  foreach t in array array[
    'sessions','penalty_events','stone_events','injury_events','benchmarks',
    'shadow_unlocks','pain_log','point_allocations'
  ]
  loop
    execute format('alter table %I drop constraint %I', t, t || '_pkey');
    execute format('alter table %I alter column id type text using id::text', t);
    execute format('alter table %I add primary key (user_id, id)', t);
  end loop;
end $$;

alter table set_logs alter column session_id type text using session_id::text;
alter table set_logs
  add constraint set_logs_session_fkey
  foreign key (user_id, session_id) references sessions (user_id, id) on delete cascade;

-- ── Sessões: dados que o fold consome ──────────────────────────────────────

alter table sessions
  add column results    jsonb   not null default '[]'::jsonb,
  add column local_hour int     check (local_hour between 0 and 23),
  add column rest       boolean not null default false;

-- ── Benchmarks: o evento do cliente só carrega o rank alcançado ────────────
-- O posicionamento inicial também é um `benchmark_passed` e não tem rank
-- anterior nem resultados de teste.

alter table benchmarks
  alter column rank_before drop not null,
  alter column passed set default true,
  alter column results set default '{}'::jsonb;

-- ── Tabelas novas ──────────────────────────────────────────────────────────

create table inactivity_events (
  id          text not null,
  user_id     uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null,
  days        int  not null check (days > 0),
  device_id   text not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, id)
);

create table exercise_adjustments (
  id          text not null,
  user_id     uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null,
  pattern     text not null,
  direction   text not null check (direction in ('easier','harder')),
  from_id     text not null,
  to_id       text not null,
  device_id   text not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, id)
);

create index on inactivity_events    (user_id, created_at);
create index on exercise_adjustments (user_id, created_at);

-- ── RLS: mesma política das outras tabelas do usuário ──────────────────────

do $$
declare t text;
begin
  foreach t in array array['inactivity_events','exercise_adjustments']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
    execute format($f$
      create policy "own rows" on %I
        for all
        using (user_id = (select auth.uid()))
        with check (user_id = (select auth.uid()))
    $f$, t);
    execute format('grant select, insert, update, delete on %I to authenticated', t);
  end loop;
end $$;
