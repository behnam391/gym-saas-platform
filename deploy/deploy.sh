#!/usr/bin/env bash
# Run from the deploy/ directory after `docker compose up -d postgres redis`.
# Idempotent: safe to re-run on every deploy.
set -euo pipefail

if [ ! -f .env ]; then
  echo "Missing .env — copy .env.example and fill in real secrets first." >&2
  exit 1
fi
set -a; source .env; set +a

echo "==> Starting Postgres and Redis..."
docker compose up -d postgres redis

echo "==> Waiting for Postgres to be healthy..."
until docker compose exec -T postgres pg_isready -U gym_app -d gym_saas >/dev/null 2>&1; do
  sleep 1
done

echo "==> Bootstrapping gym_app / gym_admin roles..."
docker compose exec -T postgres psql -U gym_app -d gym_saas \
  -v gym_app_password="'${POSTGRES_PASSWORD}'" \
  -v gym_admin_password="'${POSTGRES_ADMIN_PASSWORD}'" \
  -f /dev/stdin < postgres-bootstrap.sql

echo "==> Building application images..."
docker compose build backend frontend

echo "==> Running Prisma migrations..."
docker compose run --rm backend npx prisma migrate deploy

echo "==> Applying Row-Level Security policies..."
docker compose exec -T postgres psql -U gym_app -d gym_saas -f /dev/stdin < ../backend/prisma/rls-policies.sql

echo "==> Building and starting all services..."
docker compose up -d --build

echo "==> Done. Check health with: docker compose ps"
