#!/bin/sh
# Backup zilnic al bazei de date (cron: 15 3 * * * /opt/bursa/backup.sh)
# Păstrează ultimele 14 zile. Copiază-le și în afara serverului (ex. Cloudflare R2).
set -eu
cd "$(dirname "$0")"
mkdir -p backups
docker compose exec -T db pg_dump -U bursa -d bursa -Fc > "backups/bursa-$(date +%F).dump"
find backups -name 'bursa-*.dump' -mtime +14 -delete
