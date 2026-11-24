-- Client Brief cover roles. Idempotent (MariaDB): columns are only added when missing
-- (principal_architect may already exist from the autofill project-facts migration).
ALTER TABLE project_briefs
  ADD COLUMN IF NOT EXISTS principal_architect VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS project_lead VARCHAR(255) NULL;
