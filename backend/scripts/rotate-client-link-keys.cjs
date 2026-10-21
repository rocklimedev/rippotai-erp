// Run from backend after npm run build. Dry run unless --apply is supplied.
const { createHash } = require('node:crypto');
const mysql = require('mysql2/promise');
const {
  ClientLinkCrypto,
} = require('../dist/src/modules/client-portal/client-link-crypto.js');

async function main() {
  const crypto = new ClientLinkCrypto();
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME || 'spsyn8lm_rippotai_erp',
  });
  const counts = {
    checked: 0,
    ready: 0,
    updated: 0,
    unavailable: 0,
    concurrent: 0,
  };
  try {
    let cursor = '';
    for (;;) {
      const [rows] = await db.execute(
        'SELECT id, token_enc, token_hash FROM client_links WHERE revoked_at IS NULL AND expires_at > NOW() AND id > ? ORDER BY id LIMIT 200',
        [cursor],
      );
      if (!rows.length) break;
      for (const row of rows) {
        cursor = row.id;
        counts.checked++;
        const token = crypto.decrypt(row.token_enc);
        if (
          !token ||
          createHash('sha256').update(token).digest('hex') !== row.token_hash
        ) {
          counts.unavailable++;
          continue;
        }
        counts.ready++;
        if (process.argv.includes('--apply')) {
          const [result] = await db.execute(
            'UPDATE client_links SET token_enc = ? WHERE id = ? AND token_enc = ? AND revoked_at IS NULL AND expires_at > NOW()',
            [crypto.encrypt(token), row.id, row.token_enc],
          );
          if (result.affectedRows === 1) counts.updated++;
          else counts.concurrent++;
        }
      }
    }
    console.log(JSON.stringify(counts)); // Never log tokens, ciphertext, or keys.
    if (counts.unavailable || counts.concurrent) process.exitCode = 1;
  } finally {
    await db.end();
  }
}
main().catch(() => {
  console.error(
    'Client-link migration failed; inspect configuration/database availability.',
  );
  process.exitCode = 1;
});
