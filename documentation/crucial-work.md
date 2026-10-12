# Crucial Work in Tasks

Open Tasks → Crucial Work (`/tasks/crucial-work`). Create a crucial task or mark an existing task in its detail/edit page. Add the risk or reason in **Why it’s crucial**, assign an owner, and set a target date. Crucial Work is independent of task priority.

The master register contains every currently marked task, including completed tasks. Its stable Ref comes from the database and does not change when a task is reordered or filtered. References can have gaps because every task receives a reference before being marked. A crucial task cannot be permanently deleted while marked; complete it to retain it as Closed. Removing the marker excludes it from the register and exports.

Choose all projects or one project, a daily/weekly cycle, and its start date. Weekly cycles cover the selected date plus six days. The checklist includes open items due by the cycle end, overdue items, items without a target date, and any items explicitly checked in that cycle. Dates use Asia/Kolkata. Saved checks do not carry over to another start date or cycle type. Saving records the authenticated user as Checked By. Save each changed checklist row before exporting.

**Export Word** creates a genuine `.docx` by filling the supplied Crucial Works template. **Export PDF** creates a paginated PDF with both sections, repeated column headings, and embedded fonts. The six example tasks in the reference are examples only and are removed from generated reports. **Reference template** downloads the original document unchanged.

The Word template's package is retained: only `word/document.xml` changes. Its page size, margins, branding, tables, styles, headers, footers and relationships are preserved. Both exports include the entire marked master register for the selected project scope; checklist dates affect Part 2 only. Task statuses map to Open (`todo`), Closed (`completed`), or In Progress (other task statuses). Checklist checking does not automatically complete the task.

## Deployment

Apply `backend/migrations/20261012_crucial_work.sql` to the application database before deploying/restarting this backend. Synchronization is disabled. The rerunnable migration adds the marker, reason and stable reference columns and creates `crucial_task_checks`. Existing tasks start unmarked. No reference examples are inserted. The migration has not been applied by this implementation task.

Install backend dependencies, build both apps, and restart the backend. Nest copies the original `.docx` and PDF fonts into `dist/src/modules/tasks/templates`. Read/register/template/export routes require `tasks:read`; marking and saving checks require `tasks:update`; creation requires `tasks:create`. These are existing permissions and no new permission grants are needed.

## Validation

Run `npm test -- --config test/crucial-work-jest.json --runInBand` in `backend`, plus both app builds and `node backend/scripts/catalogue-routes.cjs --check` from the repository root. Tests cover date boundaries, checklist cycle isolation, marked task filtering, authenticated check attribution, deletion protection, input validation, template example removal, XML escaping, and preservation of all untouched Word package parts.

The sample PDF was rendered and checked across four pages, including a long row continued across pages. PDF text verification confirms the long row's final text and the last master task remain present. Word package/table structure was verified, but visual Word rendering could not be completed because the packaged environment lacks LibreOffice. Database migration and live database/UI checks have not been performed.

PDF body typography uses the supplied template's Lato styling; the macron glyph in the brand uses the repository's existing Noto Sans Bold font as a fallback. The original template uses Word's installed Lato font.
