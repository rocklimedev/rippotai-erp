-- Apply before deploying the updated brief API.
ALTER TABLE project_briefs
  ADD COLUMN expected_timeline VARCHAR(32) NULL;
