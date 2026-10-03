-- Daily site reports v2: project ids are UUIDs, structured sections, draft/submit, photos.
-- Safe to run on an empty or populated table (no data is dropped).
ALTER TABLE daily_site_reports
  MODIFY project_id CHAR(36) NOT NULL,
  MODIFY work_completed TEXT NULL,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' AFTER report_date,
  ADD COLUMN IF NOT EXISTS submitted_at DATETIME NULL AFTER status,
  ADD COLUMN IF NOT EXISTS site_condition VARCHAR(30) NULL AFTER weather_notes,
  ADD COLUMN IF NOT EXISTS work_items JSON NULL AFTER work_completed,
  ADD COLUMN IF NOT EXISTS materials JSON NULL AFTER work_items,
  ADD COLUMN IF NOT EXISTS equipment JSON NULL AFTER materials,
  ADD COLUMN IF NOT EXISTS issue_items JSON NULL AFTER equipment,
  ADD COLUMN IF NOT EXISTS needs_attention TINYINT(1) NULL DEFAULT 0 AFTER issues,
  ADD COLUMN IF NOT EXISTS safety_incident TINYINT(1) NULL DEFAULT 0 AFTER needs_attention,
  ADD COLUMN IF NOT EXISTS safety_notes TEXT NULL AFTER safety_incident,
  ADD COLUMN IF NOT EXISTS photos JSON NULL AFTER safety_notes,
  ADD COLUMN IF NOT EXISTS next_day_plan TEXT NULL AFTER photos,
  ADD COLUMN IF NOT EXISTS share_with_client TINYINT(1) NULL DEFAULT 0 AFTER reported_by;

CREATE UNIQUE INDEX IF NOT EXISTS daily_site_reports_project_id_report_date
  ON daily_site_reports (project_id, report_date);

ALTER TABLE manpower_entries
  MODIFY team_id CHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS trade VARCHAR(40) NOT NULL DEFAULT 'GENERAL' AFTER team_id,
  ADD COLUMN IF NOT EXISTS contractor_name VARCHAR(150) NULL AFTER trade;

CREATE INDEX IF NOT EXISTS manpower_entries_daily_site_report_id
  ON manpower_entries (daily_site_report_id);
