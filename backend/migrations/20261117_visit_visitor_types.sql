-- Match VisitorType in site-operations.enums.ts for allocations and visit logs.
-- Preserve INTERNAL/EXTERNAL values used by historical rows. Re-runnable.
-- Apply before restarting the backend. MySQL DDL implicitly commits.
ALTER TABLE visit_assignments
  MODIFY COLUMN visitor_type ENUM(
    'INTERNAL','EXTERNAL','SUPERVISOR','ARCHITECT','VENDOR','CONTRACTOR','CLIENT','OTHER'
  ) NOT NULL;

ALTER TABLE site_visit_logs
  MODIFY COLUMN visitor_type ENUM(
    'INTERNAL','EXTERNAL','SUPERVISOR','ARCHITECT','VENDOR','CONTRACTOR','CLIENT','OTHER'
  ) NOT NULL;
