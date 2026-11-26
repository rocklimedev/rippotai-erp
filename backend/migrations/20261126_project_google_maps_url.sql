SET @lead_maps_ddl = IF(
  EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'leads' AND COLUMN_NAME = 'google_maps_url'
  ),
  'DO 0',
  'ALTER TABLE leads ADD COLUMN google_maps_url TEXT NULL'
);
PREPARE lead_maps_stmt FROM @lead_maps_ddl;
EXECUTE lead_maps_stmt;
DEALLOCATE PREPARE lead_maps_stmt;

SET @project_maps_ddl = IF(
  EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'google_maps_url'
  ),
  'DO 0',
  'ALTER TABLE projects ADD COLUMN google_maps_url TEXT NULL'
);
PREPARE project_maps_stmt FROM @project_maps_ddl;
EXECUTE project_maps_stmt;
DEALLOCATE PREPARE project_maps_stmt;
