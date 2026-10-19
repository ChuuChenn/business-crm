#!/usr/bin/env bash
# Khôi phục bản sao lưu vào MỘT DATABASE MỚI (không bao giờ ghi đè database đang có).
#
#   ADMIN_DATABASE_URL=postgresql://user:pass@host:5432/postgres \
#     infrastructure/scripts/restore.sh backups/crm_dev_....dump crm_restore_20261019
#
# Quy trình chuyển sang dùng database đã khôi phục (đổi DATABASE_URL) là thao tác vận hành có kiểm
# soát, không tự động hóa ở đây — tránh vô tình đè dữ liệu thật.
set -euo pipefail

: "${ADMIN_DATABASE_URL:?Cần ADMIN_DATABASE_URL (kết nối tới database quản trị, ví dụ postgres)}"
DUMP="${1:?Thiếu đường dẫn file .dump}"
TARGET_DB="${2:?Thiếu tên database đích (phải là database mới)}"

[[ "$TARGET_DB" =~ ^[a-z][a-z0-9_]{2,62}$ ]] || { echo "Tên database đích không hợp lệ: $TARGET_DB" >&2; exit 1; }
[[ -f "$DUMP" ]] || { echo "Không tìm thấy file: $DUMP" >&2; exit 1; }
if [[ -f "$DUMP.sha256" ]]; then
  sha256sum --check --quiet "$DUMP.sha256" || { echo "Checksum không khớp, dừng." >&2; exit 1; }
fi

ADMIN_URL="${ADMIN_DATABASE_URL%%\?*}"
EXISTS="$(psql "$ADMIN_URL" -tAc "SELECT 1 FROM pg_database WHERE datname = '$TARGET_DB'")"
if [[ "$EXISTS" == "1" ]]; then
  echo "Database '$TARGET_DB' đã tồn tại. Script chỉ khôi phục vào database mới để không ghi đè dữ liệu." >&2
  exit 1
fi

psql "$ADMIN_URL" -v ON_ERROR_STOP=1 -qc "CREATE DATABASE \"$TARGET_DB\""
TARGET_URL="${ADMIN_URL%/*}/$TARGET_DB"
pg_restore --no-owner --no-privileges --exit-on-error --dbname="$TARGET_URL" "$DUMP"

echo "Đã khôi phục vào database mới: $TARGET_DB"
psql "$TARGET_URL" -tAc "SELECT 'migrations: ' || count(*) FROM _prisma_migrations" || true
