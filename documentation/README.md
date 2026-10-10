# rippotai-erp / vendors-quote — Documentation

Review owner: ERP maintainers
Last reviewed: 2026-10-10

Internal ERP module for managing vendor quotations against architecture/construction projects. Monorepo with a NestJS API and a React SPA.

The linked module documents have individual scopes and review histories. The dashboard read model document reflects the current implementation; older module notes may require verification against source.

## Repo layout

```
rippotai-erp/
├── backend/          NestJS API (Sequelize + MySQL, JWT auth, Socket.IO)
├── rippotai-erp-frontend/ React ERP SPA
├── vendor-quote/      React SPA (Redux Toolkit Query, Radix/shadcn UI, Tailwind)
├── docker-compose.yml Backend service definition (prod image from GHCR)
├── db.sql             Partial schema dump — see note in SETUP.md
└── .github/workflows/ CI: builds & deploys backend on push to main
```

## Where to start

| I want to... | Read |
|---|---|
| Understand the overall system | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Run the project locally | [SETUP.md](./SETUP.md) |
| Ship/deploy it | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| Work on a specific backend feature | [API README](../backend/README.md) and module documents below |
| Work on the frontend | [ERP frontend README](../rippotai-erp-frontend/README.md) |
| Understand Command Center and portfolio aggregation | [Dashboard read models](./dashboard-read-models.md) |
| Review session administration and retired verification routes | [Auth token administration](./auth-token-administration.md) |
| Review search access and staging index validation | [Search security](./search-security.md) |

## Domain in one paragraph

A **Project** (a construction/architecture job) needs materials or contractor work, so the team requests a **Quotation** from a **Vendor**. A quotation has line **items** (unit, quantity, rate) and moves through a review workflow — `draft → submitted → approved` (or `returned_for_editing` / `declined` / `cancelled`) — with full **version** snapshots kept at each significant edit. **RBAC** (roles/permissions) gates who can do what, every meaningful action is written to an **activity log**, and users get live **notifications** over WebSockets when something they care about changes.

## Backend modules

| Module | Doc |
|---|---|
| Auth (login, JWT, tokens, verification) | [backend/auth.md](./backend/auth.md) |
| RBAC (roles, permissions) | [backend/rbac.md](./backend/rbac.md) |
| Users (+ signatures) | [backend/users.md](./backend/users.md) |
| Vendors (+ categories, business types) | [backend/vendors.md](./backend/vendors.md) |
| Quotations (+ items, versions) | [backend/quotations.md](./backend/quotations.md) |
| Projects | [backend/projects.md](./backend/projects.md) |
| Reports | [backend/reports.md](./backend/reports.md) |
| Settings | [backend/settings.md](./backend/settings.md) |
| Engagement (activity logs, notifications) | [backend/engagement.md](./backend/engagement.md) |
| Metas (units) | [backend/metas.md](./backend/metas.md) |
| Common (guards, gateway, enums) | [backend/common.md](./backend/common.md) |

## Frontend

| Topic | Doc |
|---|---|
| Routing & pages | [frontend/routing.md](./frontend/routing.md) |
| State management (RTK Query) | [frontend/state-management.md](./frontend/state-management.md) |
| API layer conventions | [frontend/api-layer.md](./frontend/api-layer.md) |
| Components | [frontend/components.md](./frontend/components.md) |

## Known gaps (flagged for the team, not guessed at)

- No `.env.example` in either `backend/` or `vendor-quote/` — required env vars are inferred from source and listed in [SETUP.md](./SETUP.md); worth committing a real example file.
- `db.sql` at the repo root only contains **13** of the ~19 tables the Sequelize models define (missing `quotation_versions`, `units`, `vendor_business_types`, `vendor_categories`, `user_signatures`, `auth`/`verification` extras) — it looks like an early/partial dump rather than the current schema. Don't treat it as authoritative.
- Some mutation endpoints (e.g. most of `PATCH /vendors/:id`, `PATCH /quotations/:id/*`) don't show a guard at the controller level in static analysis — confirm whether auth is enforced globally, per-module, or actually missing before relying on this for anything security-sensitive.
