# Permissions worker report

## Access levels (cumulative, named)
They bundle the existing `resource:action` permissions in `role_permissions`. No parallel grant system was added.

| Level | Key | Grants actions |
|---|---|---|
| No access | `none` | nothing. The app is hidden and its routes show a "No access" page |
| View only | `view` | read, export |
| View & Edit | `edit` | + update, upload, submit, recalculate, select, send, share, check-in, sync, refresh, review, complete, receive, assign, generate, connect, execute, apply |
| Create | `create` | + create, issue, return, transfer, adjust, deliver, prepare, publish, accept |
| Full access (incl. Remove) | `full` | + delete, restore, approve, reject, lock, cancel, clear, reopen, override, reset, revoke, grant, sign-off, authority, reindex |

Any unknown action falls into `full`, so it is never handed out by accident. A part with no actions at a given level (for example no `delete`) only offers the levels that make a difference. Grants that do not fit a level show as **Custom**. An app whose parts differ shows as **Custom mix**.

## App -> documents/parts -> permission resources
Source: `backend/src/modules/rbac/access-catalogue.ts`. Every `@RequirePermission` in `backend/src` is assigned to a part (checked by `access-catalogue.spec.ts`), except public and own-account routes.

**Dashboard** (`dashboard`)
- Dashboard & widgets: dashboard, dashboards
- Reports: reports

**Projects** (`projects`)
- Project register: project-dashboard, projects, projects-phases
- Clients: clients
- Project planner (document): project-planners
- All documents & files: document-requirements, documents
- Stage gates & workflow: gates, workflow, workflow-library, workflow-progress, workflow-timeline
- Client portal sharing: client-portal

**Design** (`design`)
- Leads pipeline: leads
- Client brief (document): project-briefs
- Site recce (document): site-recces
- Scope of work (document): scope-of-work
- Plan of action (document): plan-of-actions
- Business proposal (document): business-proposals
- Drawings (document): drawings
- Budget estimate (document): budget-estimates
- Budget guide (document): budget-guides
- Payment schedule (document): payment-schedules

**Build** (`build`)
- BOQ (document): boq, boq-activity
- Quotation / estimate (document): quotation-items, quotations
- Rate & item library, BOQ templates: boq-catalog, boq-templates, library
- Materials master: materials
- Site inventory: inventory
- Material requirement (document): procurement-requirements
- Procurement estimate (document): procurement-estimates
- Procurement sheet (document): material-procurement
- Vendor quotation (document): procurement-quotations
- Rate sheet (document): procurement-rate-sheets
- Sample board (document): procurement-sample-boards
- Rate comparison (document): vendor-rate-comparisons
- Purchase order (PO) (document): purchase-orders
- Work order (WO) (document): work-orders
- Delivery challan (document): delivery-challans
- Vendor directory: vendor-business-types, vendor-categories, vendors, vendors-saved-searches
- Vendor shortlists: project-shortlists, shortlist-entries, shortlist-packages
- Daily site report (document): site-ops, site-ops-daily-reports
- Admin DPR (document): dpr-admin-documents, dpr-admin-logs, dpr-admin-reports
- Site visit assignments: site-ops-visits
- Snag list (document): site-ops-snag-lists
- Quality checklists (document): quality-checklists, site-ops-checklists, site-ops-qc
- RFIs & mock-ups (document): site-ops-mockups, site-ops-rfis
- Architect site visits & quality: architect-quality, architect-snags, architect-visit-stages

**Tasks** (`tasks`)
- Tasks: tasks
- Notes: notes

**Calendar** (`calendar`)
- Calendar events: calendar-events

**Command Center** (`commandCenter`)
- Command center & evidence: command-center
- Authority panel: command-center

**Admin Console** (`adminConsole`)
- Users & team: sessions, team, user-signatures, users
- Roles & permissions: apps, permissions, rbac, role-apps, role-permissions
- Company settings: settings
- Masters (document types, phases, units, terms): document-types, phase-definitions, project-types, terms-templates, units
- Activity log: activity-logs
- System & search index: search, system

**Automation** (`automation`)
- Automation rules: automation

**Workspace & connectors** (`settings`)
- Notifications, search & uploads: cdn, notifications, search, workspace
- Connectors (Google, Microsoft, Zoho): auth-google, auth-microsoft, auth-tokens, auth-zoho, google-calendar, google-tasks, onedrive, sync, zoho-bigin, zoho-calendar, zoho-cliq, zoho-projects, zoho-workdrive

## Backend
- `access-catalogue.ts`: levels, action->level map, catalogue, `computePartLevel`, `permissionsForLevel`, `summarizeAccess`.
- `access-matrix.service.ts` + `access-matrix.controller.ts` (in RolesModule):
  - `GET /role-access/catalogue` (`role-permissions:read`): levels plus apps/parts with their real permission names.
  - `GET /role-access/:role_id` (`role-permissions:read`): app level, each part's level, available levels, custom flag and granted permissions, derived from `role_permissions`.
  - `GET /role-access/app/:code` (`role-permissions:read`): one app's level for every role (used by the per-app Roles page).
  - `PUT /role-access/:role_id` (`role-permissions:assign`), body `{apps:{code:level}, parts:{key:level}}`. App levels apply first, then part overrides. It works out the grants to add and remove in one transaction and keeps `role_apps` in step for the catalogue apps. It writes an activity log and invalidates the role-permission cache. Removals also need `role-permissions:revoke`. The operator must hold every permission they grant. ADMIN/SUPERADMIN roles can only be edited by SUPERADMIN, and can never drop below Full on Users and Roles. An operator cannot remove their own `role-permissions:assign`.
- `/auth/me` now returns `user.access = {apps:{code:level}, parts:{key:level}}`, computed from the session's permission list (no extra DB query).
- `route-catalogue.json` regenerated from code. It now includes the 4 new routes, plus `command-center:authority` and the inventory routes other workers added.

## Migration
`backend/migrations/20261030_permissions_access_levels.sql` (applied to the demo DB, run twice to confirm it is idempotent). It inserts the catalogue apps with `INSERT IGNORE`, then grants `role_permissions` and `role_apps` by role NAME. It is additive only, never revokes, and skips roles or permissions that do not exist. Default levels:
- ADMIN, SUPERADMIN: Full on everything.
- PRINCIPAL_ARCHITECT: Full on Dashboard, Projects, Design, Build, Tasks, Calendar, Command Center (incl. authority panel), Workspace. Admin Console: Users/Roles/Settings/Activity View, Masters Create. Automation View.
- PROJECT_LEAD / "Project Lead": Create everywhere except authority panel (none) and Admin Console (Users and Masters View only). Automation View.
- SENIOR_ARCHITECT, SENIOR_INTERIOR_DESIGNER, ARCHITECT: Design documents and BOQ Create. Planner and documents Create. Other Build parts View. Tasks and Calendar Create. Command Center Edit.
- JUNIOR_ARCHITECT, JUNIOR_INTERIOR_DESIGNER: as Senior, but Command Center View.
- SITE_ENGINEER, SITE_SUPERVISOR: Daily report, snag list, checklists, RFIs/mock-ups, inventory and material requirement Create. Site visits and delivery challan Edit. Design documents (brief, recce, SOW, POA, drawings) View. BOQ, PO and WO View. Commercial documents none.
- USER: Dashboard, notifications, own Tasks/Notes Create, Calendar View.
- CLIENT: notifications only. The client portal works through the own-account `client-home` route.
- DEVELOPER: untouched.

The generator script is in `/tmp/inos3/scratch/permissions/gen.ts`. Re-run it if the catalogue changes.

## Frontend
- `src/lib/permissions.js`: levels, `hasPermission`, `canOpenApp`, `appForPath`, the route->resource table, `routeRequirement`, `documentAccess`, `filterMenus`.
- `src/hooks/use-permission.js`: `usePermission(resource, action)`, `useAccess()`, `useDocumentAccess(resource)`, `useRouteAccess()`.
- `src/components/permissions/`: `Can.jsx` (`<Can resource action>`, `<Can I="boq:create">`, `<Can action="create">` for the current route), `NoAccess.jsx` (polite page), `RouteAccessGate.jsx` (the router guard).
- Central enforcement:
  - `router/generate-routes.jsx` wraps every protected route element in `RouteAccessGate`. It blocks apps with no access and document routes the role lacks (read for lists, create for `/new` and `/forms/*`, update for `/edit`), and shows the polite page.
  - On document routes it hides the common New/Edit/Delete buttons by the existing testid/title conventions (`*-new-btn`, `*-edit-*`, `*-delete-*`, `title="Edit|Delete"`).
  - View-only roles see combined view/edit workspaces (`…/workspace`, `/ledger/boq/:id`) inside a disabled fieldset with a "View only" banner.
- Launcher (`pages/Dashboard.jsx`), app switcher (`AppSwitcher.jsx`) and header menus (`TopHeader.jsx`, via `filterMenus`) hide apps and items with no access.
- Added testids to New buttons in BoqDashboard, PurchaseOrderList, WorkOrderList, DeliveryChallanList and DailySiteReportsPage, so the central hide applies to them. These are tiny edits in pages owned by others.
- `pages/settings/RolesPermissions.jsx` rewritten as a minimal matrix:
  - roles list on the left
  - a legend of the 4 levels
  - apps as collapsible rows, each with a level selector
  - each document/part inside with its own selector, plus Document and Custom tags
  - New role and Delete role kept
  The old raw permission checklist and package picker were removed from this page. The backend endpoints remain.
- `pages/workspace/AppRolesPage.jsx`: per-app page with a level selector per role.
- `api/users/rbac.api.js`: `useGetRoleAccessCatalogueQuery`, `useGetRoleAccessQuery`, `useGetAppRoleAccessQuery`, `useSetRoleAccessMutation`.

## Verification
- Backend and frontend builds pass. The backend was restarted. The rbac jest suite passes (34), including the new `access-catalogue.spec.ts`.
- Demo DB only: role `QA_TEST_ROLE` and user `qa.perm@rippotai.in` (password the same as admin), created by SQL, not in a migration.
- API, as the QA user with Design View, Build PO Create, Leads none:
  - `GET /project-briefs` 200
  - `POST /project-briefs` 403
  - `DELETE /purchase-orders/:id` 403
  - `GET /users` 403
  - `PUT /role-access` 403
- Playwright, as the QA user:
  - The launcher shows only Projects, Design and Build.
  - `/tasks` and `/console` show "No access".
  - The brief list loads (16 rows) with New and Edit hidden.
  - `/crm/forms/project-brief` is blocked.
  - The PO list shows New Purchase Order.
  - The WO list is blocked.
  - The header shows only allowed menus.
  - No page errors.
- Playwright, as admin: in Roles & permissions, set QA role "Client brief" to Create. The QA user then sees New and Edit, the form opens, and `POST /project-briefs` gets past the guard (400 validation). Cache invalidation works.
- Screenshots: `/tmp/inos3/scratch/permissions/shots/`.

## Left undone / notes
- `staff-rbac.spec.ts` "artefacts in sync" was already failing before this work and still fails. It also expects `../documentation/staff-api-permissions.md`, which is missing from this tree, and the regenerated old `20261010_staff_route_permissions.sql`. I did not rewrite that old migration.
- The UI hides buttons by testid/title convention. Pages without those conventions still show their buttons, but the backend returns 403. `<Can>` and `useRouteAccess()` are there for owners to adopt page by page.
- Read-only form disabling only applies to workspace-style pages. Plain `/edit` and `/forms` routes are blocked outright for roles without update/create.
- The migration is additive. Existing roles that already hold more than the defaults keep it. Lower a role in the new matrix to tighten it.
- An admin who changes their own role sees the new launcher after the next `/auth/me` (reload).
