#!/usr/bin/env python3
"""Local-only: bring the live database up to the structure in a reference schema dump.

Usage:  python3 scripts/local-schema-sync.py ../db/inos_schema_YYYY-MM-DD.sql [--dry]

- Loads the dump into a throw-away database `inos_schema_ref` (database name rewritten).
- Adds to the live DB (DB_NAME, default spsyn8lm_rippotai_erp) only what is missing:
    * tables            (copied from the reference CREATE TABLE, foreign keys removed)
    * columns           (ALTER TABLE ... ADD COLUMN with the reference definition)
    * roles, apps, permissions, and role->permission / role->app grants (matched by name)
- Never drops, renames or modifies existing tables, columns or rows.
Uses the `mysql` command line client with the current user's socket login.
"""
import os, re, subprocess, sys, tempfile

LIVE = os.environ.get("DB_NAME", "spsyn8lm_rippotai_erp")
REF = "inos_schema_ref"
DRY = "--dry" in sys.argv


def mysql(sql, db=None, check=True):
    cmd = ["mysql", "-N", "-B", "--default-character-set=utf8mb4"] + ([db] if db else [])
    r = subprocess.run(cmd, input=sql, capture_output=True, text=True)
    if check and r.returncode != 0:
        raise RuntimeError(r.stderr.strip()[:500])
    return [line.split("\t") for line in r.stdout.splitlines() if line]


def load_reference(dump):
    sql = open(dump, encoding="utf-8").read()
    sql = re.sub(r"CREATE DATABASE IF NOT EXISTS `[^`]+`[^;]*;", "", sql)
    sql = re.sub(r"USE `[^`]+`;", "", sql)
    mysql(f"DROP DATABASE IF EXISTS {REF}; CREATE DATABASE {REF} CHARACTER SET utf8 COLLATE utf8_unicode_ci;")
    with tempfile.NamedTemporaryFile("w", suffix=".sql", delete=False, encoding="utf-8") as f:
        f.write("SET FOREIGN_KEY_CHECKS=0;\n" + sql)
        path = f.name
    r = subprocess.run(f"mysql --default-character-set=utf8mb4 {REF} < '{path}'", shell=True, capture_output=True, text=True)
    os.unlink(path)
    if r.returncode != 0:
        raise RuntimeError("reference import failed: " + r.stderr[:500])


def columns(db):
    rows = mysql(f"SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='{db}'")
    out = {}
    for t, c in rows:
        out.setdefault(t, set()).add(c)
    return out


def column_def(table, col):
    """Column definition as written in the reference SHOW CREATE TABLE."""
    ddl = mysql(f"SHOW CREATE TABLE `{table}`", REF)[0][1].replace("\\n", "\n")
    for line in ddl.splitlines():
        line = line.strip().rstrip(",")
        if line.startswith(f"`{col}` "):
            return line
    return None


def run(stmt, label):
    print(("[dry] " if DRY else "") + label)
    if not DRY:
        try:
            mysql("SET FOREIGN_KEY_CHECKS=0; " + stmt, LIVE)
        except RuntimeError as e:
            print("   ! skipped:", str(e)[:200])


def main():
    if len(sys.argv) < 2 or sys.argv[1].startswith("--"):
        sys.exit(__doc__)
    load_reference(sys.argv[1])
    ref, live = columns(REF), columns(LIVE)

    # 1. missing tables
    for t in sorted(set(ref) - set(live)):
        ddl = mysql(f"SHOW CREATE TABLE `{t}`", REF)[0][1].replace("\\n", "\n")
        ddl = re.sub(r",\s*CONSTRAINT `[^`]+` FOREIGN KEY [^\n]*", "", ddl)
        ddl = ddl.replace("CREATE TABLE", "CREATE TABLE IF NOT EXISTS", 1)
        run(ddl, f"create table {t}")

    # 2. missing columns on existing tables
    for t in sorted(set(ref) & set(live)):
        for c in sorted(ref[t] - live[t]):
            # skip camelCase duplicates of a snake_case column the table already has (models use underscored names)
            if re.sub(r"(?<!^)([A-Z])", r"_\1", c).lower() in live[t]:
                print(f"skip {t}.{c} (already present as snake_case)")
                continue
            d = column_def(t, c)
            if d:
                run(f"ALTER TABLE `{t}` ADD COLUMN {d}", f"add column {t}.{c}")

    # 3. roles / apps / permissions by name, then grants
    for table, key in (("roles", "name"), ("apps", "code" if "code" in ref.get("apps", set()) else "name"), ("permissions", "name")):
        if table not in live or table not in ref:
            continue
        cols = sorted(ref[table] & live[table])
        collist = ", ".join(f"`{c}`" for c in cols)
        run(f"INSERT IGNORE INTO `{table}` ({collist}) SELECT {collist} FROM {REF}.`{table}` r "
            f"WHERE NOT EXISTS (SELECT 1 FROM `{table}` l WHERE BINARY l.`{key}` = BINARY r.`{key}`) "
            + (f"AND NOT EXISTS (SELECT 1 FROM `{table}` l2 WHERE l2.id = r.id)" if "id" in cols else ""),
            f"add missing {table}")
    if "role_permissions" in live:
        run(f"INSERT IGNORE INTO role_permissions (role_id, permission_id) "
            f"SELECT lr.id, lp.id FROM {REF}.role_permissions rp "
            f"JOIN {REF}.roles rr ON rr.id = rp.role_id JOIN {REF}.permissions pp ON pp.id = rp.permission_id "
            f"JOIN roles lr ON BINARY lr.name = BINARY rr.name JOIN permissions lp ON BINARY lp.name = BINARY pp.name",
            "grant reference permissions to matching roles")
    if "role_apps" in live and "role_apps" in ref and {"role_id", "app_code"} <= (ref["role_apps"] & live["role_apps"]):
        run(f"INSERT IGNORE INTO role_apps (role_id, app_code) SELECT lr.id, ra.app_code FROM {REF}.role_apps ra "
            f"JOIN {REF}.roles rr ON rr.id = ra.role_id JOIN roles lr ON BINARY lr.name = BINARY rr.name "
            f"JOIN apps la ON BINARY la.code = BINARY ra.app_code",
            "grant reference app access to matching roles")

    if not DRY:
        mysql(f"DROP DATABASE IF EXISTS {REF}")
    print("schema sync done")


if __name__ == "__main__":
    main()
