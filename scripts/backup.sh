#!/usr/bin/env bash
# ==============================================================================
# Yanglin Life Network (iyanglin.com) - Production Automated Database Backup
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/yanglin_db}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="${DB_NAME:-yanglin_db}"
DB_USER="${DB_USER:-vasto_admin}"
CONTAINER="${CONTAINER:-vasto-postgres}"
BACKUP_FILE="${BACKUP_DIR}/yanglin_backup_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting enterprise PostgreSQL backup for ${DB_NAME}..."

if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  echo "[$(date)] Dumping from Docker container: ${CONTAINER}..."
  docker exec "${CONTAINER}" pg_dump -U "${DB_USER}" "${DB_NAME}" | gzip > "${BACKUP_FILE}"
else
  echo "[$(date)] Dumping from local PostgreSQL instance..."
  PGPASSWORD="${PGPASSWORD:-}" pg_dump -U "${DB_USER}" -h "${DB_HOST:-localhost}" "${DB_NAME}" | gzip > "${BACKUP_FILE}"
fi

SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[$(date)] Backup successfully generated: ${BACKUP_FILE} (${SIZE})"

# Retention policy: Remove backups older than 30 days
find "${BACKUP_DIR}" -type f -name "yanglin_backup_*.sql.gz" -mtime +30 -delete
echo "[$(date)] Cleaned up backups older than 30 days."
