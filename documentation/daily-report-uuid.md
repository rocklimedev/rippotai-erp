Daily site report IDs
====================

Daily site reports use UUID v4 strings, stored as CHAR(36), with Sequelize generating IDs for new reports. Manpower entries store the same string in daily_site_report_id. Report detail, update, share, and delete endpoints validate UUIDs.

Before deploying the application change, stop application writes, back up the database, and run backend/migrations/20261010_daily_site_report_uuid.sql using a MySQL/MariaDB client that supports DELIMITER. Schema synchronization is disabled, so deploying the model alone does not migrate the database.

Existing integer IDs map to UUIDs with prefix d5100000-0000-4000-8000- and a 12-digit hexadecimal representation of the old ID. For example, report 1 becomes d5100000-0000-4000-8000-000000000001. Existing manpower relationships and foreign key rules are preserved. Old numeric report URLs must use the mapped UUID instead.

The migration rejects orphan manpower entries or additional report foreign keys before modifying the schema. MySQL/MariaDB DDL implicitly commits: restore the backup if execution fails partway through. A successful migration can be rerun without changing UUIDs.

The existing database dump and demo site-operations SQL are legacy integer fixtures. Load these before running the migration; do not replay those fixtures into an already migrated database. Admin daily reports already use UUIDs and are unaffected.
