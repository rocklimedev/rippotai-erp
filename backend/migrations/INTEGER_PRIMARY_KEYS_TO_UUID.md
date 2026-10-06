The UUID migration converts 19 implicit Sequelize integer primary keys in process workflows and site operations to `CHAR(36)`. New records use Sequelize UUIDv4 defaults. Existing numeric IDs use deterministic UUIDv5 mappings; existing UUID IDs remain unchanged. Numeric order, headcount, RFI number, attempt number and other business values stay numeric.

The manifest lists model relationships, including the shared team table, team membership and the conditional `team_members.owner_id` reference for `owner_type = 'TEAM'`. The runner also discovers additional database foreign keys. It preserves indexes, primary keys, nullable relationships and foreign key update/delete rules.

Run from `backend` using Node 22 or later and the normal `DB_HOST`, `DB_PORT`, `DB_USER` and `DB_PASS` environment variables:

```powershell
# Read-only: checks the specified database and prints counts and affected references.
node --env-file-if-exists=.env migrations/20261006_integer_primary_keys_to_uuid.cjs --database YOUR_DATABASE

# If legacy numeric project references exist, supply their verified mappings.
node --env-file-if-exists=.env migrations/20261006_integer_primary_keys_to_uuid.cjs --database YOUR_DATABASE --project-map project-id-map.json

# After backing up externally and stopping all application and worker writes:
node --env-file-if-exists=.env migrations/20261006_integer_primary_keys_to_uuid.cjs --database YOUR_DATABASE --project-map project-id-map.json --apply
```

Omit `--project-map` if no numeric project references remain. Its format is an object mapping old IDs to existing `projects.id` UUIDs. The migration does not guess project identities from names or demo data.

MySQL/MariaDB DDL implicitly commits. The runner retains full `_uuid_backup_<table>` copies, a durable `_uuid_pk_migration_state` journal and `_uuid_pk_id_map` mappings. Keep these until the rollout is verified. An interrupted run resumes from its saved plan; do not restart application writes before it finishes. If a backup copy is incomplete, the runner stops rather than replacing it or proceeding.

Take and test an external full database backup first. Test this migration on a restored staging database before applying it to a live database. Rollback means stopping writes, restoring the full backup and deploying the previous application version; an automatic UUID-to-integer rollback would lose newly created UUID records and is not provided.

Deploy the changed backend and frontend together after migration. Cached clients and old URLs contain former integer IDs; `_uuid_pk_id_map` provides the old-to-new correspondence. External integrations and IDs embedded in arbitrary JSON or text require their own review; the runner migrates table keys and the declared/discovered relational references.

Demo seed generation now uses the same UUIDv5 mapping. Regenerate demo SQL after migration; previously generated SQL files and historical migrations remain legacy artifacts. The seed shell script requires UUID primary keys before generating new rows. This `.cjs` migration must be run explicitly; the historical `.sql` loop does not apply it.

Local checks:

```powershell
node --test migrations/20261006_integer_primary_keys_to_uuid.test.cjs
npx jest --config uuid-jest.config.cjs --runInBand
npm run build
```

The migration has not been applied to a database by this code change. A real MySQL/MariaDB rehearsal is still required.
