-- Apply before deploying Site Recce template support.
ALTER TABLE site_recces
  MODIFY COLUMN site_type VARCHAR(100) NULL,
  ADD COLUMN project_type VARCHAR(100) NULL,
  ADD COLUMN site_type_other VARCHAR(100) NULL,
  ADD COLUMN site_condition VARCHAR(100) NULL,
  ADD COLUMN site_condition_category VARCHAR(100) NULL,
  ADD COLUMN site_condition_other VARCHAR(100) NULL,
  ADD COLUMN floor_layouts JSON NULL,
  ADD COLUMN site_restrictions JSON NULL;
