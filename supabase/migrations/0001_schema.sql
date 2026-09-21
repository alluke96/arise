-- Arise — schema inicial
--
-- Duas famílias de tabela, por razões diferentes:
--
--   EVENTOS  append-only, id gerado no cliente. Fatos de treino não conflitam,
--            eles se unem. A progressão (nível, XP, rank, sequência) NÃO vive
--            aqui: ela é um fold sobre estes eventos, calculado no cliente.
--            Ver .kiro/specs/arise-backend/design.md §1.
--
--   DOCUMENTOS  mutáveis, resolvidos por última escrita. Baixa frequência e um
--               usuário só, então LWW por updated_at basta.

create extension if not exists "pgcrypto";

-- ── Documentos ──────────────────────────────────────────────────────────────

create table profiles (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  hunter_name        text not null check (char_length(hunter_name) between 3 and 20),
  birth_year         int  not null,
  gender             text not null check (gender in ('male','female','unspecified','custom')),
  goal               text not null check (goal in ('fat_loss','strength','health','habit')),
  days_per_week      int  not null check (days_per_week between 2 and 5),
  session_minutes    int  not null,
  preferred_time     text not null,
  location           text not null,
  equipment          jsonb not null default '[]'::jsonb,
  limitations        jsonb not null default '[]'::jsonb,
  units              jsonb not null default '{"mass":"kg","length":"cm"}'::jsonb,
  locale             text not null default 'pt-BR',
  system_tone        text not null default 'cold' check (system_tone in ('cold','companion')),
  sync_health_consent boolean not null default false,  -- B5.3
  updated_at         timestamptz not null default now(),
  updated_by_device  text not null
);

create table health_screenings (
  id                 uuid primary key,
  user_id            uuid not null references auth.users(id) on delete cascade,
  taken_on           date not null,
  answers            jsonb not null,
  result             text not null check (result in ('cleared','caution','blocked')),
  restrictions       jsonb not null default '[]'::jsonb,
  expires_at         date not null,             -- R2.7: 12 meses
  updated_at         timestamptz not null default now(),
  updated_by_device  text not null,
  unique (user_id, taken_on)
);

create table daily_quests (
  id                 uuid primary key,
  user_id            uuid not null references auth.users(id) on delete cascade,
  quest_date         date not null,
  rank               text not null,
  objectives         jsonb not null,
  status             text not null check (status in ('pending','partial','completed','failed')),
  is_deload          boolean not null default false,
  is_rest_day        boolean not null default false,
  updated_at         timestamptz not null default now(),
  updated_by_device  text not null,
  unique (user_id, quest_date)
);

-- ── Eventos ─────────────────────────────────────────────────────────────────
-- `id` vem do cliente: o reenvio de um lote vira ON CONFLICT DO NOTHING.

create table sessions (
  id                uuid primary key,
  user_id           uuid not null references auth.users(id) on delete cascade,
  occurred_at       timestamptz not null,
  duration_min      int  not null check (duration_min >= 0),
  avg_rpe           int  not null check (avg_rpe in (3,5,7,9)),
  completion        text not null check (completion in ('partial','complete','complete_good_form')),
  resisted_volume   numeric not null default 0,
  aerobic_minutes   int not null default 0,
  form_ok_ratio     numeric not null default 0 check (form_ok_ratio between 0 and 1),
  device_id         text not null,
  created_at        timestamptz not null default now()
);

create table set_logs (
  id           uuid primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  session_id   uuid not null references sessions(id) on delete cascade,
  exercise_id  text not null,
  set_index    int  not null,
  reps         int,
  weight_kg    numeric,
  duration_s   int,
  distance_m   int,
  rpe          int check (rpe in (3,5,7,9)),
  form_ok      boolean,
  created_at   timestamptz not null default now()
);

create table penalty_events (
  id          uuid primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null,
  outcome     text not null check (outcome in ('completed','skipped')),
  device_id   text not null,
  created_at  timestamptz not null default now()
);

create table stone_events (
  id          uuid primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null,
  kind        text not null check (kind in ('granted','used')),
  amount      int  not null default 1,
  device_id   text not null,
  created_at  timestamptz not null default now()
);

create table injury_events (
  id          uuid primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null,
  kind        text not null check (kind in ('declared','cleared')),
  device_id   text not null,
  created_at  timestamptz not null default now()
);

create table benchmarks (
  id           uuid primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  occurred_at  timestamptz not null,
  rank_before  text not null,
  rank_after   text not null,
  passed       boolean not null,
  results      jsonb not null,
  device_id    text not null,
  created_at   timestamptz not null default now()
);

create table shadow_unlocks (
  id          uuid primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null,
  shadow_id   text not null,
  device_id   text not null,
  created_at  timestamptz not null default now(),
  unique (user_id, shadow_id)
);

create table pain_log (
  id          uuid primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null,
  pattern     text not null,
  kind        text not null check (kind in ('joint','muscle')),  -- R15.5
  device_id   text not null,
  created_at  timestamptz not null default now()
);

create table point_allocations (
  id          uuid primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null,
  attribute   text not null check (attribute in ('STR','AGI','VIT','PER','INT')),
  amount      int  not null check (amount > 0),
  device_id   text not null,
  created_at  timestamptz not null default now()
);

create table body_metrics (
  id           uuid primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  measured_on  date not null,
  weight_kg    numeric,
  waist_cm     numeric,
  device_id    text not null,
  created_at   timestamptz not null default now(),
  unique (user_id, measured_on)
);

-- ── Guildas ─────────────────────────────────────────────────────────────────

create table guilds (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 3 and 30),
  invite_code text not null unique,
  created_by  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table guild_members (
  guild_id  uuid not null references guilds(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (guild_id, user_id)
);

create table guild_raids (
  id         uuid primary key default gen_random_uuid(),
  guild_id   uuid not null references guilds(id) on delete cascade,
  goal_kind  text not null,
  goal_value int  not null,
  starts_on  date not null,
  ends_on    date not null
);

-- ── Índices de cursor ───────────────────────────────────────────────────────
-- O pull é sempre "o que mudou desde X, deste usuário".

create index on sessions        (user_id, created_at);
create index on set_logs        (user_id, created_at);
create index on penalty_events  (user_id, created_at);
create index on stone_events    (user_id, created_at);
create index on injury_events   (user_id, created_at);
create index on benchmarks      (user_id, created_at);
create index on shadow_unlocks  (user_id, created_at);
create index on pain_log        (user_id, created_at);
create index on body_metrics    (user_id, created_at);
create index on point_allocations (user_id, created_at);
create index on daily_quests      (user_id, updated_at);
create index on health_screenings (user_id, updated_at);
create index on set_logs        (session_id);
create index on guild_members   (user_id);
