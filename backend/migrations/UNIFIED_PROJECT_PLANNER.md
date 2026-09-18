# Unified project planner

Apply `20260918_unified_project_planner.sql` once to MySQL 8 before deploying this change. Back up the database first using the normal deployment process. The migration retains task, location-relation and procurement IDs, moves their planner references to one current planner per project, and archives the former sheet planners. It does not erase their metadata or project progress.

`POST /projects/:projectId/planners/initialize` retains the array response shape and returns one `PROJECT` planner. Legacy create requests still resolve to this planner. Existing archived sheet URLs resolve to the current project planner. Consultancy and PMC remain phase modules; material and labour remain procurement item types.

`POST /planners/:plannerId/generate-template` populates both phase modules and procurement categories from the versioned Excel defaults. Stable task-template IDs and procurement keys prevent syncing from duplicating edited rows. Removed default tasks remain removed. Syncing attaches newly added locations without resetting existing status/progress.

`GET /projects/:projectId/planners/overview` supplies the four frontend views. `GET /projects/:projectId/planners/workbook.xlsx` exports Overview, Consultancy, Vendor & Procurement, and PMC using project locations and saved data. Example supplier names and dates in the reference are not seeded into projects.
