# Reports Module

Read-only aggregate/analytics endpoints powering the Reports dashboard page. All routes are `GET` — this module has no writes of its own; it queries across Projects, Vendors, and Quotations.

Base path: `/api/v1/reports`

## Endpoints

| Method | Endpoint | Handler | Guard |
|---|---|---|---|
| GET | `/api/v1/reports/by-project` | `getByProject` | — |
| GET | `/api/v1/reports/by-status` | `getByStatus` | — |
| GET | `/api/v1/reports/by-vendor` | `getByVendor` | — |
| GET | `/api/v1/reports/overview` | `getOverview` | — |

- `overview` — top-level KPI summary (likely counts/totals by status; confirm exact shape against `reports.service.ts` when documenting the response contract).
- `by-project`, `by-vendor`, `by-status` — quotation totals grouped by each dimension.

The backend has an `xlsx` dependency (see `SETUP.md`), suggesting exports to Excel are planned or available from this module or the frontend Reports page — verify current usage before documenting an export endpoint, none was found in the current controller.

⚠️ **Gap:** the frontend's `reports.api.js` also calls `GET /reports/by-employee` (commented "Admin only"), but no `by-employee` route exists in this controller yet. That frontend call will currently 404 — needs a backend endpoint added, or the frontend call removed if it's dead code.
