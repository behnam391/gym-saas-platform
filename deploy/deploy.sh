#!/usr/bin/env bash
# Run from the deploy/ directory on the VPS.
# Safe to re-run: data volumes are preserved and migrations are idempotent.
set -euo pipefail

if [[ ! -f .env ]]; then
  echo "Missing deploy/.env. Run ./init-env.sh first." >&2
  exit 1
fi

set -a
source .env
set +a

required_vars=(
  POSTGRES_OWNER_PASSWORD
  POSTGRES_APP_PASSWORD
  POSTGRES_ADMIN_PASSWORD
  REDIS_PASSWORD
  JWT_ACCESS_SECRET
  JWT_REFRESH_SECRET
)

for variable_name in "${required_vars[@]}"; do
  value="${!variable_name:-}"
  if [[ -z "$value" || "$value" == CHANGE_ME* ]]; then
    echo "Missing or unsafe value for $variable_name in deploy/.env." >&2
    exit 1
  fi
done

if [[ "${#JWT_ACCESS_SECRET}" -lt 32 || "${#JWT_REFRESH_SECRET}" -lt 32 ]]; then
  echo "JWT secrets must each contain at least 32 characters." >&2
  exit 1
fi

echo "==> Validating deployment configuration..."
docker compose config --quiet

echo "==> Starting private data services..."
docker compose up -d postgres redis

echo "==> Waiting for PostgreSQL..."
until docker compose exec -T postgres pg_isready -U postgres -d gym_saas >/dev/null 2>&1; do
  sleep 1
done

echo "==> Creating restricted application database roles..."
docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U postgres -d gym_saas \
  -v gym_app_password="$POSTGRES_APP_PASSWORD" \
  -v gym_admin_password="$POSTGRES_ADMIN_PASSWORD" \
  -f /dev/stdin < postgres-bootstrap.sql

echo "==> Building application images..."
docker compose build backend frontend

admin_database_url="postgresql://gym_admin:${POSTGRES_ADMIN_PASSWORD}@postgres:5432/gym_saas?schema=public"

echo "==> Applying database migrations..."
docker compose run --rm -e DATABASE_URL="$admin_database_url" backend \
  ./node_modules/.bin/prisma migrate deploy

echo "==> Refreshing grants and row-level security policies..."
docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U postgres -d gym_saas \
  -v gym_app_password="$POSTGRES_APP_PASSWORD" \
  -v gym_admin_password="$POSTGRES_ADMIN_PASSWORD" \
  -f /dev/stdin < postgres-bootstrap.sql
docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U postgres -d gym_saas \
  -f /dev/stdin < ../backend/prisma/rls-policies.sql

echo "==> Starting Gordyar..."
docker compose up -d --remove-orphans

echo "==> Deployment completed."
docker compose ps
