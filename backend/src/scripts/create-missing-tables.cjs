// Local-only helper: create DB tables that exist as Sequelize models but not in the database.
// Never alters existing tables. Usage (from backend/): node create-missing-tables.cjs [--dry]
require('dotenv').config();
const fs = require('fs'),
  path = require('path');
const { Sequelize, Model } = require('sequelize-typescript');
const dry = process.argv.includes('--dry');
function walk(d, out = []) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    const s = fs.statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (/\.(model|entity)\.js$/.test(f)) out.push(p);
  }
  return out;
}
(async () => {
  const files = walk(path.resolve('dist/src'));
  const models = new Set();
  for (const f of files) {
    let m;
    try {
      m = require(path.resolve(f));
    } catch (e) {
      console.log('skip', f, e.message);
      continue;
    }
    for (const v of Object.values(m))
      if (typeof v === 'function' && v.prototype instanceof Model)
        models.add(v);
  }
  const db = process.env.DB_NAME || 'spsyn8lm_rippotai_erp';
  const sq = new Sequelize({
    dialect: 'mysql',
    host: process.env.DB_HOST || '127.0.0.1',
    port: +process.env.DB_PORT || 3306,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: db,
    logging: false,
    define: { timestamps: true, underscored: true },
  });
  sq.addModels([...models]);
  const [rows] = await sq.query(
    `SELECT table_name t FROM information_schema.tables WHERE table_schema = '${db}'`,
  );
  const have = new Set(rows.map((r) => (r.t || r.TABLE_NAME).toLowerCase()));
  let todo = [...models].filter(
    (m) => !have.has(String(m.getTableName()).toLowerCase()),
  );
  console.log(`models: ${models.size}, missing tables: ${todo.length}`);
  todo.forEach((m) => console.log('  -', m.getTableName()));
  if (dry) {
    await sq.close();
    return;
  }
  for (let pass = 1; pass <= 4 && todo.length; pass++) {
    const failed = [];
    for (const m of todo) {
      let ok = false,
        last;
      for (const [charset, collate] of [
        ['utf8', 'utf8_unicode_ci'],
        ['utf8mb4', 'utf8mb4_unicode_ci'],
        ['utf8mb4', 'utf8mb4_general_ci'],
        ['utf8', 'utf8_general_ci'],
      ]) {
        m.options.charset = charset;
        m.options.collate = collate;
        try {
          await m.sync();
          console.log('created', m.getTableName(), `(${collate})`);
          ok = true;
          break;
        } catch (e) {
          last = e;
        }
      }
      if (!ok && pass >= 2) {
        // Last resort: create from the model's own CREATE TABLE sql, without DB-level foreign keys
        // and with id columns in the same encoding as the existing tables. App-level associations still work.
        try {
          const qg = sq.getQueryInterface().queryGenerator,
            attrs = {};
          for (const [k, a] of Object.entries(m.getAttributes()))
            attrs[a.field || k] = a;
          let sql = qg.createTableQuery(
            m.getTableName(),
            qg.attributesToSQL(attrs, {
              context: 'createTable',
              table: m.getTableName(),
            }),
            m.options,
          );
          sql = sql
            .replace(/ BINARY/g, '')
            .replace(
              /, FOREIGN KEY \(`[^`]+`\) REFERENCES `[^`]+` \(`[^`]+`\)( ON DELETE [A-Z ]+?)?( ON UPDATE [A-Z ]+?)?(?=[,)])/g,
              '',
            )
            .replace(
              /`([a-z]+[A-Z][A-Za-z]*)`/g,
              (_, n) =>
                '`' + n.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase()) + '`',
            )
            .replace(
              /\) ENGINE=InnoDB;?$/,
              ') ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;',
            );
          await sq.query(sql);
          console.log('created (no FK)', m.getTableName());
          ok = true;
        } catch (e) {
          last = e;
        }
      }
      if (!ok) {
        failed.push(m);
        if (pass === 4)
          console.log(
            'FAILED',
            m.getTableName(),
            '-',
            (last.parent && last.parent.sqlMessage) || last.message,
          );
      }
    }
    todo = failed;
  }
  await sq.close();
  console.log(
    todo.length
      ? `${todo.length} table(s) could not be created`
      : 'all missing tables created',
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
