# Saved vendor rate comparison sheets

Apply `20261008_vendor_rate_comparisons.sql` before deploying the API. Schema synchronization is disabled. The foreign-key UUID columns use the `utf8_unicode_ci` collation in the checked-in projects and BOQs schema; match those columns to the deployed parent ID collation if the database has been converted.

`GET /api/v1/vendor-rate-comparisons` lists sheet metadata, optionally filtered by `project_id`. `POST` creates a sheet; `GET /:id` restores it; `PUT /:id` saves changes with the current `revision` to prevent lost updates. These routes require an authenticated user.

Each sheet links to exactly one project and one BOQ belonging to that project. Those links stay fixed after creation. The schema-versioned JSON snapshot stores the BOQ categories, quantities and baseline rates, selected vendor identities and names, entered vendor rates, item-level quotes and L1 results, and totals. Source BOQ changes do not modify saved comparison sheets. Updating a sheet replaces its current snapshot and increments its revision; revisions are concurrency counters, not an archive of previous snapshots.

Frontend routes: `/procurement/vendors/rate-comparison` lists sheets, `/new` opens a new workspace, and `/:id/edit` reopens a saved sheet. CSV export remains available.
