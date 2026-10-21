/* Inventory first; migration consumes an explicitly reviewed inventory.
 * Credentials/configuration come from the environment. Run with writers stopped.
 * Reports contain confidential URLs: keep them outside version control.
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const mysql = require('mysql2/promise');
const SftpClient = require('ssh2-sftp-client');
const SCOPES = new Set([
  'documents',
  'drawings',
  'signatures',
  'handover',
  'recce',
  'briefs',
  'reports',
  'snags',
]);
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
const ident = (value) => '`' + value.replaceAll('`', '``') + '`';
const keyPattern = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
const protectedScope = (filename) => {
  const match = /^private-([a-z]+)-[0-9a-f-]{36}(?:\.[a-zA-Z0-9]{1,16})?$/.exec(
    filename,
  );
  return match && SCOPES.has(match[1]) ? match[1] : undefined;
};

function guess(table, column) {
  if (/signature/.test(table + column)) return 'signatures';
  if (/drawing/.test(table)) return 'drawings';
  if (/handover/.test(table)) return 'handover';
  if (/recce|reki/.test(table)) return 'recce';
  if (/brief/.test(table)) return 'briefs';
  if (/snag/.test(table)) return 'snags';
  if (/daily.*report/.test(table)) return 'reports';
  return 'documents';
}

async function main() {
  const [mode, reportPath, flag] = process.argv.slice(2);
  if (
    !['inventory', 'migrate'].includes(mode) ||
    !reportPath ||
    (mode === 'migrate' && flag !== '--apply')
  ) {
    throw new Error(
      'Use inventory <report.json> or migrate <reviewed-report.json> --apply',
    );
  }
  if (!process.env.DB_NAME || !process.env.CDN_BASE_URL)
    throw new Error('DB_NAME and CDN_BASE_URL are required');
  const base = process.env.CDN_BASE_URL.replace(/\/$/, '');
  const publicRoot = process.env.CDN_UPLOAD_PATH || '/tmp/inos-cdn';
  const remote = !!process.env.CDN_HOST;
  const sftp = remote ? new SftpClient() : null;
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    connectTimeout: 15000,
  });
  try {
    if (sftp)
      await sftp.connect({
        host: process.env.CDN_HOST,
        port: Number(process.env.CDN_PORT || 22),
        username: process.env.CDN_USERNAME,
        password: process.env.CDN_PASSWORD,
      });
    const listing = sftp
      ? await sftp.list(publicRoot)
      : await fs.readdir(publicRoot, { withFileTypes: true });
    const files = listing
      .filter((e) => (sftp ? e.type === '-' : e.isFile()))
      .map((e) => ({
        filename: e.name,
        extension: path.extname(e.name).toLowerCase(),
        url: `${base}/${e.name}`,
        decision: protectedScope(e.name) ? 'private' : 'review',
        scope: protectedScope(e.name) || 'documents',
        references: [],
      }));
    const known = new Map(files.map((f) => [f.filename, f]));
    const [schema] = await db.query(
      'SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, COLUMN_KEY FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME, ORDINAL_POSITION',
      [process.env.DB_NAME],
    );
    const tables = new Map();
    for (const col of schema) {
      if (!tables.has(col.TABLE_NAME)) tables.set(col.TABLE_NAME, []);
      tables.get(col.TABLE_NAME).push(col);
    }
    const warnings = [];
    const externalLinks = [];
    async function scan(visit) {
      for (const [table, cols] of tables) {
        const primary = cols
          .filter((c) => c.COLUMN_KEY === 'PRI')
          .map((c) => c.COLUMN_NAME);
        const text = cols
          .filter((c) =>
            /^(varchar|char|text|mediumtext|longtext|tinytext|json)$/.test(
              c.DATA_TYPE,
            ),
          )
          .map((c) => c.COLUMN_NAME);
        if (!text.length) continue;
        if (!primary.length) {
          warnings.push(`${table}: no primary key; requires manual inventory`);
          continue;
        }
        for (let offset = 0; ; offset += 250) {
          const selected = [...new Set([...primary, ...text])];
          const [rows] = await db.query(
            `SELECT ${selected.map(ident).join(',')} FROM ${ident(table)} ORDER BY ${primary.map(ident).join(',')} LIMIT 250 OFFSET ${offset}`,
          );
          for (const row of rows)
            for (const column of text) {
              const value =
                row[column] == null
                  ? ''
                  : typeof row[column] === 'string'
                    ? row[column]
                    : JSON.stringify(row[column]);
              await visit(
                table,
                Object.fromEntries(primary.map((k) => [k, row[k]])),
                column,
                value,
              );
            }
          if (rows.length < 250) break;
        }
      }
    }
    if (mode === 'inventory') {
      await scan(async (table, pk, column, value) => {
        const names = new Set();
        // Include links whose backing object is missing as well as stored filenames.
        for (const match of value.matchAll(/https?:\/\/[^\s"'<>\\]+/g)) {
          const filename = new URL(match[0]).pathname.split('/').pop();
          if (match[0].startsWith(base + '/') || known.has(filename)) {
            if (keyPattern.test(filename) && !filename.includes('..')) {
              names.add(filename);
              const existing = known.get(filename);
              if (existing)
                existing.aliases = [
                  ...new Set([...(existing.aliases || []), match[0]]),
                ];
            }
          } else if (
            /document|drawing|signature|handover|recce|brief|snag|report/.test(
              table + column,
            )
          ) {
            externalLinks.push({
              table,
              pk,
              column,
              url: match[0],
              suggestedScope: guess(table, column),
            });
          }
        }
        if (known.has(value)) names.add(value);
        for (const filename of names) {
          if (!known.has(filename))
            known.set(filename, {
              filename,
              extension: path.extname(filename),
              url: `${base}/${filename}`,
              missing: true,
              decision: 'review',
              scope: guess(table, column),
              references: [],
            });
          const file = known.get(filename);
          file.references.push({
            table,
            pk,
            column,
            hash: hash(value),
            suggestedScope: guess(table, column),
          });
          if (file.references.length === 1) file.scope = guess(table, column);
        }
      });
      await fs.mkdir(path.dirname(path.resolve(reportPath)), {
        recursive: true,
      });
      await fs.writeFile(
        reportPath,
        JSON.stringify(
          {
            version: 1,
            database: process.env.DB_NAME,
            cdnBaseUrl: base,
            createdAt: new Date().toISOString(),
            warnings,
            externalLinks,
            files: [...known.values()],
          },
          null,
          2,
        ),
        { flag: 'wx', mode: 0o600 },
      );
      console.log(
        `Inventory written: ${known.size} objects/links; ${warnings.length} warnings. No objects or database rows changed.`,
      );
      return;
    }
    const report = JSON.parse(await fs.readFile(reportPath, 'utf8'));
    if (
      report.version !== 1 ||
      report.database !== process.env.DB_NAME ||
      report.cdnBaseUrl !== base ||
      report.warnings.length
    )
      throw new Error(
        'Inventory environment mismatch or unresolved inventory warnings',
      );
    if (
      report.files.some(
        (f) =>
          !['public', 'private'].includes(f.decision) ||
          !keyPattern.test(f.filename) ||
          f.filename.includes('..') ||
          !SCOPES.has(f.scope) ||
          f.missing,
      )
    )
      throw new Error(
        'Review every object/link, resolve missing objects, and set public/private decisions and scopes first',
      );
    // Reuse the application storage rules. Build first so deployment and migration agree.
    const { CdnService } = require('../dist/src/modules/cdn/cdn.service.js');
    const storage = new CdnService();
    const journalPath = reportPath + '.journal.json';
    let journal;
    try {
      journal = JSON.parse(await fs.readFile(journalPath, 'utf8'));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      journal = { files: {} };
    }
    const currentNames = new Set(files.map((f) => f.filename));
    const expectedNames = new Set(
      report.files
        .filter((f) => !journal.files[f.filename]?.removed)
        .map((f) => f.filename),
    );
    // Remote private copies now remain in the original CDN directory. A
    // resumed migration must recognize copies it already wrote there.
    if (remote)
      for (const entry of Object.values(journal.files))
        expectedNames.add(entry.filename);
    if (
      currentNames.size !== expectedNames.size ||
      [...currentNames].some((name) => !expectedNames.has(name))
    ) {
      throw new Error(
        'Public storage changed since inventory; stop writers and create a fresh inventory',
      );
    }
    const save = () =>
      fs.writeFile(journalPath, JSON.stringify(journal, null, 2), {
        mode: 0o600,
      });
    const replacements = new Map();
    for (const file of report.files.filter(
      (f) => f.decision === 'private' && !protectedScope(f.filename),
    )) {
      let entry = journal.files[file.filename];
      if (!entry) {
        const uploaded = await storage.uploadBuffer(
          await storage.downloadFile(file.filename),
          file.filename,
          file.scope,
        );
        entry = journal.files[file.filename] = {
          filename: uploaded.filename,
          url: uploaded.url,
          removed: false,
        };
        await save();
      }
      const privateBytes = await storage.downloadFile(entry.filename);
      if (!entry.removed) {
        const publicBytes = await storage.downloadFile(file.filename);
        if (hash(privateBytes) !== hash(publicBytes))
          throw new Error('Private copy verification failed');
      }
      replacements.set(file.filename, entry.filename);
      replacements.set(file.url, entry.url);
      for (const alias of file.aliases || [])
        replacements.set(alias, entry.url);
    }
    // Only exact string values are rewritten, including values nested in JSON.
    // Embedded prose/HTML URLs require explicit review instead of partial rewriting.
    const replaceValue = (value) => {
      if (typeof value === 'string') return replacements.get(value) || value;
      if (Array.isArray(value)) return value.map(replaceValue);
      if (value && typeof value === 'object')
        return Object.fromEntries(
          Object.entries(value).map(([k, v]) => [k, replaceValue(v)]),
        );
      return value;
    };
    await db.beginTransaction();
    try {
      await scan(async (table, pk, column, before) => {
        if (![...replacements.keys()].some((old) => before.includes(old)))
          return;
        let after = replacements.get(before);
        if (!after) {
          try {
            after = JSON.stringify(replaceValue(JSON.parse(before)));
          } catch {
            after = before;
          }
        }
        if (after === before || !after) return;
        const where = Object.keys(pk)
          .map((k) => `${ident(k)} = ?`)
          .join(' AND ');
        const [result] = await db.query(
          `UPDATE ${ident(table)} SET ${ident(column)} = ? WHERE ${where} AND ${ident(column)} = ?`,
          [after, ...Object.values(pk), before],
        );
        if (result.affectedRows !== 1)
          throw new Error('Concurrent write detected; stop writers and retry');
      });
      // Any remaining old link/filename blocks deletion (also catches embedded URLs).
      await scan(async (_table, _pk, _column, value) => {
        for (const [old] of replacements)
          if (value.includes(old))
            throw new Error(
              'Unconverted legacy reference remains; review embedded URLs/filenames before deleting public objects',
            );
      });
      await db.commit();
    } catch (error) {
      await db.rollback();
      throw error;
    }
    for (const file of report.files.filter(
      (f) => f.decision === 'private' && !protectedScope(f.filename),
    )) {
      const entry = journal.files[file.filename];
      if (!entry.removed) {
        await storage.deleteFile(file.filename);
        entry.removed = true;
        await save();
      }
    }
    console.log(
      'Private copies verified, database references updated, public origin copies removed. Purge CDN caches and verify every legacy URL returns 403/404 before resuming writers.',
    );
  } finally {
    await db.end();
    if (sftp) await sftp.end().catch(() => {});
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
