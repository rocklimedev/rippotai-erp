# Quality Check List & Architect Site Visit Schedule

Maps the two source Excel workbooks into backend models/services.

## Source workbooks → database

### 1. `ARCHITECT SITEVISIT SCHEDULE.xlsx`

| Sheet | Table | Service | Notes |
|-------|--------|---------|-------|
| Architect visit schedule | `architect_visit_stages` | `VisitStageService` + `ArchitectSeedService` | 21 stages; Visit Type enum |
| Quality check list | `quality_check_heads` | `QualityService` + seed | 18 heads (cleaned numbering) |
| Snag list | `snag_items` | `SnagService` | Per-project; optional `visit_id` |

Per-project results for the simple quality heads live in `project_quality_checks`
(`QualityService.projectChecklist` / `upsertCheck`).

### 2. `QUALITY CHECK LIST.xlsx`

| Sheet | Storage | Service | Notes |
|-------|---------|---------|-------|
| QC -Work heads | aligns with `WorkHead` enum + `quality_check_heads` | — | Sequential 1–17 |
| Waterproofing … Windows & Glazing | `WORK_HEAD_CHECKPOINTS` constant | `QualityChecklistService` | Before / During / After phases |

Detailed checkpoints are **not** seeded into DB as masters. They are applied
per project via:

```
POST /quality-checklists/from-template
{ "project_id": "...", "work_head": "WATERPROOFING" }
```

which creates `quality_checklists` + `quality_checklist_items` rows.

## Fixes vs original Excel / broken code

| Problem | Fix |
|---------|-----|
| Seed wrote `{ name, sort_order }` into `QualityChecklistItem` (wrong shape) | New model `QualityCheckHead` for the simple master list |
| `ProjectQualityCheck` FK’d the detailed item model | FK now points to `QualityCheckHead` |
| `ArchitectSeedService` / visit stages / quality / snag not in module | Registered in `SiteOperationsModule` |
| Electrical Before Execution = plumbing text | Replaced in `WORK_HEAD_CHECKPOINTS` |
| Flooring After = During items copied | Replaced with real post-checks |
| Duplicate S.Nos / duplicate Waterproofing | Cleaned to sort_order 1–18 |
| Typos (handoverr, Loction) | Fixed in `ARCHITECT_VISIT_STAGES` |

## Key API surfaces

```
GET  /architect/visit-stages
GET  /architect/quality/items              # master heads
GET  /architect/quality/checks?project_id=
PUT  /architect/quality/checks             # upsert pass/fail
GET  /architect/snags?project_id=

GET  /quality-checklists/templates
GET  /quality-checklists/templates/:workHead
POST /quality-checklists/from-template
GET  /quality-checklists/project/:projectId
```

## Files changed / added

```
models/quality-check-head.model.ts          NEW
models/project-quality-check.model.ts       FIXED (FK → QualityCheckHead)
constants/architect-visit-stages.constant.ts NEW
constants/quality-check-heads.constant.ts    NEW
constants/work-head-checkpoints.constant.ts  NEW
architect-seed.service.ts                    FIXED
quality.service.ts                           FIXED (uses QualityCheckHead)
quality-checklist.service.ts                 + createFromWorkHead / templates
quality-checklist.controller.ts              + template routes
site-operations.module.ts                    FULL wiring
```
