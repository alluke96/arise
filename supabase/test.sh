#!/usr/bin/env bash
# Aplica as migrations num Postgres efêmero e roda a suíte de RLS.
#
# Não depende de projeto Supabase hospedado nem da CLI: sobe um Postgres
# local, cria um stub do schema `auth` (users + auth.uid()) e exercita as
# políticas como role `authenticated`.
#
# Uso: bash supabase/test.sh
set -euo pipefail

PGBIN=${PGBIN:-/usr/lib/postgresql/16/bin}
PGDATA=${PGDATA:-/tmp/arise-pgdata}
PGRUN=${PGRUN:-/tmp/arise-pgrun}
PGPORT=${PGPORT:-5433}
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cleanup() {
  su postgres -c "$PGBIN/pg_ctl -D $PGDATA stop -m immediate" >/dev/null 2>&1 || true
}
trap cleanup EXIT

id postgres >/dev/null 2>&1 || useradd -m postgres
rm -rf "$PGDATA" "$PGRUN"
mkdir -p "$PGDATA" "$PGRUN"
chown -R postgres "$PGDATA" "$PGRUN"

su postgres -c "$PGBIN/initdb -D $PGDATA -A trust -U postgres" >/dev/null
su postgres -c "$PGBIN/pg_ctl -D $PGDATA -o '-k $PGRUN -p $PGPORT -c listen_addresses=' -l /tmp/arise-pg.log start" >/dev/null
sleep 2

psql_run() { su postgres -c "$PGBIN/psql -h $PGRUN -p $PGPORT -U postgres -d arise -v ON_ERROR_STOP=1 -q $*"; }

su postgres -c "$PGBIN/createdb -h $PGRUN -p $PGPORT -U postgres arise"

# Stub do que o Supabase provê em produção.
cat > /tmp/arise-auth-stub.sql <<'SQL'
create schema if not exists auth;
create table auth.users (id uuid primary key default gen_random_uuid());
create or replace function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create role authenticated;
SQL

psql_run -f /tmp/arise-auth-stub.sql
echo "→ aplicando migrations"
for m in "$ROOT"/supabase/migrations/*.sql; do
  echo "  $(basename "$m")"
  psql_run -f "$m"
done

echo "→ suíte de RLS"
su postgres -c "$PGBIN/psql -h $PGRUN -p $PGPORT -U postgres -d arise -q -f $ROOT/supabase/tests/rls.test.sql"
