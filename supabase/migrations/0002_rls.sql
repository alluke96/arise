-- Arise — segurança em nível de linha
--
-- Dado de saúde é dado pessoal sensível sob a LGPD. A proteção fica NO BANCO,
-- não na aplicação: um bug de API não vaza linha de outro usuário porque o
-- Postgres recusa a leitura.
--
-- Negar por padrão (B5.2): habilitar RLS sem política já bloqueia tudo. Cada
-- política abaixo abre exatamente um caminho.
--
-- `(select auth.uid())` em vez de `auth.uid()` é proposital: o planner avalia
-- a subquery uma vez por consulta em vez de uma vez por linha.

-- ── Tabelas do próprio usuário ──────────────────────────────────────────────

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','health_screenings','daily_quests','sessions','set_logs',
    'penalty_events','stone_events','injury_events','benchmarks',
    'shadow_unlocks','pain_log','body_metrics','point_allocations'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
    execute format($f$
      create policy "own rows" on %I
        for all
        using (user_id = (select auth.uid()))
        with check (user_id = (select auth.uid()))
    $f$, t);
  end loop;
end $$;

-- ── Guildas ─────────────────────────────────────────────────────────────────

alter table guilds        enable row level security;
alter table guild_members enable row level security;
alter table guild_raids   enable row level security;

-- Evita recursão na política de guild_members: a função roda como owner e
-- portanto não reentra no RLS da própria tabela.
create or replace function public.is_guild_member(g uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from guild_members
    where guild_id = g and user_id = (select auth.uid())
  );
$$;

create policy "members read guild" on guilds
  for select using (public.is_guild_member(id));

create policy "creator manages guild" on guilds
  for all using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()));

create policy "members read roster" on guild_members
  for select using (public.is_guild_member(guild_id));

create policy "self join and leave" on guild_members
  for all using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "members read raids" on guild_raids
  for select using (public.is_guild_member(guild_id));

-- ── A view que a guilda enxerga ─────────────────────────────────────────────
--
-- B4.4 — peso, altura, cintura e respostas de triagem NÃO estão aqui. Não é
-- questão de filtrar na aplicação: o dado sensível não entra na view, então
-- não existe consulta que o traga por engano.
--
-- `security_invoker` faz a view rodar com as permissões de quem consulta, de
-- modo que o RLS das tabelas de base continua valendo.

create view guild_roster
with (security_invoker = true)
as
select
  gm.guild_id,
  gm.user_id,
  p.hunter_name,
  (
    select b.rank_after from benchmarks b
    where b.user_id = gm.user_id and b.passed
    order by b.occurred_at desc limit 1
  ) as rank,
  (
    select count(*) from sessions s
    where s.user_id = gm.user_id
      and s.occurred_at >= date_trunc('day', now())
  ) as sessions_today
from guild_members gm
join profiles p on p.user_id = gm.user_id;

-- ── Auditoria de acesso administrativo (B5.8) ───────────────────────────────

create table admin_audit_log (
  id         bigserial primary key,
  actor      text not null,
  action     text not null,
  subject_id uuid,
  at         timestamptz not null default now()
);

alter table admin_audit_log enable row level security;
-- Sem política: nenhum cliente lê ou escreve. Só a service role, que ignora RLS.
