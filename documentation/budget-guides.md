# Ledger Budget Guides

Open **Ledger > Documents > Budget Guides** (`/ledger/budget-guides/all`). Create a blank guide or load **Use construction reference** to start from the supplied Specification & Budget Guide PDF. Reference prices are editable sample values from that document; they are not current market quotes.

Every guide has exactly three independently editable plans. Essential, Signature and Bespoke are the initial labels; labels and specifications can be changed for any project type. Each plan owns its cost heads, dedicated quantity/rate items and material rate schedule. Guide details include currency, area unit, optional built-up area, issue date, guide validity, rate validity, pricing notes, exclusions and next steps.

## Project reuse

Project linking is optional. Save with **Standalone / generic** to keep a reusable guide. Choose a project in the editor to link it later, or use **Copy guide to a project** to create an independent draft linked to a project. Copies retain all three plans and their details, record `source_guide_id`, and leave the original unchanged. Editing or deleting the source does not mutate its project copies. The project selector does not modify project records, BOQs, quotations or existing Budget Estimates.

## Calculations

- **Distribution:** cost head rate = plan target rate × share / 100; head amount = rounded head rate × built-up area. The plan budget = target rate × built-up area. Without an area, rate ranges remain available and total amounts are absent. Rates and amounts round to two decimals.
- **Itemized:** each item amount = quantity × lower/upper rate; rounded item amounts sum into heads and the plan budget. This mode does not use the percentage distribution to compute totals.
- **Material schedule:** material-unit reference rates never add to the build budget. Fitted rows indicate supply plus installation. Other rows default to supply-only.
- Dedicated item subtotals in distribution mode are shown separately and do not double-count the distribution.

The server computes all totals. Client totals are ignored. Ranges must be non-negative and ordered. Drafts may have incomplete cost shares. Publishing requires a cost breakdown and material schedule for each plan, a positive distribution rate with shares totaling 100%, or a positive itemized budget. Guide validity is added in calendar months with month-end clamping; rate validity is added in days independently.

## API

`BudgetGuideModule` owns the controller, service, model, nested DTOs, template and calculation logic. Plans are persisted together as validated JSON aggregates in a dedicated `budget_guides` table. Mutations use row locks and `expected_revision` to reject stale updates or deletions with HTTP 409.

| Method | Endpoint | Permission |
| --- | --- | --- |
| GET | `/api/v1/budget-guides/template` (optional `reference=construction`) | `budget-guides:read` |
| GET | `/api/v1/budget-guides` | `budget-guides:read` |
| GET | `/api/v1/budget-guides/:id` | `budget-guides:read` |
| POST | `/api/v1/budget-guides` | `budget-guides:create` |
| PATCH | `/api/v1/budget-guides/:id` | `budget-guides:update` |
| POST | `/api/v1/budget-guides/:id/transfer` | `budget-guides:create` plus read |
| DELETE | `/api/v1/budget-guides/:id?expected_revision=N` | `budget-guides:delete` |

Lists support `search`, `status`, `project_id`, `generic=true`, `page` and `limit` (maximum 100). Transfer accepts `project_id`, `expected_revision` and optional `title`; updates require `expected_revision`. Project linking/transfer also requires `projects:read` and an existing project. Module permissions follow the existing staff access model; project links are not a new row-visibility policy.

## Deployment

1. Apply `backend/migrations/20261012_budget_guides.sql` to create the table. Automatic schema synchronization remains disabled.
2. Apply the regenerated `backend/migrations/20261010_staff_route_permissions.sql` to register the four Budget Guide capabilities and grant them to existing ADMIN/SUPERADMIN roles. Grant only the required capabilities to other staff roles through RBAC.
3. Restart the backend and refresh the frontend.

No database migration was executed during implementation. The printable preview offers browser **Print / Save as PDF**; it does not invoke a server document renderer. Normal guides and project copies are saved in the database, not browser storage.

Validation: backend/frontend builds, focused guide tests and the complete staff route permission audit. Browser checks use mocked API responses and do not verify a live database migration or write real projects.
