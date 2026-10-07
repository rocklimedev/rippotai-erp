# Snag List documents

Source: `ARCHITECT SITEVISIT SCHEDULE.xlsx`, `Snag list ` sheet, row 3. Each saved document contains S. No., Floor, Room, Category, Observation, Photo, Scope, Status and Remarks. Serial numbers follow the row order. The blank source sheet specifies no status choices; the app uses its existing Open, In Progress, Rectified and Closed states.

Site Operations routes:

- `/site-operations/snag-lists`: all saved documents with project/search filters, pagination and Open, Edit and Download Excel actions.
- `/site-operations/snag-lists/workspace`: create a project document and multiple snag rows.
- `/site-operations/snag-lists/:id/workspace`: edit the same document. Its project is fixed, and a revision check prevents overwriting another user's changes.
- `/site-operations/snag-lists/:id`: full document view, including attached photo previews and Excel download.

The authenticated `/site-ops/snag-lists` API provides document CRUD (create/read/update), photo upload through the existing CDN, and stored Excel download. No delete endpoint is provided. The service, export service, controller and both database models are registered in `SiteOperationsModule`.

Every save atomically writes the current document, complete row records and exact generated XLSX bytes, plus an immutable revision snapshot in `snag_list_revisions`. Earlier revisions remain in the database; the UI downloads the current revision. The export uses the supplied workbook template and includes only the Snag list worksheet. Photos are exported as attachment URLs, with a hyperlink when there is one photo, without fetching external images.

Apply `backend/migrations/20261007_snag_list_documents.sql` before deploying. The re-runnable migration creates independent document/revision tables and preserves existing `snag_items`. It has not been applied in this task. Legacy individual snag rows are not automatically grouped into new documents.
