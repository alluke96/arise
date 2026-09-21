-- Teste de segurança em nível de linha (B6.3).
--
-- Política sem teste de acesso cruzado é política que não existe. Este script
-- autentica como um usuário e confirma que as linhas do outro são invisíveis —
-- e que uma tentativa de escrever no nome alheio é recusada.
--
-- Roda como role `authenticated`, não como superusuário: superusuário ignora
-- RLS e o teste passaria sem provar nada.

\set ON_ERROR_STOP on
\set A '11111111-1111-1111-1111-111111111111'
\set B '22222222-2222-2222-2222-222222222222'

insert into auth.users (id) values (:'A'), (:'B');

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

insert into profiles (user_id, hunter_name, birth_year, gender, goal, days_per_week,
                      session_minutes, preferred_time, location, updated_by_device)
values (:'A', 'CACADOR-A', 1998, 'male', 'habit', 3, 20, '19:00', 'home', 'seed'),
       (:'B', 'CACADOR-B', 1995, 'female', 'health', 3, 20, '07:00', 'gym', 'seed');

insert into sessions (id, user_id, occurred_at, duration_min, avg_rpe, completion, device_id)
values (gen_random_uuid(), :'A', now(), 20, 5, 'complete', 'seed'),
       (gen_random_uuid(), :'B', now(), 30, 7, 'complete', 'seed');

insert into body_metrics (id, user_id, measured_on, weight_kg, device_id)
values (gen_random_uuid(), :'A', current_date, 89.1, 'seed'),
       (gen_random_uuid(), :'B', current_date, 61.4, 'seed');

insert into health_screenings (id, user_id, taken_on, answers, result, expires_at, updated_by_device)
values (gen_random_uuid(), :'A', current_date, '{}'::jsonb, 'cleared', current_date + 365, 'seed'),
       (gen_random_uuid(), :'B', current_date, '{}'::jsonb, 'caution', current_date + 365, 'seed');

-- ── Autentica como A ────────────────────────────────────────────────────────
set role authenticated;
select set_config('request.jwt.claim.sub', :'A', false);

do $$
declare n int;
begin
  select count(*) into n from sessions;
  if n <> 1 then raise exception 'sessions: A deveria ver 1 linha, viu %', n; end if;

  select count(*) into n from profiles;
  if n <> 1 then raise exception 'profiles: A deveria ver 1 linha, viu %', n; end if;

  -- Dado de saúde de outra pessoa: peso e triagem.
  select count(*) into n from body_metrics
    where user_id = '22222222-2222-2222-2222-222222222222';
  if n <> 0 then raise exception 'VAZAMENTO: A enxergou % peso(s) de B', n; end if;

  select count(*) into n from health_screenings
    where user_id = '22222222-2222-2222-2222-222222222222';
  if n <> 0 then raise exception 'VAZAMENTO: A enxergou % triagem(ns) de B', n; end if;

  raise notice 'leitura cruzada bloqueada';
end $$;

-- Escrever no nome de outro usuário deve ser recusado pelo WITH CHECK.
do $$
begin
  begin
    insert into sessions (id, user_id, occurred_at, duration_min, avg_rpe, completion, device_id)
    values (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', now(), 10, 3, 'partial', 'attack');
    raise exception 'FALHA: A conseguiu inserir sessao no nome de B';
  exception
    when insufficient_privilege then raise notice 'insert cruzado recusado';
  end;
end $$;

-- Atualizar linha alheia não deve afetar nenhuma linha.
do $$
declare n int;
begin
  update profiles set hunter_name = 'INVADIDO'
   where user_id = '22222222-2222-2222-2222-222222222222';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALHA: A atualizou % linha(s) de B', n; end if;
  raise notice 'update cruzado sem efeito';
end $$;

-- Apagar linha alheia idem.
do $$
declare n int;
begin
  delete from sessions where user_id = '22222222-2222-2222-2222-222222222222';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALHA: A apagou % linha(s) de B', n; end if;
  raise notice 'delete cruzado sem efeito';
end $$;

-- ── Guilda: o roster não pode expor dado de saúde (B4.4) ───────────────────
reset role;
do $$
declare g uuid;
begin
  insert into guilds (name, invite_code, created_by)
  values ('Ahjin', 'ABC123', '11111111-1111-1111-1111-111111111111') returning id into g;
  insert into guild_members (guild_id, user_id) values
    (g, '11111111-1111-1111-1111-111111111111'),
    (g, '22222222-2222-2222-2222-222222222222');
end $$;

do $$
declare cols text;
begin
  select string_agg(column_name, ',' order by column_name) into cols
  from information_schema.columns
  where table_name = 'guild_roster';

  if cols ~ '(weight|waist|height|answers|birth|restrictions)' then
    raise exception 'VAZAMENTO: guild_roster expoe dado de saude -> %', cols;
  end if;
  raise notice 'guild_roster sem dado de saude: %', cols;
end $$;

-- ── Nenhuma tabela pode ficar sem RLS ──────────────────────────────────────
do $$
declare unprotected text;
begin
  select string_agg(tablename, ', ') into unprotected
  from pg_tables t
  where schemaname = 'public'
    and not exists (
      select 1 from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where c.relname = t.tablename and n.nspname = 'public' and c.relrowsecurity
    );
  if unprotected is not null then
    raise exception 'tabelas sem RLS: %', unprotected;
  end if;
  raise notice 'todas as tabelas de public tem RLS habilitado';
end $$;

select 'RLS OK' as resultado;
