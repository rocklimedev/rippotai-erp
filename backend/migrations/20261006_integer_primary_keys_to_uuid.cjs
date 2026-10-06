/* Run with --database NAME for a read-only preflight; --apply executes the plan.
 * Stop application writes and take an external backup before applying.
 * MySQL DDL commits implicitly: a durable journal, id map and table backups
 * make interrupted runs resumable; this is deliberately not a transaction.
 */
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const manifest = require('./20261006_integer_primary_keys_to_uuid.manifest.json');
const KEY = '20261006_integer_primary_keys_to_uuid';
const STATE = '_uuid_pk_migration_state';
const MAP = '_uuid_pk_id_map';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NAMESPACE = '6f1c2a522d0e4c1e9d8e7a11a0000001';
const ident = (name) => '`' + String(name).replace(/`/g, '``') + '`';
const backupName = (table) => '_uuid_backup_' + table;

// Same uuid5 convention as the demo seed helper; UUIDs already in use survive.
function mappedId(table, id) {
  const value = String(id);
  if (UUID.test(value)) return value;
  if (!/^\d+$/.test(value)) throw new Error(`Unsupported legacy ID in ${table}: ${value}`);
  const bytes = createHash('sha1').update(Buffer.from(NAMESPACE, 'hex')).update(`legacy:${table}:${value}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 15) | 80;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const predicate = (ref, alias = 't') => ref.where ? ` AND ${alias}.${ident(ref.where.column)} = ?` : '';
const conditionArgs = (ref) => ref.where ? [ref.where.value] : [];
const read = async (db, sql, args = []) => (await db.query(sql, args))[0];

async function metadata(db, database) {
  const columns = await read(db, `SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName,
    COLUMN_TYPE AS columnType, DATA_TYPE AS dataType, IS_NULLABLE AS nullable,
    COLUMN_KEY AS columnKey, EXTRA AS extra, CHARACTER_SET_NAME AS charset,
    COLLATION_NAME AS collation FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ?`, [database]);
  const fks = await read(db, `SELECT k.TABLE_NAME AS tableName, k.CONSTRAINT_NAME AS name,
    k.COLUMN_NAME AS columnName, k.REFERENCED_TABLE_NAME AS parent,
    k.REFERENCED_COLUMN_NAME AS parentColumn, k.ORDINAL_POSITION AS ordinal,
    r.UPDATE_RULE AS updateRule, r.DELETE_RULE AS deleteRule,
    k.REFERENCED_TABLE_SCHEMA AS parentSchema, k.TABLE_SCHEMA AS tableSchema
    FROM information_schema.KEY_COLUMN_USAGE k
    JOIN information_schema.REFERENTIAL_CONSTRAINTS r ON r.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA
      AND r.CONSTRAINT_NAME = k.CONSTRAINT_NAME AND r.TABLE_NAME = k.TABLE_NAME
    WHERE (k.TABLE_SCHEMA = ? OR k.REFERENCED_TABLE_SCHEMA = ?) AND k.REFERENCED_TABLE_NAME IS NOT NULL`, [database, database]);
  return { columns, fks };
}

function buildPlan(meta, database) {
  const column = (table, name) => meta.columns.find((c) => c.tableName === table && c.columnName === name);
  const tables = manifest.tables.filter((table) => column(table, 'id'));
  for (const table of tables) {
    if (column(table, 'id').columnKey !== 'PRI') throw new Error(`${table}.id is not a primary key`);
    if (!['tinyint', 'smallint', 'mediumint', 'int', 'bigint', 'char', 'varchar'].includes(column(table, 'id').dataType)) {
      throw new Error(`Unsupported primary key type in ${table}`);
    }
  }
  const references = manifest.references.filter((r) => column(r.table, r.column));
  for (const fk of meta.fks.filter((fk) => tables.includes(fk.parent) && fk.parentColumn === 'id')) {
    if (fk.parentSchema !== database || fk.tableSchema !== database) throw new Error('Cross-database references need a separate migration');
    if (!references.some((r) => r.table === fk.tableName && r.column === fk.columnName)) {
      references.push({ table: fk.tableName, column: fk.columnName, parent: fk.parent });
    }
  }
  for (const ref of references) {
    if (!column(ref.parent, 'id')) throw new Error(`Missing parent table ${ref.parent} for ${ref.table}.${ref.column}`);
  }
  const affected = [...tables.map((table) => ({ table, column: 'id', parent: table })), ...references];
  const changedKeys = new Set(meta.fks.filter((fk) => affected.some((c) => (c.table === fk.tableName && c.column === fk.columnName) || (c.table === fk.parent && c.column === fk.parentColumn))).map((fk) => fk.tableName + '.' + fk.name));
  const fks = meta.fks.filter((fk) => changedKeys.has(fk.tableName + '.' + fk.name));
  if (fks.some((fk) => fk.parentSchema !== database || fk.tableSchema !== database)) throw new Error('Cross-database references need a separate migration');
  const grouped = new Map();
  for (const fk of fks) {
    const key = fk.tableName + '.' + fk.name;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(fk);
  }
  const constraints = [...grouped.values()].map((parts) => {
    parts.sort((a, b) => a.ordinal - b.ordinal);
    return { ...parts[0], columns: parts.map((p) => p.columnName), parentColumns: parts.map((p) => p.parentColumn) };
  });
  return { tables, references, constraints, columns: affected.map((c) => ({ ...column(c.table, c.column), parent: c.parent })), database };
}

async function preflight(db, plan, projectMap = {}) {
  const maps = {};
  const counts = {};
  for (const table of plan.tables) {
    const rows = await read(db, `SELECT CAST(id AS CHAR) AS id FROM ${ident(table)}`);
    counts[table] = rows.length;
    maps[table] = new Map(rows.map(({ id }) => [id, mappedId(table, id)]));
    if (new Set(maps[table].values()).size !== rows.length) throw new Error(`ID collision in ${table}`);
  }
  const projects = new Set((await read(db, 'SELECT CAST(id AS CHAR) AS id FROM projects')).map((r) => r.id));
  for (const [old, value] of Object.entries(projectMap)) {
    if (!/^\d+$/.test(old) || !UUID.test(value) || !projects.has(value)) throw new Error(`Invalid project mapping for legacy ID ${old}`);
  }
  maps.projects = new Map([...projects].map((id) => [id, id]));
  Object.entries(projectMap).forEach(([old, value]) => maps.projects.set(old, value));
  for (const ref of plan.references) {
    if (!maps[ref.parent]) {
      maps[ref.parent] = new Map((await read(db, `SELECT CAST(id AS CHAR) AS id FROM ${ident(ref.parent)}`)).map((r) => [r.id, r.id]));
    }
    const values = await read(db, `SELECT DISTINCT CAST(t.${ident(ref.column)} AS CHAR) AS id FROM ${ident(ref.table)} t
      WHERE t.${ident(ref.column)} IS NOT NULL${predicate(ref)}`, conditionArgs(ref));
    const missing = values.filter(({ id }) => !maps[ref.parent].has(id));
    if (missing.length) throw new Error(`Unmapped reference ${ref.table}.${ref.column}: ${missing.slice(0, 5).map((r) => r.id).join(', ')}${ref.parent === 'projects' ? '; supply a verified --project-map JSON file' : ''}`);
  }
  const affectedTables = [...new Set([...plan.tables, ...plan.references.map((r) => r.table)])];
  for (const table of affectedTables) {
    if (counts[table] === undefined) counts[table] = Number((await read(db, `SELECT COUNT(*) AS n FROM ${ident(table)}`))[0].n);
  }
  return { ...plan, counts, mapping: Object.entries(maps).flatMap(([table, entries]) => [...entries].filter(([old, value]) => old !== value).map(([old, value]) => ({ table, old, value }))) };
}

async function verify(db, plan, checkCounts = true) {
  for (const [table, expected] of checkCounts ? Object.entries(plan.counts) : []) {
    const count = Number((await read(db, `SELECT COUNT(*) AS n FROM ${ident(table)}`))[0].n);
    if (count !== expected) throw new Error(`Row count changed in ${table}: ${expected} -> ${count}`);
  }
  for (const table of plan.tables) {
    const rows = await read(db, `SELECT CAST(id AS CHAR) AS id FROM ${ident(table)}`);
    if (rows.some((r) => !UUID.test(r.id))) throw new Error(`Non-UUID primary keys remain in ${table}`);
  }
  for (const ref of plan.references) {
    const missing = await read(db, `SELECT COUNT(*) AS n FROM ${ident(ref.table)} t LEFT JOIN ${ident(ref.parent)} p
      ON BINARY t.${ident(ref.column)} = BINARY p.id
      WHERE t.${ident(ref.column)} IS NOT NULL AND p.id IS NULL${predicate(ref)}`, conditionArgs(ref));
    if (Number(missing[0].n)) throw new Error(`Orphaned reference ${ref.table}.${ref.column}`);
  }
}

async function apply(db, plan) {
  // Backups are made before any source DDL. Their PKs and indexes are retained.
  for (const [table, expected] of Object.entries(plan.counts)) {
    const backup = backupName(table);
    const exists = await read(db, 'SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?', [plan.database, backup]);
    if (!exists.length) {
      await db.query(`CREATE TABLE ${ident(backup)} LIKE ${ident(table)}`);
      await db.query(`INSERT INTO ${ident(backup)} SELECT * FROM ${ident(table)}`);
    }
    const count = Number((await read(db, `SELECT COUNT(*) AS n FROM ${ident(backup)}`))[0].n);
    if (count !== expected) throw new Error(`Backup ${backup} is incomplete; restore it from the external backup before resuming`);
  }
  for (const fk of plan.constraints) {
    const exists = await read(db, 'SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?', [plan.database, fk.tableName, fk.name]);
    if (exists.length) await db.query(`ALTER TABLE ${ident(fk.tableName)} DROP FOREIGN KEY ${ident(fk.name)}`);
  }
  const uniqueColumns = [...new Map(plan.columns.map((c) => [c.tableName + '.' + c.columnName, c])).values()];
  for (const c of uniqueColumns) {
    // Reuse the parent's collation to preserve foreign key compatibility.
    const parent = (await metadata(db, plan.database)).columns.find((col) => col.tableName === c.parent && col.columnName === 'id');
    const charset = parent?.charset || c.charset || 'utf8mb4';
    const collation = parent?.collation || c.collation || 'utf8mb4_unicode_ci';
    await db.query(`ALTER TABLE ${ident(c.tableName)} MODIFY ${ident(c.columnName)} CHAR(36)
      CHARACTER SET ${ident(charset)} COLLATE ${ident(collation)} ${c.nullable === 'YES' ? 'NULL DEFAULT NULL' : 'NOT NULL'}`);
  }
  // Update references before parent IDs. Persisted maps make replay a no-op.
  for (const ref of plan.references) {
    await db.query(`UPDATE ${ident(ref.table)} t JOIN ${ident(MAP)} m
      ON m.table_name = ? AND BINARY CAST(t.${ident(ref.column)} AS CHAR) = BINARY m.old_id
      SET t.${ident(ref.column)} = m.uuid_id WHERE 1=1${predicate(ref)}`, [ref.parent, ...conditionArgs(ref)]);
  }
  for (const table of plan.tables) {
    await db.query(`UPDATE ${ident(table)} t JOIN ${ident(MAP)} m ON m.table_name = ? AND BINARY CAST(t.id AS CHAR) = BINARY m.old_id SET t.id = m.uuid_id`, [table]);
  }
  await verify(db, plan);
  for (const fk of plan.constraints) {
    await db.query(`ALTER TABLE ${ident(fk.tableName)} ADD CONSTRAINT ${ident(fk.name)}
      FOREIGN KEY (${fk.columns.map(ident).join(', ')}) REFERENCES ${ident(fk.parent)} (${fk.parentColumns.map(ident).join(', ')})
      ON UPDATE ${fk.updateRule} ON DELETE ${fk.deleteRule}`);
  }
  await db.query(`UPDATE ${ident(STATE)} SET status = 'complete' WHERE migration_key = ?`, [KEY]);
}

async function run(db, database, options = {}) {
  const meta = await metadata(db, database);
  const stateExists = meta.columns.some((c) => c.tableName === STATE);
  let saved;
  if (stateExists) saved = (await read(db, `SELECT status, plan FROM ${ident(STATE)} WHERE migration_key = ?`, [KEY]))[0];
  if (saved?.status === 'complete') {
    const plan = typeof saved.plan === 'string' ? JSON.parse(saved.plan) : saved.plan;
    await verify(db, plan, false);
    return { status: 'already-complete', tables: plan.tables };
  }
  const plan = saved ? (typeof saved.plan === 'string' ? JSON.parse(saved.plan) : saved.plan) : await preflight(db, buildPlan(meta, database), options.projectMap);
  if (!options.apply) return { status: saved ? 'resume-required' : 'ready', tables: plan.tables, references: plan.references, counts: plan.counts, mappings: plan.mapping.length };
  await db.query(`CREATE TABLE IF NOT EXISTS ${ident(STATE)} (migration_key VARCHAR(100) PRIMARY KEY, status VARCHAR(20) NOT NULL, plan LONGTEXT NOT NULL)`);
  await db.query(`CREATE TABLE IF NOT EXISTS ${ident(MAP)} (table_name VARCHAR(64) NOT NULL, old_id VARCHAR(36) NOT NULL, uuid_id CHAR(36) NOT NULL, PRIMARY KEY (table_name, old_id), KEY (table_name, uuid_id))`);
  // Prepare mappings atomically before source DDL, including when replaying a journal.
  await db.beginTransaction();
  try {
    for (const entry of plan.mapping) {
      const existing = await read(db, `SELECT uuid_id FROM ${ident(MAP)} WHERE table_name = ? AND old_id = ?`, [entry.table, entry.old]);
      if (existing.length && existing[0].uuid_id !== entry.value) throw new Error(`Conflicting saved mapping for ${entry.table}.${entry.old}`);
      if (!existing.length) await db.query(`INSERT INTO ${ident(MAP)} (table_name, old_id, uuid_id) VALUES (?, ?, ?)`, [entry.table, entry.old, entry.value]);
    }
    if (!saved) await db.query(`INSERT INTO ${ident(STATE)} (migration_key, status, plan) VALUES (?, 'applying', ?)`, [KEY, JSON.stringify(plan)]);
    await db.commit();
  } catch (error) { await db.rollback(); throw error; }
  await apply(db, plan);
  return { status: 'complete', tables: plan.tables, backups: Object.keys(plan.counts).map(backupName) };
}

async function main() {
  const args = process.argv.slice(2);
  const value = (name) => args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
  const database = value('--database');
  if (!database || database.startsWith('--')) throw new Error('Specify --database NAME explicitly. Default mode is read-only; add --apply to migrate.');
  const mysql = require('mysql2/promise');
  const projectFile = value('--project-map');
  const projectMap = projectFile ? JSON.parse(fs.readFileSync(path.resolve(projectFile), 'utf8')) : {};
  const db = await mysql.createConnection({ host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT) || 3306, user: process.env.DB_USER, password: process.env.DB_PASS, database, supportBigNumbers: true, bigNumberStrings: true });
  let locked = false;
  try {
    if (args.includes('--apply')) {
      locked = Number((await read(db, 'SELECT GET_LOCK(?, 0) AS acquired', [database + ':' + KEY]))[0].acquired) === 1;
      if (!locked) throw new Error('Another UUID migration is already running');
    }
    const result = await run(db, database, { apply: args.includes('--apply'), projectMap });
    console.log(JSON.stringify(result, null, 2));
  } finally {
    if (locked) await db.query('SELECT RELEASE_LOCK(?)', [database + ':' + KEY]);
    await db.end();
  }
}

module.exports = { mappedId, buildPlan, preflight, verify, run, manifest, UUID };
if (require.main === module) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
