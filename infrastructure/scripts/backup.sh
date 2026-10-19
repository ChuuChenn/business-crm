#!/usr/bin/env bash
# Sao lưu PostgreSQL (định dạng custom của pg_dump, nén) kèm checksum SHA-256.
#
#   DATABASE_URL=postgresql://... infrastructure/scripts/backup.sh [thư_mục_đích]
#
# Không ghi mật khẩu ra màn hình. Cần pg_dump cùng major version với server (16).
set -euo pipefail

: "${DATABASE_URL:?Cần biến DATABASE_URL}"
OUT_DIR="${1:-backups}"
mkdir -p "$OUT_DIR"

# Prisma dùng tham số ?schema=..., libpq không hiểu → bỏ query string.
PG_URL="${DATABASE_URL%%\?*}"
DB_NAME="${PG_URL##*/}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="$OUT_DIR/${DB_NAME}_${STAMP}.dump"

pg_dump --format=custom --compress=6 --no-owner --no-privileges --file="$FILE" "$PG_URL"
sha256sum "$FILE" > "$FILE.sha256"
pg_restore --list "$FILE" > /dev/null   # xác nhận file đọc được

echo "Đã sao lưu: $FILE ($(du -h "$FILE" | cut -f1))"
