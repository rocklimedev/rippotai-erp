# Saved Admin DPR documents

Routes under `/site-operations`:

- `/admin-dpr`: paginated saved document records, initially across all projects and dates, with project/search filters and per-document Open DPR and Download Excel actions.
- `/admin-dpr/workspace`: the existing project progress and admin coordination editor. Save DPR archives every matching row from both sections, independent of the workspace's visible page, then opens the saved document. Save/cancel an open entry first.
- `/admin-dpr/:id`: read-only full saved document, containing both Excel sections and a Download complete Excel action.

`admin_daily_reports` and `admin_daily_logs` continue storing editable source entries. The new `admin_dpr_documents` table stores the generated document's filters, project membership/names, row counts, creator, creation time, complete JSON snapshots of both sections, and the exact XLSX bytes in a LONGBLOB. There are no archive update/delete endpoints. Later changes or soft deletion of source entries do not alter a saved document or its download.

The existing `/dpr/admin-reports/export` route also archives generated Excel files for compatibility. Downloads from `/dpr/admin-documents/:id/export` return stored bytes and do not regenerate or create another archive record.

Apply `backend/migrations/20261007_admin_dpr_documents.sql` after `db/migrations/20261006_admin_dpr.sql` before deploying the updated app. This is a non-destructive, re-runnable MySQL/MariaDB table-creation migration. It has not been applied in this task.

Previously downloaded Excel files were not retained by the old implementation and cannot be recovered as exact historical files. Existing database entries remain in the workspace and can be archived by selecting their dates/projects and saving a DPR. The records list contains saved documents.
