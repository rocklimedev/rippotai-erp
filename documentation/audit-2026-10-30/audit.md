# Audit report — INOS v3 (30 Oct 2026)

Method: enumerated 234 frontend route entries (babel parse of `router/routes/**`) + 89 nav slugs, and 993 backend routes (`scripts/route-inventory.cjs`). Playwright crawl as admin over 214 concrete routes (real ids from the demo DB), run twice — the second after autofill (3dcd1e9/c189634), permissions (0757926/7ab5fb4) and UI (b0c482b) commits. Called all 233 parameterless backend GETs and 78 `/:id` GETs with the admin token. Static checks: frontend API URL → backend route match, nav links → route table, duplicate RTK endpoints, Sequelize model ↔ DB column diff, route permissions ↔ DB grants (ADMIN has every route permission; none missing).

Final state: 214/214 routes render, no page errors, no error boundaries, no blank pages, no 403 "Route permission is not configured", no 500s on any list endpoint.

## Fixes

| # | Problem | Fix | Files |
|---|---|---|---|
| 1 | Global search (`/search`, `/search/suggest`, `/search/<entity>`) 500 whenever Elasticsearch is down/not indexed (ES is not running locally, likely not in prod either) | SQL LIKE fallback (projects, clients, leads, vendors, BOQs, quotations, estimates, WOs, DCs, recces, tasks; project-scoped for non-admins) + 60s circuit breaker so the fallback is instant | be `search/sql-search-fallback.service.ts` (new), `global-search.service.ts`, `autocomplete.service.ts`, `search.service.ts`, `search.module.ts`, spec |
| 2 | **All stock movements failed** (receive, issue, opening, transfer): `inventory_transactions.unit` NOT NULL not mapped by model | Model maps `unit` → `unit_code`, service writes unit code; migration adds default | be inventory model/service; `20261030_audit_inventory_unit_default.sql` |
| 3 | Manual "Receive stock" failed: `reference_type` enum lacks `MANUAL` | Migration adds `MANUAL` | `20261030_audit_inventory_reference_manual.sql` |
| 4 | Inventory "Opening stock" and "Reverse" buttons called missing endpoints; material history called wrong URL | Added `POST /inventory/opening-stock`, `POST /inventory/reverse/:id` (opposite ADJUSTMENT with `reversal_of_id`, one reversal only); fixed history URL | be inventory controller/service; fe `inventory.api.js` |
| 5 | DC "Complete" called non-existent `/delivery-challans/:id/complete`; DC "Edit" went to an unrouted page | Uses `/receive`; added `delivery-challans/:id/edit` route (form already supports edit) | fe `delivery-challan.api.js`, `materials.routes.jsx` |
| 6 | Vendor "Add to shortlist" (directory + profile) called non-existent `/vendor-shortlists` | Rewired to per-project VENDOR shortlists (`/project-shortlists`, `/shortlist-entries`) with trade + working type pickers | fe `vendor.api.js`, `VendorsDashboard.jsx` |
| 7 | 500s: `/documents/dashboard/recent`, `/boq-variance`, `/project-wise`; `/documents/:id/versions`, `/attachments` (wrong column names / missing associations) | Corrected column mapping, rewrote two aggregates as SQL | be `documents-dashboard.service.ts`, `document.service.ts` |
| 8 | `/activity-logs/entity-label` 500 without param | 400 with message | be `activity-logs.controller.ts` |
| 9 | Broken navigation (dead URLs → bounced to dashboard): `/material-procurement/*`, `/work-orders/*`, `/procurement/site-inventory/*`, `/procurement/requirements/:id(/edit)`, `/plan-of-actions`, `/scope-of-work`, `/site-recce/*`, `/crm/leads`, `/leads/:id`, `/admin/team`, `/crm/design/*`, `/crm/calendar`, `/settings/roles-permissions`, `/budget-estimates/:id` | Repointed to current routes; material procurement edit reads `:id`; requirement form accepts `project_id` | fe materials pages, PlanOfAction/ScopeOfWork lists, SiteRekiForm, CRMDashboard, BoqDashboard, UserMenu, widgets admin/crm/leads/design-studio |
| 10 | RTK tags `MaterialProcurement`, `VisitStages`, `QualityChecklists` not registered → lists didn't refresh after save | Added to `tagTypes` | fe `store/baseApi.js` |

Migrations: `20261030_audit_inventory_unit_default.sql`, `20261030_audit_inventory_reference_manual.sql` (both idempotent, no data).
Commits: backend a33b4e2, 3a324ce; frontend 0e96950.

## Flows checked
- PDF download works (file generated, 0.5–2.5 MB) for: client brief, site recce, plan of action, scope of work, budget estimate, BOQ (preview), payment schedule, quotation, PO, DC, WO, daily site report, project planner. BOQ workspace "Download BOQ" opens the export dialog (correct).
- Inventory opening → reverse → double-reverse blocked; receive; issue — via API after fixes.
- Workflow pages (lead/pipeline → client → project → brief → recce → scope → estimate → quotation → BOQ → PO/WO/DC → DSR → payments), Command Center, dashboard, search, settings, admin console: all render with live data; search returns results again.

## Still open / out of scope (not fixed)
- Zoho / Google / Microsoft connector pages show "reconnect account" (400/401/412) — expected until accounts are connected.
- Demo-data files have storage keys containing `/`, so document/drawing preview returns 403 "Invalid file key" on demo rows only.
- Orphan pages not reachable from nav, buttons go nowhere: `/procurement/quotations` (MaterialQuotationList), `/procurement/sample-boards` (SampleBoardList); requirement "Edit" opens the requirement on its project sheet (no edit form exists).
- Dead backend code, unused by the UI: `SnagController` (`/architect/snags`), `BoqCatalogController`, `ProjectDashboardController`, `PhasesModule` are not registered; legacy process-workflow endpoints (`/workflow/*`, `/gates/projects/:projectId`, `/:projectId/progress|timeline`, `/documents/:projectId/document-register`) use integer project ids (ParseIntPipe) and can't work with UUID projects.
- Duplicate RTK endpoint names across `api/site-ops/site-ops.api.js`, `api/procuerment/site-ops.api.js`, `site-visits.api.js`, `team*.api.js`, `zoho-crm.api.js`/`task.api.js` (first-loaded wins; dev console warnings). The live pages work today but this depends on import order.
- Minor React DOM-nesting warnings (BOQ template editor, rate library, estimates list colgroup, QuotationsActivity keys).
- Lint: touched files have no new errors; older unused-import / set-state-in-effect errors are still there. Backend `staff-rbac.spec` "catalogue in sync" fails on `command-center:authority` (not from this change).
- Ops note: the container restarted mid-run; I restarted MariaDB, Redis, Vite and the backend.

## Route status (crawl #2, admin)
| Route | Status |
|---|---|
| `/console` | OK |
| `/console/clients` | OK |
| `/console/users` | OK |
| `/console/roles-permissions` | OK |
| `/console/project-phases` | OK |
| `/console/document-types` | OK |
| `/console/project-structure` | OK |
| `/console/estimate-signature` | OK |
| `/console/terms-and-conditions` | OK |
| `/console/super-admin` | OK |
| `/console/company-profile` | OK |
| `/login` | OK |
| `/register` | OK |
| `/signup` | OK |
| `/verify-email` | OK |
| `/forgot-password` | OK |
| `/reset-password` | OK |
| `/no-access` | OK |
| `/automation` | OK |
| `/automation/rules` | OK |
| `/automation/rules/new` | OK |
| `/automation/rules/287b4b12-0da2-596a-9042-50a0685141a9/edit` | OK |
| `/automation/runs` | OK |
| `/automation/runs/f57858eb-9c83-5101-a9c1-e1d171a25434` | OK |
| `/automation/notifications` | OK |
| `/automation/escalations` | OK |
| `/automation/audit` | OK |
| `/calendar` | OK |
| `/calendar/mine` | OK |
| `/calendar/team` | OK |
| `/calendar/connected` | OK — 400 only because Zoho account not connected (external) |
| `/client-home` | OK |
| `/command-center` | OK |
| `/command-center/file-manager` | OK |
| `/crm` | fixed (CRM dashboard/widget links) |
| `/crm/business-proposal/workspace` | fixed (CRM dashboard/widget links) |
| `/crm/pipeline` | fixed (CRM dashboard/widget links) |
| `/crm/leads/new` | fixed (CRM dashboard/widget links) |
| `/crm/leads/sources` | fixed (CRM dashboard/widget links) |
| `/crm/leads/crm` | fixed (CRM dashboard/widget links) |
| `/crm/recce/all` | fixed (stale /site-recce links) |
| `/crm/business-proposal/all` | fixed (CRM dashboard/widget links) |
| `/crm/recce/057c3d57-b18f-561f-b4d7-e065bbfcef63` | fixed (stale /site-recce links) |
| `/crm/recce/057c3d57-b18f-561f-b4d7-e065bbfcef63/edit` | fixed (stale /site-recce links) |
| `/crm/brief/all` | fixed (CRM dashboard/widget links) |
| `/crm/brief/11ff012f-cc82-5181-9bcd-25a9fb02c345` | fixed (CRM dashboard/widget links) |
| `/crm/brief/11ff012f-cc82-5181-9bcd-25a9fb02c345/edit` | fixed (CRM dashboard/widget links) |
| `/crm/plan-of-action/all` | fixed (stale /plan-of-actions links) |
| `/crm/plan-of-action/7247488c-04b9-40e3-9be2-4e20bb7f385b` | fixed (stale /plan-of-actions links) |
| `/crm/scope-of-work/all` | fixed (stale link) |
| `/crm/scope-of-work/0228a90b-7141-52ea-b34f-943846c2e15f` | fixed (CRM dashboard/widget links) |
| `/crm/forms/project-brief` | fixed (CRM dashboard/widget links) |
| `/crm/forms/business-proposal` | fixed (CRM dashboard/widget links) |
| `/crm/forms/site-reki` | fixed (CRM dashboard/widget links) |
| `/crm/forms/plan-of-action` | fixed (CRM dashboard/widget links) |
| `/crm/forms/scope-of-work` | fixed (CRM dashboard/widget links) |
| `/crm/forms/scope-of-work/0228a90b-7141-52ea-b34f-943846c2e15f/edit` | fixed (CRM dashboard/widget links) |
| `/crm/forms/plan-of-action/7247488c-04b9-40e3-9be2-4e20bb7f385b/edit` | fixed (CRM dashboard/widget links) |
| `/dashboard` | OK |
| `/design-studio` | OK |
| `/design-studio/all` | OK |
| `/design-studio/new` | OK |
| `/design-studio/upload` | OK |
| `/design-studio/integrations` | OK |
| `/design-studio/021a91bb-5c70-5fd7-b03e-fb867534ce6d` | OK — revision preview 403 is demo data storage key |
| `/design-studio/021a91bb-5c70-5fd7-b03e-fb867534ce6d/edit` | OK |
| `/inventory` | OK |
| `/inventory/site-inventory/all` | fixed (history URL, opening stock, reverse, post-save nav) |
| `/inventory/d0f7c2f2-302c-5cb3-ab71-5430af6bec2c` | fixed (history URL, opening stock, reverse, post-save nav) |
| `/inventory/site-inventory/transactions` | fixed (history URL, opening stock, reverse, post-save nav) |
| `/inventory/site-inventory/transactions/new` | fixed (history URL, opening stock, reverse, post-save nav) |
| `/inventory/site-inventory/transactions/04996bb9-cd79-5b59-9a98-d4da3b9f0ffa` | fixed (history URL, opening stock, reverse, post-save nav) |
| `/ledger` | OK |
| `/ledger/all` | OK |
| `/ledger/payment-schedule/all` | OK |
| `/ledger/payment-schedule/27e8416c-148b-43ab-95e2-04774e334374` | OK |
| `/ledger/forms/payment-schedule` | OK |
| `/ledger/forms/payment-schedule/27e8416c-148b-43ab-95e2-04774e334374/edit` | OK |
| `/ledger/budget-estimates/all` | OK |
| `/ledger/budget-guides/all` | OK |
| `/ledger/budget-guides/new` | OK |
| `/ledger/forms/budget-estimate` | OK |
| `/ledger/forms/budget-estimate/58dc2996-6728-5278-aefa-491dbfbcebd2/edit` | OK |
| `/ledger/budget-estimate/58dc2996-6728-5278-aefa-491dbfbcebd2` | OK |
| `/ledger/aggrements/all` | OK |
| `/ledger/boq/all` | OK |
| `/ledger/boq/new` | OK |
| `/ledger/boq/templates` | OK |
| `/ledger/boq/template/new` | OK |
| `/ledger/boq/template/02b843bf-da5c-5a0c-8f0a-9bae7c4f517e/editor` | OK |
| `/ledger/boq/rate-and-item-library` | OK |
| `/ledger/boq/activity` | OK |
| `/ledger/boq/18c9ff70-13b5-5776-9fed-79f008532bde/versions` | OK |
| `/ledger/boq/18c9ff70-13b5-5776-9fed-79f008532bde` | OK |
| `/ledger/boq/18c9ff70-13b5-5776-9fed-79f008532bde/preview` | OK |
| `/procurement` | OK |
| `/procurement/requirements` | fixed (view/edit nav, project_id prefill param) |
| `/procurement/requirements/add` | fixed (view/edit nav, project_id prefill param) |
| `/procurement/d0f7c2f2-302c-5cb3-ab71-5430af6bec2c/material-requirements` | OK |
| `/procurement/sample-boards` | OK |
| `/procurement/rate-sheets` | OK |
| `/procurement/rate-sheets/118690ac-b81c-55a4-8513-1a66c329bdee/edit` | OK |
| `/procurement/rate-sheets/new` | OK |
| `/procurement/estimates` | OK |
| `/procurement/vendors/rate-comparison` | fixed (Add to shortlist) |
| `/procurement/vendors/rate-comparison/new` | fixed (Add to shortlist) |
| `/procurement/quotations` | OK |
| `/procurement/purchase-orders` | OK |
| `/procurement/purchase-orders/new` | OK |
| `/procurement/purchase-orders/225c1ade-c496-5def-a8a7-7a6f0c66f20a/edit` | OK |
| `/procurement/purchase-orders/225c1ade-c496-5def-a8a7-7a6f0c66f20a` | OK |
| `/procurement/delivery-challans` | OK |
| `/procurement/delivery-challans/new` | fixed (Complete → /receive; Edit route added) |
| `/procurement/delivery-challans/546a7dc0-6ef5-45d5-a4c3-2ce34881925e` | fixed (Complete → /receive; Edit route added) |
| `/procurement/work-order/all` | fixed (stale /work-orders links) |
| `/procurement/work-order/new` | fixed (stale /work-orders links) |
| `/procurement/work-order/7e18e8cf-40a0-4a3f-ad66-d45a76838fc9/edit` | fixed (stale /work-orders links) |
| `/procurement/work-order/7e18e8cf-40a0-4a3f-ad66-d45a76838fc9` | fixed (stale /work-orders links) |
| `/procurement/estimates/all` | OK |
| `/procurement/estimates/new` | OK |
| `/procurement/estimates/034170e7-5120-54a2-949d-d1cdeec44062/edit` | OK |
| `/procurement/estimates/activity` | OK |
| `/procurement/estimates/compare` | OK |
| `/procurement/estimates/034170e7-5120-54a2-949d-d1cdeec44062` | OK |
| `/procurement/vendors/directory` | fixed (Add to shortlist rewired to project shortlists) |
| `/procurement/vendors/new` | fixed (Add to shortlist) |
| `/procurement/vendors/shortlists` | fixed (Add to shortlist) |
| `/procurement/vendors/shortlists-workspace` | fixed (Add to shortlist) |
| `/procurement/vendors/08a78f79-eea8-5aea-88fd-99a4dede7798/edit` | fixed (Add to shortlist) |
| `/procurement/vendors/08a78f79-eea8-5aea-88fd-99a4dede7798` | fixed (Add to shortlist) |
| `/procurement/material-procurement/list` | fixed (stale /material-procurement links, edit id) |
| `/procurement/material-procurement/new` | fixed (stale /material-procurement links, edit id) |
| `/boq` | OK |
| `/boq/all` | OK |
| `/boq/new` | OK |
| `/boq/templates` | OK |
| `/boq/template/new` | OK |
| `/boq/rate-and-item-library` | OK |
| `/boq/activity` | OK |
| `/document` | OK |
| `/document/upload` | OK |
| `/document/reference` | OK |
| `/projects` | OK |
| `/projects/all` | OK |
| `/projects/activity` | OK |
| `/projects/new` | OK |
| `/projects/d0f7c2f2-302c-5cb3-ab71-5430af6bec2c/handover` | OK |
| `/projects/d0f7c2f2-302c-5cb3-ab71-5430af6bec2c/edit` | OK |
| `/projects/planner/list` | OK |
| `/projects/planner/create` | OK |
| `/projects/planner/6843be51-93fc-5e90-a0c8-f73880e33382` | OK |
| `/projects/d0f7c2f2-302c-5cb3-ab71-5430af6bec2c` | OK |
| `/projects/documents/all` | OK |
| `/projects/documents/upload` | OK |
| `/projects/documents/0ab91ca0-cc9f-5b98-bcc8-f19a942aa3f3` | OK — file preview 403 is demo data (storage key with "/"), real uploads fine |
| `/settings` | OK |
| `/settings/security` | OK |
| `/settings/connectors` | OK |
| `/site-operations` | OK |
| `/site-operations/admin-dpr` | OK |
| `/site-operations/admin-dpr/workspace` | OK |
| `/site-operations/snag-lists` | OK |
| `/site-operations/snag-lists/workspace` | OK |
| `/site-operations/daily-reports` | OK |
| `/site-operations/daily-reports/new` | OK |
| `/site-operations/daily-reports/d5100000-0000-4000-8000-0000000000F5` | OK |
| `/site-operations/daily-reports/d5100000-0000-4000-8000-0000000000F5/edit` | OK |
| `/site-operations/visit-assignments` | OK |
| `/site-operations/qc/history` | OK |
| `/site-operations/checklists` | OK |
| `/site-operations/qc/handoff-status` | OK |
| `/site-operations/rfis` | OK |
| `/site-operations/mockups` | OK |
| `/site-operations/site-visits` | OK |
| `/site-operations/site-visits/new` | OK |
| `/site-operations/checklists/workspace` | OK |
| `/tasks` | OK |
| `/tasks/mine` | OK |
| `/tasks/all` | OK |
| `/tasks/crucial-work` | OK |
| `/tasks/overdue` | OK |
| `/tasks/blocked` | OK |
| `/tasks/completed` | OK |
| `/tasks/new` | OK |
| `/tasks/notes` | OK |
| `/tasks/zoho` | OK — Zoho not connected (external) |
| `/tasks/0b64db89-db09-4199-b5c3-1e0aa9eba4e5/edit` | OK |
| `/tasks/0b64db89-db09-4199-b5c3-1e0aa9eba4e5` | OK |
| `/clients` | OK |
| `/clients/new` | OK |
| `/clients/0b09f3d3-0e41-473c-9a8d-b2a5abde4f12/edit` | OK |
| `/clients/0b09f3d3-0e41-473c-9a8d-b2a5abde4f12` | OK |
| `/activity` | OK |
| `/chats` | OK |
| `/projects/roles` | OK |
| `/design-studio/activity` | OK |
| `/design` | OK |
| `/design-studio/roles` | OK |
| `/procurement/activity` | OK |
| `/build` | OK |
| `/ledger/roles` | OK |
| `/ledger/activity` | OK |
| `/console/activity` | OK |
| `/tasks/roles` | OK |
| `/tasks/activity` | OK |
| `/calendar/roles` | OK |
| `/calendar/activity` | OK |
| `/crm/activity` | fixed (CRM dashboard/widget links) |
| `/crm/roles` | fixed (CRM dashboard/widget links) |
| `/inventory/activity` | fixed (history URL, opening stock, reverse, post-save nav) |
| `/inventory/roles` | fixed (history URL, opening stock, reverse, post-save nav) |
| `/procurement/roles` | OK |
| `/site-operations/activity` | OK |
| `/site-operations/roles` | OK |