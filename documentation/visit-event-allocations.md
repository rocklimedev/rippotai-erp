# Visit event allocations

Each assignment is one event with a project, allocated team or named visitor, scheduled date and purpose. Architect events require a standard stage from the supplied workbook. The stage name, checks and visit type are copied from the fixed catalog and locked. Repeat visits at the same stage use separate allocations; there is no recurrence or requirement to complete stages in numeric order.

Snag functionality is outside this change. Visit 20 (snag closure) is excluded from new allocations. Pre-handover inspection and final handover remain available. Visit 12 includes the ceiling electrical check remark in the source workbook.

## Flow

Allocate an event in Visit Assignments, then use Record visit to record attendance and findings. Project, visitor type and stage are immutable. Before a log exists, Edit changes the original event's date or allocated visitor. Changing stage requires cancelling the old allocation and creating another. A logged event cannot be edited. Cancelling the allocation cancels its scheduled log; completed events cannot be cancelled. Cancelled allocations cannot be reopened through attendance or status updates.

The routed Site Visits list, creation and detail screens use the same allocation/log API. The old `/architect/visits` endpoints had no registered backend controller. Historical `architect_site_visits` records remain in storage and are not converted because they lack a reliable event allocation mapping. The revised list shows `site_visit_logs`.

## Deployment

Run `backend/migrations/20261007_visit_event_allocations.sql` after the project UUID migration and before starting the updated application, during a maintenance window with a database backup. The script uses MySQL/MariaDB `DELIMITER` syntax and requires permission to create/drop its helper procedure.

The re-runnable migration adds nullable event columns for historical compatibility, makes frequency nullable, and upserts the standard stage master while keeping existing stage IDs. New application events always write null recurrence fields. It copies undated recurring assignments into `visit_assignments_legacy_20261007`, then deactivates them. Existing logs and assignment references remain intact. Dates and stages are not guessed from recurrence; allocate future visits explicitly.

The final verification queries should report 20 enabled standard stages and zero active events missing dates. The legacy backup is created once. MySQL DDL commits independently of the data transaction; a schema rollback requires restoring the database backup, not just rolling back DML.

The SQL has not been executed against a database in this task. Regression tests cover event validation, fixed stage metadata, immutable allocation fields, edit behavior, cross-project/type/date linking, duplicate logs, cancellation and attendance transitions.
