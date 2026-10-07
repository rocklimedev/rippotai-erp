# Shared project data

The project, project brief, site recce, budget estimate, work order and delivery
challan reuse matching shared fields. The explicit field map lives in
`backend/src/modules/documents/shared-project-data.ts`; document-specific dates,
notes, amounts, quantities and statuses are intentionally absent from that map.

When a user selects a project, connected forms fetch
`GET /projects/:id/shared-document-data`. Blank fields are filled automatically.
Boolean values and zero are valid data. Values typed by the user are preserved.
Switching projects clears unchanged values inserted by this form's autofill.

Backend model validation fills missing shared fields on normal instance creates
and updates. After a save, missing fields in existing editable records for that
project are backfilled in the same transaction. Approved, published and locked
documents are preserved. Updates compare original field values and status to
avoid overwriting concurrent edits. Synchronization does not recurse.

Project master data has priority. Documents are read by descending version when
available, otherwise descending creation date. Existing conflicting values are
preserved rather than silently reconciled. Existing records are backfilled on
the next save of a connected record; no bulk data migration is run.

Supported data: site address, project type, floor count, lift availability, client
name, project name (where the receiving model has corresponding fields).
The project and client records supply authoritative names.
Values exceeding a receiving column's length are skipped without truncation.

Successful saves invalidate related frontend query caches. No new database table
or migration is required. Model hooks require a backend restart. Bulk operations
that disable hooks do not invoke synchronization.

Room/item conversion, commercial values and payment milestones require explicit
source/target mappings before extending this mechanism. A room, priced item and
payment stage have different identities and must not be copied solely because
their field names match.
