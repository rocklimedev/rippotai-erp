# Quality checklist template

The prior backend did not fully represent `QUALITY CHECK LIST.xlsx`: checkpoint constants rewrote source wording and removed repeated rows; the simple catalog used a different work-head list. The workspace now follows `QC -Work heads` (17 heads) and the 12 detailed sheets (165 checkpoints).

Run `20261003_quality_checklist_template.sql` against the configured MySQL database **before deploying**. Sequelize schema synchronization is disabled. This migration has not been applied to a live database.

It adds a database-backed template catalog and work-head/template identity fields on project checklists and the existing quality-head catalog. It seeds all source checkpoint wording, original serial numbers, phases, titles and sheet labels. Existing project checklist results are left unchanged; new checklists snapshot the seeded template. Existing head IDs and project results are retained. Two obsolete bathroom catalog rows are deactivated and retained; the separate windows/glazing head is added. Custom heads are retained.

The workbook itself contains inconsistencies: electrical before-execution rows use plumbing language, two electrical final checks repeat, and flooring repeats during-execution checks in the after-execution section. These are preserved because the supplied workbook is authoritative. Review and revise the source before changing the seed; the implementation does not invent replacements. The trailing `Quality check list` sheet is an older, duplicate catalog; the workspace and export use the primary `QC -Work heads` catalog. Five structural heads have no detailed sheet; they support custom project checkpoints instead of invented template data.

Open `/site-operations/qc/list`, select a project, then create a checklist from a work-head template or create custom checks. Save acceptance, status, remarks and inspection dates on each checkpoint. Work-head status and remarks are recorded separately in the overview; they are not inferred from potentially multiple checklists at different project locations. Mark passed requires a nonempty checklist with every checkpoint explicitly accepted.

**Excel is built in the frontend from fresh saved JSON**, using a lazy-loaded ExcelJS module. Single-checklist export reproduces its five source columns and Before/During/After groups. Project export contains the work-head overview and every saved project checklist, including beyond the workspace's current page. Duplicate sheet names get safe unique suffixes. Exports do not include unsaved field drafts. Inspection date and inspector remain available in API JSON, with the five source columns retained in Excel.

New JSON endpoint: `GET /quality-checklists/project/:projectId/export-workbook`. Existing single JSON export: `GET /quality-checklists/:id/export`. Template creation uses a validated DTO. Both quality controllers use the existing JWT guard. Pagination loads child items separately so counts and row order remain correct. The static bulk-update route precedes the dynamic item route, and bulk changes validate targets and use a transaction.

Validation commands:

- Backend: `npm run build`; `npx jest --config test/quality-jest.json --runInBand`.
- Frontend: `npm run build`; `node --test test/quality-checklist-excel.test.mjs`; targeted ESLint.

Seed provenance: `constants/quality-checklist-template.source.json`, extracted using `scripts/extract_quality_template.py`. Rerun it with the bundled Python and the source workbook path to regenerate the JSON and SQL. Text is trimmed at its edges only; duplicate checkpoint text and original numbering remain intact.

Rollback requires deploying the previous code before removing the new columns/table. Do not delete existing head rows or project results. Keep the new head metadata and catalog additions if project records now reference them; dropping `quality_checklist_templates` alone removes reusable templates but does not remove project checklists.
