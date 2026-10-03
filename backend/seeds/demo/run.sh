#!/usr/bin/env bash
# Re-runnable demo seed for INOS (Rippotai).
# 1) applies pending backend migrations (tracked in table _local_migrations; the two original
#    one-time migrations are assumed applied if their tables/columns already exist),
# 2) shifts seeded dates forward to today (shift_dates.py; no-op when already current),
# 3) generates SQL per section and applies it (INSERT IGNORE with fixed uuid5 ids -> idempotent).
# Usage: seeds/demo/run.sh [section ...]   (default: all)
set -euo pipefail
cd "$(dirname "$0")"
DB="${SEED_DB:-spsyn8lm_rippotai_erp}"
M="mysql $DB --default-character-set=utf8mb4"

# ---- migrations ----
$M -e "CREATE TABLE IF NOT EXISTS _local_migrations (name varchar(255) PRIMARY KEY, applied_at datetime NOT NULL DEFAULT current_timestamp())"
if [ -n "$($M -N -e "SHOW COLUMNS FROM gate_definitions LIKE 'phase_code'")" ]; then
  $M -e "INSERT IGNORE INTO _local_migrations(name) VALUES ('20260912_command_center_gate_engine.sql')"
fi
if [ -n "$($M -N -e "SHOW TABLES LIKE 'project_procurement_items'")" ]; then
  $M -e "INSERT IGNORE INTO _local_migrations(name) VALUES ('20260918_unified_project_planner.sql')"
fi
for f in ../../migrations/*.sql; do
  n=$(basename "$f")
  if [ -z "$($M -N -e "SELECT 1 FROM _local_migrations WHERE name='$n'")" ]; then
    echo "migration $n"
    $M < "$f"
    $M -e "INSERT INTO _local_migrations(name) VALUES ('$n')"
  fi
done

# ---- keep dates current: shift seeded dates so the seed's "today" is the real today (idempotent) ----
python3 shift_dates.py

# ---- seed sections (generated relative to the anchor day in _seed_state) ----
SECTIONS=("$@")
[ ${#SECTIONS[@]} -eq 0 ] && SECTIONS=(s01_core s02_crm s03_procurement s04_finance s05_docs s06_siteops s07_planning s08_activity s09_automation)
for s in "${SECTIONS[@]}"; do
  python3 gen.py "$s"
  $M < "sql/$s.sql"
  echo "applied $s"
done
