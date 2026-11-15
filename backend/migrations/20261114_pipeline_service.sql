-- Pipeline: Design / Build service per deal + early "lead" project status.
-- Idempotent on MySQL 8 and MariaDB (information_schema checks + PREPARE). No data is inserted.
--
-- 1. leads.service ENUM('DESIGN','BUILD') NULL DEFAULT 'DESIGN'
--    Existing deals get the column default (DESIGN); the app also treats NULL as DESIGN.
-- 2. projects.status gains 'lead' so a project created from a pipeline deal is
--    available to every document (brief, recce, scope …) without counting as an
--    active project. It turns 'active' when the deal is marked won.
-- 3. Links existing deals that have a client but no project to the project of the
--    same client whose name equals the deal name (no projects are created here).

SET @pipeline_sql = (SELECT IF(COUNT(*) = 0,
  'ALTER TABLE `leads` ADD COLUMN `service` ENUM(''DESIGN'',''BUILD'') NULL DEFAULT ''DESIGN''',
  'DO 0')
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'leads' AND column_name = 'service');
PREPARE pipeline_stmt FROM @pipeline_sql; EXECUTE pipeline_stmt; DEALLOCATE PREPARE pipeline_stmt;

SET @pipeline_sql = (SELECT IF(COUNT(*) = 1 AND MAX(column_type) NOT LIKE '%''lead''%',
  'ALTER TABLE `projects` MODIFY COLUMN `status` ENUM(''active'',''completed'',''on_hold'',''inactive'',''lead'') NOT NULL DEFAULT ''active''',
  'DO 0')
  FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'projects' AND column_name = 'status');
PREPARE pipeline_stmt FROM @pipeline_sql; EXECUTE pipeline_stmt; DEALLOCATE PREPARE pipeline_stmt;

UPDATE leads l
  JOIN projects p
    ON p.client_id = l.client_id
   AND p.deleted_at IS NULL
   AND LOWER(TRIM(p.name)) = LOWER(TRIM(COALESCE(NULLIF(l.deal_name, ''), l.name)))
   SET l.project_id = p.id
 WHERE l.project_id IS NULL AND l.client_id IS NOT NULL;
