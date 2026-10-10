-- Arise — estudo no Códice
--
-- Abrir um exercício no Códice vira evento `codex_read` (id `codex:<exercício>`,
-- um por exercício). Alimenta Inteligência e a sombra Arauto. Mesma chave
-- composta e mesma política dos outros eventos do usuário.

create table codex_reads (
  id          text not null,
  user_id     uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null,
  exercise_id text not null,
  device_id   text not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, id)
);

create index on codex_reads (user_id, created_at);

alter table codex_reads enable row level security;
alter table codex_reads force row level security;
create policy "own rows" on codex_reads
  for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
grant select, insert, update, delete on codex_reads to authenticated;
