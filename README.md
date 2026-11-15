# INOS — v2 build (12 Oct 2026)

Includes every change so far: new PDF document format (fixed Rippotai cover), dashboard customise,
Upload drawings page, Bigin-style CRM pipeline, daily site reports, Command Center fixes,
Tasks/Calendar/Notes/Clients/Activity/Inventory/Automation pages, client portal, company profile,
and a database full of demo data.

## Run it
1. First time only:  `bash setup-mac.sh`   (installs MariaDB, Redis, Node via Homebrew; loads the DB; installs packages)
2. Every time:       `bash start.sh`       → opens http://localhost:5173
3. Login: **ajay@rocklime.com / Inos@2026** (all demo staff users use the same password)

## Folders
- `frontend/` React + Vite (git history included as of this build)
- `backend/`  NestJS API on :5000 (`.env` has local-only placeholder settings)
- `db/inos_full_with_demo_data.sql` full schema + demo data
- `backend/seeds/demo/run.sh` re-runs the demo seed (needs python3); `backend/migrations/` new schema changes

Not connected locally: Zoho (Bigin/Tasks/Calendar/Cliq), OneDrive, email — the app works without them.
Uploaded files are stored in /tmp/inos-cdn on your Mac.

## v2 local install notes (12 Oct 2026)
- Code = the 12 Oct upload (frontend + backend). Local-only tweaks: backend/.env (port 5050), frontend .env + src/lib/config.js → localhost:5050,
  `DB_NAME` / `DB_SYNC_MISSING` env switches in backend/src/config/database.config.ts.
- `backend/create-missing-tables.cjs` creates tables that exist as models but not in the DB (26 were missing locally). Run it before `seeds/demo/run.sh` on a fresh DB.
- Fixes applied for this Mac: seeds/demo scripts converted from Windows line endings; `to_date`/`from_date` quoted in migrations/20261007_admin_dpr_documents.sql (reserved word in MariaDB 13);
  13 orphan demo manpower rows removed before the daily-report UUID migration.
- Backup of the database before the update: db/backups/before-v2-*.sql

## v3 update notes (29 Oct 2026)
- Code = the 29 Oct upload (frontend + backend) + the Super Authority dashboard (Command Center → Authority), re-applied on top.
- Database upgraded in place (backup: db/backups/before-v3-*.sql):
  - 10 new migrations applied (email verification, pending email, delete permissions, brief expected timeline, scope slug, recce measurement precision).
  - `backend/scripts/local-schema-sync.py ../db/inos_schema_2026-10-29.sql` compared the live DB with the developer's schema dump and added only what was missing: 1 table, 6 columns, 89 permissions, 10 apps, new roles and their grants. Never drops or changes existing data.
  - `project_briefs.expected_timeline` changed TEXT → VARCHAR(32) to match the new code (it was empty).
- Local-only: all demo users marked email-verified (email isn't connected locally). Do NOT do this on production.
- New local secrets in backend/.env (CLIENT_LINK_ENCRYPTION_SECRET must be base64 of 32 random bytes).
- Fixed in the code (tell the developer): `refetchPortfolio` was undefined in pages/CommandCenter.jsx (Retry would crash the page).
- Fresh Mac: `bash setup-mac.sh` loads db/inos_full_with_demo_data.sql (full copy of this upgraded DB).

## Dummy data removed (29 Oct 2026)
- The database now holds only real setup data (roles, permissions, apps, phases, gates, document types, item library, BOQ/scope categories, units, QC & terms templates, settings) from the developer's 29 Oct schema + one admin login (ajay@rocklime.com / Inos@2026).
- No projects, clients, deals, vendors, BOQs, reports, tasks or demo staff. Add real users from Admin Console → Users.
- Fresh Mac: setup-mac.sh now loads db/inos_clean.sql and does NOT run the demo seed.
- The demo version is kept only as backups: db/backups/inos_full_with_demo_data.sql and before-remove-dummy-*.sql.
  To bring demo data back: mysql spsyn8lm_rippotai_erp < db/backups/inos_full_with_demo_data.sql

## v4 — 30 Oct 2026 audit sprint
- Autofill: details entered once (client, site area, rooms, floors, lift, budget, dates) prefill every later document. Rooms live in project spaces.
- Roles & Permissions: per app → per document levels: No access / View only / View & Edit / Create / Full access (incl. Remove). Settings → Roles & Permissions.
- Dashboard widgets: resize limits + size-aware content (no cropped text). Declutter pass (quotations, shared styles, phone layout).
- Audit: 214 routes crawled, fixes for inventory movements, search fallback, 500s, dead links, PDFs.
- Update an existing Mac install: `bash update-mac.sh` (backs up DB, applies backend/migrations/20261030_*.sql, builds). Reports in docs/audit-2026-10-30/.

## v5 — 7 Nov 2026 (developer update INOS_1.zip)
- Developer changes: search moved from Elasticsearch to a private MySQL table (`erp_search_documents`, migration 20261105_personal_search.sql), private image/file download gate, budget-estimate totals, CRM pipeline, print/PDF, BOQ, payments, planner, site-ops UI updates.
- Fixes added on top:
  - Search sync: new/edited/deleted records now update search automatically; index builds itself on first start and refreshes every 30 min (backend/src/modules/search/search-sync.service.ts). Without this, search showed nothing until a manual reindex.
  - Business Proposal / All Documents: image previews used an undefined URL (process.env.REACT_APP_BACKEND_URL); now loaded the same authenticated way as PDFs.
- Folder note: the developer zip names the frontend `rippotai-erp-frontend`; here it is `frontend`. Two backend specs read `../rippotai-erp-frontend` and `../documentation/` paths, so they fail only because of folder layout.
- Update a Mac install: `bash update-mac.sh` (backs up DB, applies 20261030_*, 20261105_* and 20261110_* migrations — safe to re-run).

## Quotations and vendor shortlists removed — 10 Nov 2026
- Client quotations / estimates (incl. versions and comparisons), vendor (material) quotations and vendor shortlists are no longer part of INOS: pages, APIs, permissions, dashboard widgets, search index and their database tables are gone.
- Purchase orders are raised directly from an approved procurement estimate, BOQ, rate comparison or manually.
- Migration: `backend/migrations/20261110_remove_quotations_shortlists.sql` (safe to re-run; included in `update-mac.sh`). It permanently deletes quotation/shortlist data — `update-mac.sh` takes a DB backup first.
- `db/inos_clean.sql` already has this migration applied.

## v7 — client-ready document design (Nov 2026)
- Official Rippotai logo/monogram/wordmark in frontend/src/assets/brand and backend/assets/brand; rules in docs/BRAND-DOCUMENTS.md.
- All 24 exported documents (PDF, Excel, CSV, Word) restyled: brand green/gold only, black/grey text, ≥8.5 pt, greyscale-print safe.
- start.sh now also starts the export worker (needed for BOQ / planner / DPR / crucial-work downloads); uses Google Chrome if installed.

## v9 — INOS shaped on the user's flow (14 Nov 2026)
Menus: Projects (Projects → Overview/Drawings/Documents; Clients), Design (CRM · Project Setup · Design Studio), Build (Contracts · Procurement · Ledger · Operations). One document list for every document (Name, Project, Version, Status, Date, Review, View/Edit/Delete) with Approve/Revise/Reject/Archive + comments. Refill opens a project's saved document; saves keep revisions. Green/yellow section ticks. New: Pre Design stage, upload documents (Contract, Agreement, Design, Working/Tender Drawings), Quotation from finalised vendor (PDF/Excel from template, Raise PO/WO). Hidden (data kept): Budget Estimate, Rate Sheets, Sample Boards, Requirements, Site Visit report, Crucial Work, Scope of Approval removed.
Migrations: 20261114_doclist_reviews, 20261114_flow_structure_document_types, 20261114_quotation_procurement.
