/* Run with OAuth writers stopped. Credentials must come from the environment.
 * encrypt: one-time plaintext migration; rewrap: key rotation without decryption.
 * Atomic per row, resumable, and compare-and-swap protects concurrent updates.
 */
const mysql = require('mysql2/promise');
const mode = process.argv[2];
if (!['encrypt', 'rewrap'].includes(mode))
  throw new Error('Use encrypt or rewrap');

async function main() {
  const address = new URL(process.env.OAUTH_VAULT_ADDR);
  const key = process.env.OAUTH_VAULT_KEY;
  if (
    address.protocol !== 'https:' ||
    address.username ||
    address.password ||
    address.search ||
    address.hash ||
    !/^[\w-]+$/.test(key || '') ||
    !process.env.OAUTH_VAULT_TOKEN
  )
    throw new Error('Invalid Vault configuration');
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });
  try {
    for (const provider of ['google', 'microsoft']) {
      const table = `${provider}_tokens`;
      let lastId = '';
      while (true) {
        const [rows] = await db.query(
          `SELECT id, userId, accessToken, refreshToken FROM \`${table}\` WHERE id > ? ORDER BY id LIMIT 100`,
          [lastId],
        );
        if (!rows.length) break;
        for (const row of rows) {
          const values = {};
          for (const field of ['accessToken', 'refreshToken']) {
            const value = row[field];
            if (value == null) {
              values[field] = null;
              continue;
            }
            const encrypted = /^vault:v\d+:[A-Za-z0-9+/=]+$/.test(value);
            if (mode === 'encrypt' && encrypted) {
              values[field] = value;
              continue;
            }
            if (mode === 'rewrap' && !encrypted)
              throw new Error('Plaintext found; migrate first');
            const response = await fetch(
              `${address.toString().replace(/\/$/, '')}/v1/transit/${mode === 'encrypt' ? 'encrypt' : 'rewrap'}/${key}`,
              {
                method: 'POST',
                redirect: 'error',
                signal: AbortSignal.timeout(5000),
                headers: {
                  'Content-Type': 'application/json',
                  'X-Vault-Token': process.env.OAUTH_VAULT_TOKEN,
                },
                body: JSON.stringify({
                  context: Buffer.from(
                    JSON.stringify(['oauth', provider, row.userId, field]),
                  ).toString('base64'),
                  ...(mode === 'encrypt'
                    ? { plaintext: Buffer.from(value).toString('base64') }
                    : { ciphertext: value }),
                }),
              },
            );
            if (!response.ok) throw new Error('Key operation failed');
            const result = await response.json();
            if (
              !/^vault:v\d+:[A-Za-z0-9+/=]+$/.test(
                result.data?.ciphertext || '',
              )
            )
              throw new Error('Invalid key response');
            values[field] = result.data.ciphertext;
          }
          const [result] = await db.query(
            `UPDATE \`${table}\` SET accessToken = ?, refreshToken = ? WHERE id = ? AND accessToken = ? AND refreshToken <=> ?`,
            [
              values.accessToken,
              values.refreshToken,
              row.id,
              row.accessToken,
              row.refreshToken,
            ],
          );
          if (result.affectedRows !== 1)
            throw new Error('Concurrent change; stop writers and rerun');
          lastId = row.id;
        }
      }
    }
    console.log('OAuth token maintenance completed');
  } finally {
    await db.end();
  }
}
main().catch(() => {
  console.error(
    'OAuth token maintenance failed; no token data logged. Resolve configuration/key/database availability and rerun.',
  );
  process.exitCode = 1;
});
