// Read-only audit. Default: inspect the generated migration. --live also reads
// the configured ERP database. Never inserts, repairs, deletes or grants data.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function migrationPermissions(sql) {
  return [
    ...sql.matchAll(/VALUES \(UUID\(\), '([^']+)', '([^']+)', '([^']+)'/g),
  ].map(([, name, resource, action]) => ({ name, resource, action }));
}
function repeated(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts]
    .filter(([, count]) => count > 1)
    .map(([value, count]) => ({ value, count }));
}
async function audit() {
  const expected = migrationPermissions(
    fs.readFileSync(
      path.join(root, 'migrations/20261010_staff_route_permissions.sql'),
      'utf8',
    ),
  );
  const report = {
    migration: {
      inserts: expected.length,
      duplicate_names: repeated(expected.map((p) => p.name)),
      duplicate_capabilities: repeated(
        expected.map((p) => `${p.resource}:${p.action}`),
      ),
    },
  };
  if (!process.argv.includes('--live')) return report;
  const config = require('dotenv').parse(
    fs.readFileSync(path.join(root, '.env')),
  );
  const env = { ...config, ...process.env };
  const mysql = require('mysql2/promise');
  const connection = await mysql.createConnection({
    host: env.DB_HOST || 'localhost',
    port: Number(env.DB_PORT) || 3306,
    user: env.DB_USER,
    password: env.DB_PASS,
    database: 'spsyn8lm_rippotai_erp',
    connectTimeout: 15000,
  });
  try {
    await connection.query('START TRANSACTION READ ONLY');
    const select = async (sql) => (await connection.query(sql))[0];
    const indexes =
      await select(`SELECT TABLE_NAME AS table_name, INDEX_NAME AS index_name,
      GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columns_list
      FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME IN ('permissions', 'role_permissions') AND NON_UNIQUE = 0
      GROUP BY TABLE_NAME, INDEX_NAME ORDER BY TABLE_NAME, INDEX_NAME`);
    const permissions = await select(
      'SELECT id, name, resource, action FROM permissions',
    );
    const capabilities = new Set(
      permissions.map((p) => `${p.resource}:${p.action}`),
    );
    report.database = {
      permission_count: permissions.length,
      unique_indexes: indexes,
      duplicate_names: await select(
        'SELECT name, COUNT(*) AS count FROM permissions GROUP BY name HAVING COUNT(*) > 1',
      ),
      duplicate_capabilities: await select(
        'SELECT resource, action, COUNT(*) AS count FROM permissions GROUP BY resource, action HAVING COUNT(*) > 1',
      ),
      duplicate_role_grants: await select(
        'SELECT role_id, permission_id, COUNT(*) AS count FROM role_permissions GROUP BY role_id, permission_id HAVING COUNT(*) > 1',
      ),
      duplicate_role_capabilities:
        await select(`SELECT rp.role_id, p.resource, p.action, COUNT(*) AS count
        FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id
        GROUP BY rp.role_id, p.resource, p.action HAVING COUNT(*) > 1`),
      orphan_grants:
        await select(`SELECT COUNT(*) AS count FROM role_permissions rp
        LEFT JOIN roles r ON r.id = rp.role_id LEFT JOIN permissions p ON p.id = rp.permission_id
        WHERE r.id IS NULL OR p.id IS NULL`),
      name_capability_mismatches: permissions
        .filter((p) => p.name !== `${p.resource}:${p.action}`)
        .map(({ name, resource, action }) => ({ name, resource, action })),
      missing_catalogue_capabilities: expected
        .filter((p) => !capabilities.has(`${p.resource}:${p.action}`))
        .map((p) => p.name),
    };
    const unique = (table, columns) =>
      indexes.some(
        (i) =>
          i.table_name === table &&
          i.columns_list.split(',').sort().join(',') ===
            columns.split(',').sort().join(','),
      );
    report.database.rerun_unique_protection = {
      permission_name: unique('permissions', 'name'),
      permission_resource_action: unique('permissions', 'resource,action'),
      role_permission_pair: unique('role_permissions', 'role_id,permission_id'),
    };
    const roles = await select(
      "SELECT id, name FROM roles WHERE name IN ('ADMIN', 'SUPERADMIN')",
    );
    const grants =
      await select(`SELECT rp.role_id, p.resource, p.action FROM role_permissions rp
      JOIN permissions p ON p.id = rp.permission_id JOIN roles r ON r.id = rp.role_id
      WHERE r.name IN ('ADMIN', 'SUPERADMIN')`);
    report.database.admin_catalogue_coverage = roles.map((role) => {
      const granted = new Set(
        grants
          .filter((g) => g.role_id === role.id)
          .map((g) => `${g.resource}:${g.action}`),
      );
      return {
        role: role.name,
        granted_catalogue_count: expected.filter((p) =>
          granted.has(`${p.resource}:${p.action}`),
        ).length,
        missing: expected
          .filter((p) => !granted.has(`${p.resource}:${p.action}`))
          .map((p) => p.name),
      };
    });
    return report;
  } finally {
    await connection.query('ROLLBACK').catch(() => {});
    await connection.end();
  }
}
if (require.main === module)
  audit()
    .then((report) => console.log(JSON.stringify(report, null, 2)))
    .catch((error) => {
      console.error(
        `Permission audit failed: ${error.code || error.name}. No database changes were made.`,
      );
      process.exitCode = 1;
    });
module.exports = { migrationPermissions, repeated };
