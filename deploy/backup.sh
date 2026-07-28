#!/bin/sh
set -eu

backup_dir=/backups
retention_days="${BACKUP_RETENTION_DAYS:-7}"
interval_seconds="${BACKUP_INTERVAL_SECONDS:-86400}"

mkdir -p "$backup_dir"

while true; do
  timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
  database_file="$backup_dir/gordyar-db-$timestamp.dump"
  uploads_file="$backup_dir/gordyar-uploads-$timestamp.tar.gz"

  echo "Creating database backup: $database_file"
  pg_dump --format=custom --no-owner --no-acl --file="$database_file"

  echo "Creating uploads backup: $uploads_file"
  tar -czf "$uploads_file" -C /uploads .

  find "$backup_dir" -type f -mtime "+$retention_days" -delete
  echo "Backup completed at $timestamp; sleeping for $interval_seconds seconds."
  sleep "$interval_seconds"
done
