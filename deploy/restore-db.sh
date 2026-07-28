#!/usr/bin/env bash
# Restores one database dump created by backup.sh.
# Example: CONFIRM_RESTORE=YES ./restore-db.sh gordyar-db-20260727T120000Z.dump
set -euo pipefail

backup_name="${1:-}"
if [[ ! "$backup_name" =~ ^gordyar-db-[0-9]{8}T[0-9]{6}Z\.dump$ ]]; then
  echo "Pass a database backup filename, not a path." >&2
  exit 1
fi

if [[ "${CONFIRM_RESTORE:-}" != 'YES' ]]; then
  echo "Restore replaces the current database. Set CONFIRM_RESTORE=YES to continue." >&2
  exit 1
fi

docker compose exec -T backup test -f "/backups/$backup_name"

restart_services() {
  docker compose start backend worker frontend caddy >/dev/null 2>&1 || true
}
trap restart_services EXIT

echo "Stopping application services..."
docker compose stop backend worker frontend caddy

echo "Restoring $backup_name..."
docker compose exec -T backup pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  --exit-on-error \
  --dbname=gym_saas \
  "/backups/$backup_name"

echo "Reapplying database grants and tenant policies..."
set -a
source .env
set +a
docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U postgres -d gym_saas \
  -v gym_app_password="$POSTGRES_APP_PASSWORD" \
  -v gym_admin_password="$POSTGRES_ADMIN_PASSWORD" \
  -f /dev/stdin < postgres-bootstrap.sql
docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U postgres -d gym_saas \
  -f /dev/stdin < ../backend/prisma/rls-policies.sql

restart_services
trap - EXIT
echo "Database restore completed."
