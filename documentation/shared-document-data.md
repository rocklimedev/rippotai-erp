# Shared project data

## Connected document uploads

The Command Center upload modal embeds the same `DocumentUpload` form as the
document upload page. Project, document type, title and file are required;
visibility and remarks are shared as well. Command Center fixes the project and
document type to the selected checklist item. Both flows enforce the 500 MB
file limit. Client visibility is sent as the API value `external`.

The modal retains the Command Center upload endpoint and permission, including
its activity log, uploader attribution, review policy and source-module checks.
The full page uses the documents endpoint. Both persist to the document register
with the project, document type and checklist requirement linked. Documents
requiring approval remain submitted; uploads without required approval are
approved. Successful uploads refresh the document register, requirements,
document dashboard, project phases and Command Center views.

Drawing checklist items open the same modal using the shared Design Studio
`DrawingUploadPage`. The selected project and drawing type are fixed in the
modal. Title, drawing number, revision, issue date, sheet number, drawn by,
checked by and notes use the register's existing batch/revision workflow.
The regular upload page also offers a drawing checklist type selector.
Creation validates that the type targets drawings and links the corresponding
project requirement. Uploading does not bypass drawing review or approval.
Successful revision uploads refresh the drawing register and Command Center.

## Uploaded evidence approval

All Documents shows **Approve document** for the latest uploaded document that
has not been approved or archived. The drawing register shows **Approve drawing**
in grid and table views when a current drawing has an uploaded revision awaiting
approval. These actions use the existing `documents:approve` grant; the API
enforces it on `POST /documents/:id/approve` and `POST /drawings/:id/approve`.
Native module records retain their source-module approval workflow.

Document approval completes its linked requirement. Drawing approval marks the
latest revision and drawing approved, records `approvedBy`, and completes the
requirement only when every non-superseded drawing sheet for that type is approved.
Approval refreshes document/phase and Command Center caches and invalidates the
project's gate-readiness cache. It does not automatically clear a gate.

Replacing an approved document file sends it back for review when its type needs
approval. Uploading a new drawing revision resets the drawing to Draft by default
and clears its previous reviewer. Command Center therefore checks the new upload
rather than retaining approval from the old file. Locked/archived documents,
older document uploads and drawings without an uploaded revision cannot be
approved through these actions.

### Command Center evidence drawer

The **Documents & drawings** action opens a project browser inside Command Center.
Phase checklist and Document Control **View & approve** actions open the same
drawer scoped to the selected project and checklist type. Native records keep
their source-module actions. Metadata loads only when the drawer is open; file
contents load only on Preview or Download.

The drawer lists uploaded document records and drawing sheets/revision history.
PDFs and supported raster images up to 25 MB can be previewed through authenticated
download endpoints and temporary object URLs. Other files are downloadable.
Older uploads remain inspectable, but approval is offered only for the current
upload, with the same `documents:approve` permission and approval endpoints as the
registers. Approval refreshes Command Center's evidence and final checks.

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
