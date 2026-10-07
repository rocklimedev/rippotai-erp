# Shortlist workspace repair

The supplied database schema uses legacy ENUM labels. The application uses
`Plumber` / `Contractor`, while the database accepted `PLUMBING` / `VENDOR`.
Non-strict MySQL stored incompatible labels as empty strings, making entries
invisible to the grid and causing subsequent edits to create more entries.
The status ENUM was also incompatible with SHORTLISTED, QUOTED and SELECTED.

## Deployment

1. Pause shortlist writes and run `backend/migrations/20261007_shortlist_workspace.sql`
   against the application database. The migration makes a permanent backup,
   changes the three ENUM columns to strings, converts unambiguous legacy trade
   labels, consolidates valid-coordinate duplicates, and adds a unique index
   for valid workspace coordinates. All discarded duplicates remain in the backup.
2. Restart the backend and deploy/reload the frontend.
3. Open a vendor or material shortlist. Use **Saved records needing a trade and
   work type** to place blank or legacy rows explicitly. Already-saved row data
   cannot be overwritten by recovery. Empty DRAFT skeletons can be replaced.

The migration does not infer missing trade/work type from vendor names or from
VENDOR/MATERIAL. These values do not identify Contractor/Individual/Freelancer.
It has not been executed by this code change. If foreign keys in another table
reference shortlist entry IDs, review duplicate consolidation before running it.

## Central API

- `GET /api/v1/project-shortlists/:id/workspace`: complete grid and unplaced entries.
- `PUT /api/v1/project-shortlists/:id/workspace/row`: required `trade` and
  `working_type` plus changed assignment, amount, status or selection fields.
  Optional `entry_id` explicitly recovers an existing unplaced row.
  Returns the same complete workspace response as GET.

Saves lock the parent shortlist in a transaction, reuse the existing coordinate
row, and update sibling selection flags atomically. A reload checks persisted
coordinates/status so outdated ENUM schemas fail and roll back rather than
returning a false success. The frontend serializes saves for the workspace,
replaces its grid cache with the returned workspace, and shows confirmation.
The original grid route remains compatible. Legacy entry creation uses the
same workspace save service instead of making duplicate rows.
