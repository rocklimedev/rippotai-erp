const test = require('node:test');
const assert = require('node:assert/strict');
const { mappedId, buildPlan, preflight, run, UUID } = require('./20261006_integer_primary_keys_to_uuid.cjs');
const database = 'uuid_test';
const uuid = 'b3edb3ad-51f0-4d4b-a1c2-6e8a9b10c111';
const col = (tableName, columnName, extra = {}) => ({ tableName, columnName, dataType: 'int', columnType: 'int', nullable: 'NO', columnKey: columnName === 'id' ? 'PRI' : '', ...extra });
const fk = (tableName, columnName, parent, extra = {}) => ({ tableName, columnName, parent, parentColumn: 'id', tableSchema: database, parentSchema: database, name: 'fk_' + tableName, ordinal: 1, updateRule: 'CASCADE', deleteRule: 'RESTRICT', ...extra });

test('legacy IDs become stable UUIDv5 values while existing UUIDs survive', () => {
  assert.match(mappedId('teams', '1'), UUID);
  assert.equal(mappedId('teams', 1), mappedId('teams', '1'));
  assert.notEqual(mappedId('teams', 1), mappedId('steps', 1));
  assert.equal(mappedId('teams', uuid), uuid);
  assert.throws(() => mappedId('teams', 'not-an-id'), /Unsupported legacy ID/);
  // Verified with Python uuid.uuid5 using the same seed namespace and key.
  assert.equal(mappedId('teams', 1), 'a13e7b39-952a-5a15-97f4-d6868fb3ce75');
});

test('plan discovers undeclared database references and preserves composite FK structure', () => {
  const meta = { columns: [col('teams', 'id'), col('extra', 'team_id'), col('extra', 'tenant_id')],
    fks: [fk('extra', 'team_id', 'teams'), fk('extra', 'tenant_id', 'teams', { ordinal: 2, parentColumn: 'tenant_id' })] };
  const plan = buildPlan(meta, database);
  assert.deepEqual(plan.tables, ['teams']);
  assert.deepEqual(plan.references, [{ table: 'extra', column: 'team_id', parent: 'teams' }]);
  assert.deepEqual(plan.constraints[0].columns, ['team_id', 'tenant_id']);
  assert.deepEqual(plan.constraints[0].parentColumns, ['id', 'tenant_id']);
  assert.equal(plan.constraints[0].deleteRule, 'RESTRICT');
});

test('plan refuses references from another database', () => {
  assert.throws(() => buildPlan({ columns: [col('teams', 'id')], fks: [fk('foreign_table', 'team_id', 'teams', { tableSchema: 'another_db' })] }, database), /Cross-database/);
});

function fixture(values = ['1'], projectValues = []) {
  const calls = [];
  const db = { query: async (sql, args = []) => {
    calls.push({ sql, args });
    if (sql.includes('information_schema.COLUMNS')) return [[col('teams', 'id', { dataType: 'char' }), col('rfis', 'routed_to_team_id'), col('gate_logs', 'project_id'), col('projects', 'id')]];
    if (sql.includes('information_schema.KEY_COLUMN_USAGE')) return [[]];
    if (sql.includes('SELECT CAST(id AS CHAR) AS id FROM `teams`')) return [[{ id: '1' }, { id: uuid }]];
    if (sql.includes('FROM projects')) return [[{ id: uuid }]];
    if (sql.includes('SELECT DISTINCT') && sql.includes('`rfis`')) return [values.map((id) => ({ id }))];
    if (sql.includes('SELECT DISTINCT') && sql.includes('`gate_logs`')) return [projectValues.map((id) => ({ id }))];
    if (sql.includes('SELECT COUNT')) return [[{ n: 1 }]];
    throw new Error('Unexpected SQL: ' + sql);
  } };
  return { db, calls };
}

test('read-only run includes both integer and UUID teams without issuing writes', async () => {
  const { db, calls } = fixture(['1', uuid]);
  const result = await run(db, database);
  assert.equal(result.status, 'ready');
  assert.equal(result.mappings, 1);
  assert.equal(result.counts.teams, 2);
  assert(calls.every(({ sql }) => /^SELECT/i.test(sql)));
});

test('orphaned child IDs abort before any schema changes', async () => {
  const { db, calls } = fixture(['99']);
  await assert.rejects(run(db, database), /Unmapped reference rfis.routed_to_team_id: 99/);
  assert(calls.every(({ sql }) => /^SELECT/i.test(sql)));
});

test('legacy project references require an explicit verified mapping', async () => {
  const { db } = fixture(['1'], ['7']);
  const plan = buildPlan({ columns: [col('teams', 'id'), col('gate_logs', 'project_id'), col('projects', 'id')], fks: [] }, database);
  await assert.rejects(preflight(db, plan), /project-map/);
  const ready = await preflight(db, plan, { '7': uuid });
  assert(ready.mapping.some((m) => m.table === 'projects' && m.old === '7' && m.value === uuid));
  await assert.rejects(preflight(db, plan, { '7': 'not-a-uuid' }), /Invalid project mapping/);
});

test('resuming journals backs up before DDL, remaps both sides and restores FK rules', async () => {
  const columns = [col('teams', 'id'), col('children', 'team_id')];
  const relation = fk('children', 'team_id', 'teams');
  const base = buildPlan({ columns, fks: [relation] }, database);
  const plan = { ...base, counts: { teams: 1, children: 1 }, mapping: [{ table: 'teams', old: '1', value: mappedId('teams', 1) }] };
  const calls = [];
  let parentId = '1';
  let childId = '1';
  const db = {
    beginTransaction: async () => calls.push('BEGIN'),
    commit: async () => calls.push('COMMIT'),
    rollback: async () => calls.push('ROLLBACK'),
    query: async (sql, args = []) => {
      calls.push(sql);
      if (sql.includes('information_schema.COLUMNS')) return [[...columns, col('_uuid_pk_migration_state', 'migration_key')]];
      if (sql.includes('information_schema.KEY_COLUMN_USAGE')) return [[relation]];
      if (sql.includes('SELECT status, plan')) return [[{ status: 'applying', plan: JSON.stringify(plan) }]];
      if (sql.includes('SELECT uuid_id')) return [[{ uuid_id: mappedId('teams', 1) }]];
      if (sql.includes('information_schema.TABLES')) return [[]];
      if (sql.includes('information_schema.TABLE_CONSTRAINTS')) return [[{}]];
      if (sql.includes('SELECT COUNT')) {
        if (sql.includes('LEFT JOIN')) return [[{ n: parentId === childId && UUID.test(parentId) ? 0 : 1 }]];
        return [[{ n: 1 }]];
      }
      if (sql.startsWith('SELECT CAST(id')) return [[{ id: parentId }]];
      if (sql.startsWith('UPDATE `children`')) childId = mappedId('teams', 1);
      if (sql.startsWith('UPDATE `teams`')) parentId = mappedId('teams', 1);
      return [{ affectedRows: 1 }];
    },
  };
  const result = await run(db, database, { apply: true });
  assert.equal(result.status, 'complete');
  assert.equal(parentId, childId);
  const firstDDL = calls.findIndex((sql) => sql.startsWith('ALTER TABLE'));
  assert(calls.findIndex((sql) => sql.startsWith('INSERT INTO `_uuid_backup_children`')) < firstDDL);
  assert(calls.indexOf('COMMIT') < firstDDL);
  assert(calls.some((sql) => sql.includes('ADD CONSTRAINT') && sql.includes('ON UPDATE CASCADE ON DELETE RESTRICT')));
  assert(calls.at(-1).includes("status = 'complete'"));
});

test('incomplete backups abort before any source DDL', async () => {
  const base = buildPlan({ columns: [col('teams', 'id')], fks: [] }, database);
  const plan = { ...base, counts: { teams: 2 }, mapping: [] };
  const calls = [];
  const db = {
    beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {},
    query: async (sql) => {
      calls.push(sql);
      if (sql.includes('information_schema.COLUMNS')) return [[col('teams', 'id'), col('_uuid_pk_migration_state', 'migration_key')]];
      if (sql.includes('information_schema.KEY_COLUMN_USAGE')) return [[]];
      if (sql.includes('SELECT status, plan')) return [[{ status: 'applying', plan: JSON.stringify(plan) }]];
      if (sql.includes('information_schema.TABLES')) return [[{}]];
      if (sql.includes('SELECT COUNT')) return [[{ n: 0 }]];
      return [{}];
    },
  };
  await assert.rejects(run(db, database, { apply: true }), /backup.*incomplete/i);
  assert(!calls.some((sql) => sql.startsWith('ALTER TABLE')));
});
