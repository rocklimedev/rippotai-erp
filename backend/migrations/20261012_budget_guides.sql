-- Apply before deploying Budget Guides. Project linking is optional.
-- JSON aggregates keep the three plans, their cost items and material schedules
-- together; updates lock the guide and check revision to prevent lost edits.
CREATE TABLE IF NOT EXISTS budget_guides (
  id CHAR(36) NOT NULL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  project_id CHAR(36) NULL,
  source_guide_id CHAR(36) NULL,
  project_type VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  prepared_by VARCHAR(255) NOT NULL,
  currency CHAR(3) NOT NULL,
  area_unit VARCHAR(80) NOT NULL,
  built_up_area DECIMAL(18,4) NULL,
  issue_date DATE NOT NULL,
  validity_months INT NOT NULL,
  rate_validity_days INT NOT NULL,
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  introduction TEXT NOT NULL,
  plans JSON NOT NULL,
  pricing_notes JSON NOT NULL,
  next_steps JSON NOT NULL,
  revision INT NOT NULL DEFAULT 1,
  created_by CHAR(36) NOT NULL,
  updated_by CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY budget_guides_project (project_id),
  KEY budget_guides_status_updated (status, updated_at),
  KEY budget_guides_source (source_guide_id)
);
-- Register and grant capabilities through the reviewed staff route catalogue:
-- run/apply 20261010_staff_route_permissions.sql after regeneration.
-- Other staff roles require explicit budget-guides read/create/update/delete grants.
