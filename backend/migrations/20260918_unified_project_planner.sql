-- MySQL 8. Apply before deploying the unified planner API.
ALTER TABLE project_planners MODIFY type ENUM('PROJECT','CONSULTANCY','PMC','VENDOR_PROCUREMENT') NOT NULL;
ALTER TABLE project_planner_items ADD COLUMN task_template_id CHAR(36) NULL;
ALTER TABLE project_procurement_items ADD COLUMN template_key VARCHAR(64) NULL;
UPDATE project_planner_items i JOIN planner_task_templates t
ON i.phase_id = t.phase_id AND i.work_name <=> t.work_name AND i.details <=> t.details
SET i.task_template_id = t.id;
-- The former per-type uniqueness conflicts with archived planner history.
ALTER TABLE project_planners ADD INDEX project_planners_project_lookup (project_id);
SET @old_index = (SELECT INDEX_NAME FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project_planners' AND NON_UNIQUE = 0
AND INDEX_NAME <> 'PRIMARY' GROUP BY INDEX_NAME
HAVING GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) = 'project_id,type' LIMIT 1);
SET @drop_index = IF(@old_index IS NULL, 'SELECT 1', CONCAT('ALTER TABLE project_planners DROP INDEX `', @old_index, '`'));
PREPARE planner_index_stmt FROM @drop_index;
EXECUTE planner_index_stmt;
DEALLOCATE PREPARE planner_index_stmt;

START TRANSACTION;
CREATE TEMPORARY TABLE planner_merge AS
SELECT project_id, COALESCE(MIN(CASE WHEN type = 'PROJECT' THEN id END), MIN(id)) canonical_id
FROM project_planners WHERE deleted_at IS NULL GROUP BY project_id;

UPDATE project_planner_items i JOIN project_planners p ON i.planner_id = p.id
JOIN planner_merge m ON m.project_id = p.project_id
SET i.planner_id = m.canonical_id WHERE p.deleted_at IS NULL;
UPDATE project_procurement_items i JOIN project_planners p ON i.planner_id = p.id
JOIN planner_merge m ON m.project_id = p.project_id
SET i.planner_id = m.canonical_id WHERE p.deleted_at IS NULL;
UPDATE project_planners p JOIN planner_merge m ON p.project_id = m.project_id
SET p.deleted_at = CURRENT_TIMESTAMP, p.is_active = 0
WHERE p.id <> m.canonical_id AND p.deleted_at IS NULL;
UPDATE project_planners p JOIN planner_merge m ON p.id = m.canonical_id
SET p.type = 'PROJECT', p.name = 'Project Planner', p.updated_at = CURRENT_TIMESTAMP;
DROP TEMPORARY TABLE planner_merge;
COMMIT;

-- Enforce one current planner while preserving soft-deleted history.
ALTER TABLE project_planners ADD COLUMN active_project_id CHAR(36)
GENERATED ALWAYS AS (CASE WHEN deleted_at IS NULL THEN project_id ELSE NULL END) STORED,
ADD UNIQUE INDEX project_planners_one_current (active_project_id);
