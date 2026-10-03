# INOS demo seed (Rippotai Architecture)

Fills the local DB with realistic, internally consistent demo data for every module. Re-runnable.

```bash
seeds/demo/run.sh              # pending migrations, then all sections
seeds/demo/run.sh s03_procurement s05_docs   # just some sections
```

- `run.sh` first applies any `migrations/*.sql` not yet listed in table `_local_migrations`, then for each section runs
  `python3 gen.py <section>` (writes `sql/<section>.sql`) and pipes it into MariaDB.
- Ids are `uuid5` of readable keys (and fixed integers for the legacy int-keyed site-ops tables); every insert is
  `INSERT IGNORE`, so re-running adds nothing new. Existing rows (admin user, Kapoor / Malhotra / Sagar / Chhabra Marble
  store / Aurum projects, their clients, 3 vendors) are only enriched with `COALESCE` updates, never deleted.
- Dates are relative to `SEED_TODAY` (default `2026-09-29`): ~6-12 months of history, ~3 months ahead.
- All seeded users log in with password `Inos@2026` (hash copied from the admin row).

| Section | Contents |
|---|---|
| s01_core | units, project types, 12 staff users + teams, 15 clients, 14 projects (phase/progress/value), project gates + transition log, 83-item document catalogue, settings (company profile, bank, billing, signature), T&C templates |
| s02_crm | 25 deals across all pipeline stages (+notes, activity, tasks), project briefs (all child tables), site recces (+rooms/photos), plans of action, scope of work (+spaces/items) |
| s03_procurement | 20 vendors, 45 materials + vendor price list, requirements, sample boards, rate sheets, estimates, material quotations, vendor quotations (+items/versions), POs, work orders (+stages/terms), delivery challans, inventory transactions |
| s04_finance | rate library, BOQ templates, BOQs with versions, budget estimates (+versions), payment schedules + milestones, project milestones |
| s05_docs | document requirements for every project x doc type, uploaded documents (+versions), drawing register (+revisions), proposals |
| s06_siteops | process phases/steps, QC checklists + sign-offs (incl. failures), daily site reports (8 weeks) + manpower, visit assignments + logs, RFIs, mock-ups, step progress |
| s07_planning | project + design planners (+locations, items, procurement tracker), tasks, calendar events, signatures |
| s08_activity | notifications, activity/audit log |
| s09_automation | 7 automation rules (trigger/condition/action JSON), run history on real overdue milestones / failed QC / stalled projects, escalations, automation audit trail |

Notes: site-ops tables (daily reports, visits, QC sign-offs, RFIs, mock-ups) key projects by UUID
(`migrations/20260930_site_ops_project_uuid.sql` converted the old integer ids). Only the legacy process-workflow
tables (`project_step_progress`, `gate_logs`) still use the integer mapping in `lib.SITE_INT`
(1 Kapoor, 2 Malhotra, 3 Chhabra Marble store, 4 Bhatia, 5 Oberoi, 6 Rocklime EC, 7 Singhania). Trade teams use
numeric-string ids `1`-`10` in `teams` so those integer references resolve. File URLs point to `/uploads/demo/...`
(placeholders, no binaries).
