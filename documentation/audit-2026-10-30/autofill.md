# Autofill / interconnection report

## What was there
The `shared-project-data` service already read a few fields (site address, project type, floors, lift, client/project name) from earlier documents, and some forms already used `useSharedProjectData`. But:
- Site area, budget, dates and client contact details were not shared.
- There was no single home for the rooms list. Each document rebuilt its rooms from the brief or the recce, and a recce typed before the brief never reached the brief.
- The Scope of Work created a duplicate `project_spaces` row every time it was saved.
- The hook refilled a field straight after the user cleared it.
- Forms gave no hint that a value had been filled in.

## Canonical "project facts" (single source of truth)
- **Project facts** live on `projects`: `site_location`, `project_type_id`, `expected_completion_date`, plus these new columns: `site_area`, `site_area_unit`, `number_of_floors`, `lift_available`, `client_budget`, `desired_start_date`.
- **Client facts** come from `clients`: name, contact person, phone, email and address.
- **Rooms / spaces** live in `project_spaces`, the table the SOW already used. New columns: `area`, `length`, `width`, `height`, `measurement_unit`, `source_document`.
- **Reading:** `GET /projects/:id/document-prefill/:sequence` returns these in `shared`:
  - the facts above, plus `siteAreaSqft` (converted from gaj: 1 gaj = 9 sq ft, and back the other way)
  - `rooms[]`: project spaces, then recce rooms, then brief spaces, merged by name with blanks filled in; area = length x width when not typed
  - `roomCount`
  - `clientPhone`, `clientEmail`, `clientAddress`, `clientContactPerson`
  - `sources` for each key (`project` / `client` / a document sequence)
- **Precedence:** the value from the previous document wins. The project master is only a fallback, as before.
- **Write-back (fills empty canonical values only):**
  - Brief and recce saves fill any empty `projects` fact columns, using the existing afterSave backfill. `SHARED_PROJECT_FIELDS.Project` was extended for this.
  - Brief space-requirement rows and recce room rows sync into `project_spaces` through afterCreate / afterUpdate / afterBulkCreate hooks. New names are added, empty sizes and notes are filled, and a space someone soft-deleted is not brought back.
  - The SOW reuses an existing space with the same name or slug instead of creating a duplicate.

## Field → document matrix
F = filled on create (front end, plus a backend hook where marked B). W = can also write back into the canonical value when it is empty.

| Fact | Brief | Recce | Scope of Work | Budget Est. | Payment Sched. | Plan of Action | Quotation | Mat. Procurement | BOQ | PO | WO | Challan | Planner |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Site address | F/B/W | F/B/W | – | F/B (location) | – | – | – | – | F/B (location) | B (ship_to) | F/B | F/B | – |
| Project name | – | F/B | – | – | – | – | – | – | – | – | B | – | – |
| Client name | – | F/B | – | F/B | – | – | – | – | F/B | – | – | – | – |
| Project type | F/B/W | – | – | – | – | – | – | – | – | – | – | – | – |
| Site area (+unit) | F/B/W | F/B/W (carpet sq ft) | shown in SOW document | – | – | – | – | – | – | – | – | – | – |
| Floors | F/B/W | F/B/W | – | – | – | – | – | – | – | – | – | – | – |
| Lift | F/B/W | F/B/W | – | – | – | – | – | – | – | – | – | – | – |
| Room count | – | F (number_of_rooms) | – | – | – | – | – | – | – | – | – | – | – |
| Client budget | F/B/W | – | – | – | – | – | – | – | – | – | – | – | – |
| Start / target dates | F/B/W | – | – | – | – | – | – | – | – | – | F (target) | – | B (planned dates) |
| **Rooms list** | F (spaces) / W | F (rooms with sizes) / W | F (Spaces with size note) / W | F (one section per room when there is no scope yet) | – | – | rows carry room via budget item location → remarks | – | B (one section per room when nothing is priced yet) | – | – | – | B (locations) |
| Lines chain (existing, kept) | – | – | – | from SOW items (location = room) | value / GST from budget | phases from planner | from budget | from quotation | from procurement / quotation / budget / SOW | from BOQ / quotation | from BOQ / quotation | from PO | – |

Not applicable: the daily site report, design studio/drawings, client portal and leads collect no fields that overlap with these facts. Leads keep their own phone, email and budget, and are not written into.

## Front end
- **Hook:** the existing `useSharedProjectData` (`hooks/use-document-prefill.js`) is the one reusable hook, now wired to all 12 create forms. It:
  - fills only blank fields, and each field only once per project, so a cleared field stays clear
  - never overwrites what the user typed
  - returns `{ filled, filledFrom }`
- **Hint:** `components/PrefillNotice.jsx` adds one subtle line under each form's subtitle, e.g. "Filled from Client details, Client Brief · 3 fields. Edit anything to override." In the brief, each field's own hint changes to "Filled from <document>". The line disappears once the user edits those fields.
- **Form ↔ PDF:** the PDFs render the saved document values, which are the same values that were filled in. The SOW document's "Total area" now uses the canonical project site area, which used to point at a column that didn't exist.

## Verification
- **API, demo DB:**
  - New client + project + brief (250 gaj, 3 floors, lift, budget, 3 rooms). The project facts were written back (`site_area=250 GAJ`, floors, lift, budget, completion date) and `project_spaces` got the 3 rooms.
  - All 13 prefill sequences returned the address, area (2250 sq ft), floors, lift, client name and phone, and the rooms.
  - A recce created with no address or area typed was auto-filled by the backend. Its new room (Puja) and sizes (Kitchen 12x10) flowed into `project_spaces`.
  - **Reverse direction:** a project whose recce came first (1350 sq ft, 2 rooms) gave the brief prefill 1350 SQ_FT and Hall 280, Bedroom 1 132.
  - A BOQ created with nothing priced got sections = rooms.
  - A SOW saved with "Kitchen" reused the existing space instead of duplicating it.
- **Playwright UI:** checked the brief, recce, SOW, budget estimate, WO, challan, quotation, payment schedule, plan of action and procurement pages.
  - The notice appears and the values show on the brief, recce, SOW, budget, WO and challan.
  - Quotation, payment, plan and procurement correctly show nothing until their previous document exists.
  - No new console errors. The existing `injectEndpoints` override warnings are not from this work.
  - Screenshots: `/tmp/inos3/scratch/autofill/*.png`.
- **Tests:**
  - `npx jest src/modules/documents src/modules/boqs src/modules/scope-of-work src/modules/projects`: 86/86 pass. New spec: `documents/project-facts.spec.ts`.
  - Front end: `node --test src/hooks/project-facts-prefill.test.js` passes.
  - `npm run build` passes on both front end and backend; eslint shows no new errors in the touched files.

## Files
- **Backend** (commit `3dcd1e9`):
  - `documents/shared-project-data.ts`, `shared-project-data.service.ts`, `document-prefill.ts`, `project-facts.spec.ts`
  - `projects/models/projects.model.ts`, `projects/project-planner.service.ts`
  - `scope-of-work/models/project-space.model.ts`, `scope-of-work/scope-of-work.service.ts`
  - `boqs/boq.service.ts`
- **Front end** (commit `c189634`; only my hunks were staged, other workers' uncommitted changes in the same files were left alone):
  - `hooks/document-prefill.js`, `hooks/use-document-prefill.js`, `hooks/project-facts-prefill.test.js`
  - `components/PrefillNotice.jsx`, `components/BriefSectionForm.jsx`
  - the 12 form files, plus `pages/scope-of-work/ScopeOfWorkView.jsx`

## Migration
- `backend/migrations/20261030_autofill_project_facts.sql`: adds columns only. It is idempotent on both MySQL 8 and MariaDB (checks `information_schema` and uses a prepared ALTER) and inserts no data. Already applied to the local DB.

## Left undone / notes
- The PO form has no ship-to field, so the backend fills `ship_to_address` and the PO PDF already falls back to the project site.
- The planner has no project-level fact fields in its form. It is filled on the backend only (dates and locations).
- Existing front-end test `src/hooks/document-prefill.test.js` was already failing before this work:
  - it imports `use-autosave.js` → `AuthContext` without an extension
  - its sequence test expects `planner-procurement` in `config/documentSequence.js`
- Test records left in the demo DB: projects "AF Project …", "AF Reverse …", "UI Autofill …" and clients "AF Client …", "UI Client …".
