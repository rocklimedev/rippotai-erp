# OAuth token storage and operations

Google and Microsoft access/refresh fields contain Vault Transit ciphertext.
Zoho encryption has been reverted: its existing token storage and refresh behavior
remain in place. Migration, rewrap and audit tools exclude `zoho_tokens`.
The service encrypts before writes and decrypts only for provider calls. There is
no plaintext fallback or local key. Missing configuration, denied/disabled keys,
timeouts and malformed ciphertext fail with a generic 503. Key errors never
overwrite stored tokens. Reconnect preserves refresh tokens when omitted by the
provider; rotated refresh tokens are encrypted before either field is saved.

## Provisioning

Use a managed production Vault cluster over HTTPS. An administrator enables the
`transit` engine and creates `oauth-tokens` as a **derived**, non-exportable,
non-convergent `aes256-gcm96` key. Context binds provider, immutable user ID and
field, preventing ciphertext swapping between records or fields.

Set `OAUTH_VAULT_ADDR` (HTTPS origin), `OAUTH_VAULT_KEY=oauth-tokens` and
`OAUTH_VAULT_TOKEN` through the service secret injector. Use a short-lived token,
renewed/replaced by the workload identity/Vault agent; ensure process restart or
secret refresh before expiry. Never commit credentials. The workload policy is:

```hcl
path "transit/encrypt/oauth-tokens" { capabilities = ["update"] }
path "transit/decrypt/oauth-tokens" { capabilities = ["update"] }
```

Grant this policy exclusively to the backend workload identity. Do not grant key
read/export, backup, rotate, delete, configuration, or wildcard privileges. The
maintenance identity gets encrypt for migration or rewrap for rotation, never
decrypt. Separate key administration from database administration; audit Vault
access and alert on denied requests. Restrict network access to Vault to these
identities' workloads. Backend process access is privileged and must be restricted.

## Managed database access strategy

Our database provider does not expose MySQL privilege management. Deployment
therefore requires no CREATE ROLE, GRANT, REVOKE, SET DEFAULT ROLE, or SHOW GRANTS.
The existing provider-issued database credential can continue to perform service
CRUD; the decryption boundary is the separate Vault workload identity.

For Google and Microsoft, database access alone reveals ciphertext and connection
metadata, not plaintext OAuth tokens. Zoho tokens remain readable to database users. Only the backend workload receives the Vault decrypt credential.
Keep Vault credentials out of the database, database provider console, reporting
tools and database backups. Restrict production database credentials to the
backend secret store and approved maintenance jobs. Use the provider's network
allowlist/private connectivity and console access controls where available, and
rotate the database credential through the provider console after suspected
exposure. These controls do not require SQL privilege-management access.

Provide reporting and support access through authorized application endpoints or
exports that omit accessToken and refreshToken, rather than distributing the
production database credential. Existing response secret stripping remains
required. People with direct database access can still read ciphertext and modify
or delete rows; this strategy does not provide table-level database isolation.
Provider console administrators and backend process administrators remain trusted.
If table-level isolation becomes mandatory, use a provider offering separate
restricted credentials or move token persistence behind a separate service and
datastore with its own credentials.

## Rollout

1. Provision Vault, validate service permissions and recovery backups in staging.
2. Stop OAuth writers and background integration jobs. Take an access-controlled
   DB backup; existing backups/binlogs may contain plaintext and require restricted
   access and retention expiry. Do not copy token values into logs or tickets.
3. In an approved maintenance job, inject the provider-issued DB credential and
   a temporary encrypt-only Vault credential, then run from backend:
   `node scripts/oauth-token-maintenance.cjs encrypt`. This batches rows, updates
   both fields atomically, and is resumable after failure. Never enable dual reads.
4. Run `backend/ops/oauth-token-audit.sql` against the selected application DB;
   all Google/Microsoft invalid-token counts must be zero. This read-only query returns counts,
   never token values, and needs no role-management privileges. Format validation
   does not prove decryptability: verify a controlled test account through the
   service as well. Remove the maintenance job's injected credentials, revoke its
   temporary Vault credential and deploy code. Verify a database-only/reporting
   identity has no Vault decrypt policy and an unauthorized Vault decrypt request
   is denied; verify the backend workload can decrypt its own test account token.
5. Smoke-test connection, refresh and disconnect for Google and Microsoft; enable jobs.
   Do not roll back to plaintext code. Restore only with a compatible ciphertext
   reader or repeat migration on restored plaintext backups before starting apps.

## Rotation

Key administrators rotate `transit/keys/oauth-tokens/rotate` on the organization's
schedule and immediately after suspected compromise. New writes use the latest
version; old versions remain decryptable. With writers paused, run
`node scripts/oauth-token-maintenance.cjs rewrap` using a temporary rewrap-only
identity. It never receives plaintext. Verify ciphertext version counts and
refresh smoke tests before resuming writers. Retain old key versions for the full
database backup retention window. Raise `min_decryption_version` only after all
live data and required backups can be recovered; never delete the key to rotate.

## Failure and recovery

On a Vault outage or permission error, restore network, workload authentication,
policy or key availability, then retry. Tokens remain unchanged; never bypass
encryption. Monitor 503 rates and Vault audit logs without recording token bodies.
Back up Vault storage/key versions using the managed provider's supported backup
process and protect unseal/recovery material separately with split custody. Test
DB plus Vault recovery quarterly in isolation, including an older key version
and an expired access token that must refresh. A DB backup alone is insufficient.
If key material is irrecoverable, revoke provider grants, delete affected token
rows and require OAuth reconnection. For compromise, revoke workload credentials,
rotate keys, rewrap, and revoke/reconnect affected provider grants as appropriate.

API reference: https://developer.hashicorp.com/vault/api-docs/secret/transit
