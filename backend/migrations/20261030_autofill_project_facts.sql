-- Autofill: canonical project facts (single source of truth for every document).
-- Adds site / budget / timeline facts to projects and size details to project_spaces
-- (the canonical rooms / spaces list). Idempotent on MySQL 8 and MariaDB: each column
-- is added only when information_schema says it is missing. No data is inserted.

SET @autofill_sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `projects` ADD COLUMN `site_area` DECIMAL(15,2) NULL', 'DO 0')
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'projects' AND column_name = 'site_area');
PREPARE autofill_stmt FROM @autofill_sql; EXECUTE autofill_stmt; DEALLOCATE PREPARE autofill_stmt;

SET @autofill_sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `projects` ADD COLUMN `site_area_unit` VARCHAR(16) NULL', 'DO 0')
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'projects' AND column_name = 'site_area_unit');
PREPARE autofill_stmt FROM @autofill_sql; EXECUTE autofill_stmt; DEALLOCATE PREPARE autofill_stmt;

SET @autofill_sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `projects` ADD COLUMN `number_of_floors` INT NULL', 'DO 0')
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'projects' AND column_name = 'number_of_floors');
PREPARE autofill_stmt FROM @autofill_sql; EXECUTE autofill_stmt; DEALLOCATE PREPARE autofill_stmt;

SET @autofill_sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `projects` ADD COLUMN `lift_available` TINYINT(1) NULL', 'DO 0')
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'projects' AND column_name = 'lift_available');
PREPARE autofill_stmt FROM @autofill_sql; EXECUTE autofill_stmt; DEALLOCATE PREPARE autofill_stmt;

SET @autofill_sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `projects` ADD COLUMN `client_budget` DECIMAL(15,2) NULL', 'DO 0')
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'projects' AND column_name = 'client_budget');
PREPARE autofill_stmt FROM @autofill_sql; EXECUTE autofill_stmt; DEALLOCATE PREPARE autofill_stmt;

SET @autofill_sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `projects` ADD COLUMN `desired_start_date` DATE NULL', 'DO 0')
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'projects' AND column_name = 'desired_start_date');
PREPARE autofill_stmt FROM @autofill_sql; EXECUTE autofill_stmt; DEALLOCATE PREPARE autofill_stmt;

SET @autofill_sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `project_spaces` ADD COLUMN `area` DECIMAL(12,2) NULL', 'DO 0')
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'project_spaces' AND column_name = 'area');
PREPARE autofill_stmt FROM @autofill_sql; EXECUTE autofill_stmt; DEALLOCATE PREPARE autofill_stmt;

SET @autofill_sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `project_spaces` ADD COLUMN `length` DECIMAL(14,6) NULL', 'DO 0')
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'project_spaces' AND column_name = 'length');
PREPARE autofill_stmt FROM @autofill_sql; EXECUTE autofill_stmt; DEALLOCATE PREPARE autofill_stmt;

SET @autofill_sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `project_spaces` ADD COLUMN `width` DECIMAL(14,6) NULL', 'DO 0')
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'project_spaces' AND column_name = 'width');
PREPARE autofill_stmt FROM @autofill_sql; EXECUTE autofill_stmt; DEALLOCATE PREPARE autofill_stmt;

SET @autofill_sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `project_spaces` ADD COLUMN `height` DECIMAL(14,6) NULL', 'DO 0')
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'project_spaces' AND column_name = 'height');
PREPARE autofill_stmt FROM @autofill_sql; EXECUTE autofill_stmt; DEALLOCATE PREPARE autofill_stmt;

SET @autofill_sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `project_spaces` ADD COLUMN `measurement_unit` VARCHAR(8) NULL', 'DO 0')
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'project_spaces' AND column_name = 'measurement_unit');
PREPARE autofill_stmt FROM @autofill_sql; EXECUTE autofill_stmt; DEALLOCATE PREPARE autofill_stmt;

SET @autofill_sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `project_spaces` ADD COLUMN `source_document` VARCHAR(64) NULL', 'DO 0')
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'project_spaces' AND column_name = 'source_document');
PREPARE autofill_stmt FROM @autofill_sql; EXECUTE autofill_stmt; DEALLOCATE PREPARE autofill_stmt;
