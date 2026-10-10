-- Arise — dias de treino escolhidos pelo usuário
--
-- Cada troca de agenda é um evento datado (`schedule_changed`): os dias
-- anteriores seguem julgados pela agenda que valia neles, então trocar os
-- dias nunca cria penalidade retroativa.

create table schedule_changes (
  id          text not null,
  user_id     uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null,
  weekdays    jsonb not null,
  device_id   text not null,
  created_at  timestamptz not null default now(),
  primary key (user_id, id)
);

create index on schedule_changes (user_id, created_at);

alter table schedule_changes enable row level security;
alter table schedule_changes force row level security;
create policy "own rows" on schedule_changes
  for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
grant select, insert, update, delete on schedule_changes to authenticated;
