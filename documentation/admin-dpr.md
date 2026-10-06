# Admin daily progress report

Open **Site Operations → Admin DPR** (`/site-operations/admin-dpr`).
Add project progress entries and admin coordination entries. Existing entries can
be edited or deleted. Filter by date range and project, then use **Download Excel**.
The download fills the supplied ADMIN DPR template with all matching saved entries
and includes both report sheets. The coordination sheet is visible in the export;
the dropdown source sheet remains hidden. The template example is cleared.

## Database setup

Apply `db/migrations/20261006_admin_dpr.sql` to the application's MySQL database
before using this feature. Automatic Sequelize synchronization is disabled.
The migration creates the two tables if absent and preserves existing tables.

## API

All endpoints require a JWT and use the `/api/v1` prefix:

- `GET/POST /dpr/admin-reports`
- `GET/PATCH/DELETE /dpr/admin-reports/:id`
- `GET /dpr/admin-reports/summary?date=YYYY-MM-DD`
- `GET /dpr/admin-reports/export?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD&project_id=UUID`
- `GET/POST /dpr/admin-logs`
- `GET/PATCH/DELETE /dpr/admin-logs/:id`
- `GET /dpr/admin-logs/summary`

Lists return `{ data, meta }` with pagination. Export returns an `.xlsx` attachment
and ignores pagination. Its date and project filters apply to both sections.
Report-specific status/search/blocker filters apply to progress entries only.
Dates are written as Excel dates, and text remains literal cell content.
The template is packaged by Nest's asset configuration during backend builds.
