-- Visit assignments become individual dated event allocations.
-- MySQL 8 / MariaDB. Run after 20260930_site_ops_project_uuid.sql.
-- Run during a deployment maintenance window before starting the updated backend.
-- Re-runnable. Historical logs and architect_site_visits are preserved.
-- Legacy recurrence has no reliable event date/stage: retain and deactivate it.
-- Visit 20 (snag closure) is unavailable for new allocations.
CREATE TABLE IF NOT EXISTS architect_visit_stages (
 id CHAR(36) NOT NULL PRIMARY KEY, visit_no INT NOT NULL UNIQUE,
 stage VARCHAR(255) NOT NULL, checks_purpose TEXT NOT NULL,
 visit_type ENUM('Mandatory','Hold Point','As Required','Mandatory (Critical)') NOT NULL,
 remarks TEXT NULL, is_active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS migrate_visit_event_column;
DELIMITER $$
CREATE PROCEDURE migrate_visit_event_column(IN column_name_to_add VARCHAR(64), IN column_definition VARCHAR(255))
BEGIN
 IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE()
   AND table_name = 'visit_assignments' AND column_name = column_name_to_add) THEN
   SET @visit_event_ddl = CONCAT('ALTER TABLE visit_assignments ADD COLUMN `', column_name_to_add, '` ', column_definition);
   PREPARE visit_event_statement FROM @visit_event_ddl;
   EXECUTE visit_event_statement;
   DEALLOCATE PREPARE visit_event_statement;
 END IF;
END$$
DELIMITER ;
CALL migrate_visit_event_column('stage_id', 'CHAR(36) NULL');
CALL migrate_visit_event_column('scheduled_date', 'DATE NULL');
CALL migrate_visit_event_column('stage_name', 'VARCHAR(255) NULL');
CALL migrate_visit_event_column('checks_purpose', 'TEXT NULL');
CALL migrate_visit_event_column('visit_type', 'VARCHAR(40) NULL');
CALL migrate_visit_event_column('purpose', 'TEXT NULL');
DROP PROCEDURE migrate_visit_event_column;
ALTER TABLE visit_assignments MODIFY frequency ENUM('DAILY','WEEKLY','FIXED_SCHEDULE','AD_HOC') NULL;

-- Audit copy includes the original recurrence and active flag.
CREATE TABLE IF NOT EXISTS visit_assignments_legacy_20261007 AS
 SELECT * FROM visit_assignments WHERE scheduled_date IS NULL;

START TRANSACTION;
INSERT INTO architect_visit_stages
 (id, visit_no, stage, checks_purpose, visit_type, remarks, is_active, created_at, updated_at)
VALUES
(UUID(), 1, 'Pre construction / Site handover', 'Existing site conditions, dimensions, levels, structural elements, site constraints, existing MEP points', 'Mandatory', NULL, 1, NOW(), NOW()),
(UUID(), 2, 'After foundation layout / start of structural work', 'Check layout as per drawings, levels, grids, dimensions', 'Hold Point', NULL, 1, NOW(), NOW()),
(UUID(), 3, 'Column & beam laying', 'Check column and beam location', 'Mandatory', NULL, 1, NOW(), NOW()),
(UUID(), 4, 'Before slab casting', 'Check shuttering, slab level, shafts, openings, conduits if any, sleeves provision, structure', 'Hold Point', NULL, 1, NOW(), NOW()),
(UUID(), 5, 'Before / During walling', 'Check layout, room dimensions, D & W openings', 'Mandatory', NULL, 1, NOW(), NOW()),
(UUID(), 6, 'Before wall chasing', 'Switch/socket locations, heights, TV/data points, plumbing points, AC points, special electrical requirements', 'Hold Point', NULL, 1, NOW(), NOW()),
(UUID(), 7, 'Plumbing / electrical first fix check before plaster', 'Location & height check, routine check', 'Hold Point', NULL, 1, NOW(), NOW()),
(UUID(), 8, 'After MEP first fix – before plaster', 'Electrical & plumbing routing, pipe sizes, slopes, sleeves, concealed boxes, AC piping/drain, coordination with furniture/ceiling', 'Hold Point', NULL, 1, NOW(), NOW()),
(UUID(), 9, 'After bathroom waterproofing', 'Leakage test, water retention, drain slope, wall treatment', 'Hold Point', NULL, 1, NOW(), NOW()),
(UUID(), 10, 'After floor PCC', 'Floor levels, slopes, bathroom slope, finished floor levels, thresholds', 'Mandatory', NULL, 1, NOW(), NOW()),
(UUID(), 11, 'During flooring / tiling', 'Tile layout, starting point, pattern, joints, border/cut pieces, drain alignment, slope', 'As Required', NULL, 1, NOW(), NOW()),
(UUID(), 12, 'During / After false ceiling framework & wiring', 'Ceiling level, cove details, AC diffusers (if any), curtain pockets, access panels/trap doors, lights location, fan point, plywork for chandeliers/AC/curtains, profile channels', 'Hold Point', 'Before false ceiling: ceiling electrical check', 1, NOW(), NOW()),
(UUID(), 13, 'After false ceiling POP', 'Ceiling level, corners, cut-outs, cove details, light locations mark', 'Mandatory', NULL, 1, NOW(), NOW()),
(UUID(), 14, 'Before fixed furniture / carpentry', 'Final wall/floor dimensions, electrical & plumbing points, furniture clearances, appliance dimensions, fixing requirements', 'Hold Point', NULL, 1, NOW(), NOW()),
(UUID(), 15, 'During fixed furniture / wall panelling', 'Material, alignment, dimensions, edge details, hardware, electrical integration, junctions', 'As Required', NULL, 1, NOW(), NOW()),
(UUID(), 16, 'Before painting / final finishes', 'Surface preparation, putty, primer, colour/sample approval, repaired surfaces, protection of completed works', 'Hold Point', NULL, 1, NOW(), NOW()),
(UUID(), 17, 'During final finishes', 'Paint finish, wallpaper, polish/PU, glass, mirrors, hardware, visible junctions', 'As Required', NULL, 1, NOW(), NOW()),
(UUID(), 18, 'After fixtures and final installation', 'Sanitary fixtures, switches, lights, fans, AC grilles, hardware, accessories, furniture alignment', 'Mandatory', NULL, 1, NOW(), NOW()),
(UUID(), 19, 'Pre handover inspections', 'Complete snag inspection: finishes, dimensions, functionality, MEP, furniture, doors/windows, cleaning', 'Mandatory (Critical)', NULL, 1, NOW(), NOW()),
(UUID(), 20, 'Snag list closure check', 'Verify all snag points are rectified; check rework quality', 'Mandatory', NULL, 0, NOW(), NOW()),
(UUID(), 21, 'Final handover', 'Final finishes, cleanliness, protection removal, drawings/documents, warranties/manuals, handover checklist', 'Mandatory', NULL, 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE stage=VALUES(stage), checks_purpose=VALUES(checks_purpose),
 visit_type=VALUES(visit_type), remarks=VALUES(remarks), is_active=VALUES(is_active), updated_at=NOW();
UPDATE visit_assignments SET is_active=FALSE, updated_at=NOW() WHERE scheduled_date IS NULL AND is_active=TRUE;
COMMIT;

-- Expected: 20 available stages and zero active events missing date.
SELECT COUNT(*) AS available_standard_stages FROM architect_visit_stages WHERE visit_no BETWEEN 1 AND 21 AND visit_no <> 20 AND is_active=TRUE;
SELECT COUNT(*) AS legacy_allocations FROM visit_assignments_legacy_20261007;
SELECT COUNT(*) AS active_events_missing_date FROM visit_assignments WHERE is_active=TRUE AND scheduled_date IS NULL;
