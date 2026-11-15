-- Project codes PRJ-001, PRJ-002 … (short record code shown across INOS).
-- Idempotent on MySQL 8 and MariaDB (information_schema checks + PREPARE).
-- 1. projects.code VARCHAR(20) NULL
-- 2. Backfill projects without a code in created_at order, continuing after the
--    highest existing PRJ-### code (re-running assigns nothing new).
-- 3. UNIQUE index projects_code_unique.
-- New projects get the next code from the backend on create.

SET @prj_sql = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE `projects` ADD COLUMN `code` VARCHAR(20) NULL AFTER `name`',
  'DO 0')
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'projects' AND column_name = 'code');
PREPARE prj_stmt FROM @prj_sql; EXECUTE prj_stmt; DEALLOCATE PREPARE prj_stmt;

SET @prj_n = (SELECT COALESCE(MAX(CAST(SUBSTRING(code, 5) AS UNSIGNED)), 0)
                FROM projects WHERE code REGEXP '^PRJ-[0-9]+$');
UPDATE projects
   SET code = CONCAT('PRJ-', LPAD(@prj_n := @prj_n + 1, 3, '0'))
 WHERE code IS NULL
 ORDER BY created_at, id;

SET @prj_sql = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE `projects` ADD UNIQUE INDEX `projects_code_unique` (`code`)',
  'DO 0')
  FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'projects' AND index_name = 'projects_code_unique');
PREPARE prj_stmt FROM @prj_sql; EXECUTE prj_stmt; DEALLOCATE PREPARE prj_stmt;
