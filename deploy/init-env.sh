#!/usr/bin/env bash
# Creates a production .env with cryptographically random, URL-safe secrets.
set -euo pipefail

if [[ -e .env ]]; then
  echo "deploy/.env already exists; no changes were made." >&2
  exit 1
fi

if ! command -v openssl >/dev/null 2>&1; then
  echo "OpenSSL is required to generate production secrets." >&2
  exit 1
fi

random_secret() {
  openssl rand -hex 32
}

cat > .env <<EOF
DOMAIN=gordyar.ir
API_DOMAIN=api.gordyar.ir

POSTGRES_OWNER_PASSWORD=$(random_secret)
POSTGRES_APP_PASSWORD=$(random_secret)
POSTGRES_ADMIN_PASSWORD=$(random_secret)
REDIS_PASSWORD=$(random_secret)
JWT_ACCESS_SECRET=$(random_secret)
JWT_REFRESH_SECRET=$(random_secret)
JWT_ACCESS_TTL_SECONDS=900

ANTHROPIC_API_KEY=

S3_ENDPOINT=
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_REGION=default
S3_PUBLIC_BASE_URL=
LOCAL_UPLOADS_ENABLED=true

SMS_PROVIDER_API_KEY=
SMTP_HOST=

BACKUP_RETENTION_DAYS=7
BACKUP_INTERVAL_SECONDS=86400
EOF

chmod 600 .env
echo "Created deploy/.env with private random secrets."
