"""Keep the demo data "current": move every seeded date forward so the seed's "today" is the real today.

The seed is generated relative to an anchor day (lib.TODAY). Dashboards use the real CURDATE(), so a day
later their "today" widgets (site reports, visits, tasks due, calendar) go empty. This script:
  1. reads the anchor from table _seed_state (k='today'; first run: 2026-09-29),
  2. if CURDATE() is later, shifts every DATE/DATETIME/TIMESTAMP column of every table forward by the gap
     (rows created on/after today by the app are left alone; daily_site_reports + manpower_entries are
     skipped because s06 regenerates them from the anchor),
  3. stores CURDATE() as the new anchor, so gen.py keeps producing the same (shifted) rows.
Idempotent: a second run on the same day does nothing. Usage: python3 shift_dates.py [--dry-run]
"""
import subprocess
import sys
from datetime import date

from lib import DB, q

SKIP_TABLES = {"_local_migrations", "_seed_state", "daily_site_reports", "manpower_entries", "SequelizeMeta"}
SKIP_COL_WORDS = ("birth", "dob", "token", "expire")


def run(sql):
    subprocess.run(["mysql", DB, "--default-character-set=utf8mb4", "-e", sql], check=True)


def main(dry=False):
    run("CREATE TABLE IF NOT EXISTS _seed_state (k VARCHAR(64) PRIMARY KEY, v VARCHAR(255) NOT NULL)")
    run("INSERT IGNORE INTO _seed_state (k, v) VALUES ('today', '2026-09-29')")
    anchor = date.fromisoformat(q("SELECT v FROM _seed_state WHERE k = 'today'")[0][0])
    today = date.fromisoformat(q("SELECT CURDATE()")[0][0])
    delta = (today - anchor).days
    if delta <= 0:
        print(f"seed dates current (anchor {anchor})")
        return
    cols = q(f"""SELECT c.table_name, c.column_name FROM information_schema.columns c
                 JOIN information_schema.tables t ON t.table_schema = c.table_schema AND t.table_name = c.table_name
                WHERE c.table_schema = '{DB}' AND t.table_type = 'BASE TABLE'
                  AND c.data_type IN ('date', 'datetime', 'timestamp')
                ORDER BY c.table_name, c.ordinal_position""")
    by_table = {}
    for t, c in cols:
        if t in SKIP_TABLES or t.startswith("_") or any(w in c.lower() for w in SKIP_COL_WORDS):
            continue
        by_table.setdefault(t, []).append(c)
    stmts = ["SET FOREIGN_KEY_CHECKS=0;"]
    for t, cs in by_table.items():
        sets = ", ".join(f"`{c}` = `{c}` + INTERVAL {delta} DAY" for c in cs)
        where = "WHERE `created_at` < CURDATE()" if "created_at" in cs else ""
        # descending order + IGNORE: a forward shift never trips a unique (…, date) key on a row not yet moved
        stmts.append(f"UPDATE IGNORE `{t}` SET {sets} {where} ORDER BY `{cs[0]}` DESC;")
    stmts.append("SET FOREIGN_KEY_CHECKS=1;")
    stmts.append(f"UPDATE _seed_state SET v = '{today.isoformat()}' WHERE k = 'today';")
    if dry:
        print("\n".join(stmts))
        return
    run("\n".join(stmts))
    print(f"shifted {len(by_table)} tables by {delta} day(s): anchor {anchor} -> {today}")


if __name__ == "__main__":
    main("--dry-run" in sys.argv)
