-- 20261110_remove_quotations_shortlists.sql
--
-- Removes the Quotation feature (client quotations / estimates, quotation
-- versions & comparisons, vendor/material quotations) and the Vendor
-- shortlist feature from INOS, as decided by the owner: quotations are no
-- longer part of INOS and their documents are deleted.
--
-- What it does (every step is idempotent; safe to run twice):
--   1. Revokes and deletes the quotation / shortlist / quotation-report
--      permissions and the "quotations" app (+ role_apps grants).
--   2. Removes gate conditions that depended on quotations (QUOTATION_APPROVED
--      evaluator and DOCUMENT_APPROVED on the removed document types). Only the
--      condition rows are removed; the gates themselves stay.
--   3. Deletes the removed document types (VENDOR_QUOTATION,
--      MAT_MATERIAL_QUOTATION, VENDOR_SHORTLIST) with their requirements and
--      uploaded documents, plus their private search rows.
--   4. Deletes quotation activity / notification rows, converts quotation
--      deadlines in the calendar to milestone_due, and shrinks every enum that
--      still listed a quotation value.
--   5. Drops the referencing columns (purchase_orders.quotation_id,
--      projects.quotation_count, material_estimates.converted_to_quotation,
--      project_procurement_items.quotation_finalised_at,
--      project_vendor_procurements.quotation_finalised_date) and then DROPs the
--      quotation and shortlist tables.
--   6. Removes quotation wording from reference data (team section, team and
--      document-type descriptions, terms text, billing settings).
--
-- Portable: MariaDB 10.11 / 11.x / 13 and MySQL 8 (no procedures, no
-- DELIMITER; conditional DDL via information_schema + PREPARE).

SET @OLD_SQL_NOTES = @@SQL_NOTES;
SET SQL_NOTES = 0;

-- ---------------------------------------------------------------------------
-- 1. Permissions and the quotations app
-- ---------------------------------------------------------------------------
DELETE rp FROM role_permissions rp
  JOIN permissions p ON p.id = rp.permission_id
 WHERE p.resource IN ('quotations', 'quotation-items', 'quotation-versions',
                      'quotation-comparisons', 'procurement-quotations',
                      'project-shortlists', 'shortlist-entries',
                      'shortlist-packages', 'shortlists', 'reports', 'QUOTATION');

DELETE FROM permissions
 WHERE resource IN ('quotations', 'quotation-items', 'quotation-versions',
                    'quotation-comparisons', 'procurement-quotations',
                    'project-shortlists', 'shortlist-entries',
                    'shortlist-packages', 'shortlists', 'reports', 'QUOTATION');

DELETE FROM role_apps WHERE app_code = 'quotations';
DELETE FROM apps WHERE code = 'quotations';

-- Saved dashboard layout of the removed Quotations app.
SET @sql := IF((SELECT COUNT(*) FROM information_schema.TABLES
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_dashboard_layouts') > 0,
  'DELETE FROM user_dashboard_layouts WHERE app_key = ''quotations''', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- 2. Gate conditions (conditions only — gates stay)
-- ---------------------------------------------------------------------------
DELETE FROM gate_conditions WHERE type = 'QUOTATION_APPROVED';
DELETE FROM gate_conditions
 WHERE type = 'DOCUMENT_APPROVED'
   AND JSON_VALID(params)
   AND JSON_UNQUOTE(JSON_EXTRACT(params, '$.documentTypeCode'))
       IN ('VENDOR_QUOTATION', 'MAT_MATERIAL_QUOTATION', 'VENDOR_SHORTLIST');

-- ---------------------------------------------------------------------------
-- 3. Removed document types, their requirements and uploaded documents
-- ---------------------------------------------------------------------------
SET @sql := IF((SELECT COUNT(*) FROM information_schema.TABLES
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'erp_search_documents') > 0,
  'DELETE s FROM erp_search_documents s
     JOIN documents d ON s.index_name = ''documents'' AND s.document_id = d.id
     JOIN document_types t ON t.id = d.document_type_id
    WHERE t.code IN (''VENDOR_QUOTATION'', ''MAT_MATERIAL_QUOTATION'', ''VENDOR_SHORTLIST'')',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- document_versions / document_attachments cascade from documents.
DELETE d FROM documents d
  JOIN document_types t ON t.id = d.document_type_id
 WHERE t.code IN ('VENDOR_QUOTATION', 'MAT_MATERIAL_QUOTATION', 'VENDOR_SHORTLIST');

-- documents/drawings.requirement_id are ON DELETE SET NULL.
DELETE r FROM document_requirements r
  JOIN document_types t ON t.id = r.document_type_id
 WHERE t.code IN ('VENDOR_QUOTATION', 'MAT_MATERIAL_QUOTATION', 'VENDOR_SHORTLIST');

-- planner templates/items, drawings and documents reference document_types
-- with ON DELETE SET NULL.
DELETE FROM document_types
 WHERE code IN ('VENDOR_QUOTATION', 'MAT_MATERIAL_QUOTATION', 'VENDOR_SHORTLIST');

-- The "Quotations" document library category no longer exists.
UPDATE documents SET category = 'Other' WHERE category = 'Quotations';

-- Private search index of quotations.
SET @sql := IF((SELECT COUNT(*) FROM information_schema.TABLES
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'erp_search_documents') > 0,
  'DELETE FROM erp_search_documents WHERE index_name = ''quotations''', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- 4. Activity, notifications, calendar, team rosters, client links, POs
-- ---------------------------------------------------------------------------
DELETE FROM activity_logs
 WHERE action LIKE 'quotation\_%'
    OR LOWER(entity_type) IN ('quotation', 'quotations', 'quotation_comparison',
                              'material_quotation', 'vendor_shortlist',
                              'shortlist_entry', 'shortlist_package', 'project_shortlist');

DELETE FROM notifications
 WHERE type LIKE 'quotation\_%'
    OR LOWER(entity_type) IN ('quotation', 'quotations', 'quotation_comparison',
                              'material_quotation', 'vendor_shortlist',
                              'shortlist_entry', 'shortlist_package', 'project_shortlist');

UPDATE calendar_events SET type = 'milestone_due' WHERE type = 'quotation_deadline';

DELETE FROM team_members WHERE owner_type = 'QUOTATION';

-- client_link_responses cascade/are removed with their links.
DELETE FROM client_link_responses WHERE kind = 'quotation_selected';
DELETE r FROM client_link_responses r
  JOIN client_links l ON l.id = r.link_id
 WHERE l.purpose = 'quotation_selection';
DELETE FROM client_links WHERE purpose = 'quotation_selection';

-- POs are now raised from an approved estimate / BOQ / rate comparison or manually.
UPDATE purchase_orders SET source_type = 'MANUAL' WHERE source_type = 'QUOTATION';

-- ---------------------------------------------------------------------------
-- 4b. Shrink enums. Each block rebuilds the column definition from
--     information_schema with the quotation values removed (default,
--     nullability, charset, collation and comment are preserved).
--     COLUMN_DEFAULT is quoted on MariaDB and unquoted on MySQL 8.
-- ---------------------------------------------------------------------------

-- activity_logs.action
SET @sql := (SELECT IF(COLUMN_TYPE REGEXP ',?''quotation_[a-z_]+''',
  CONCAT('ALTER TABLE `activity_logs` MODIFY COLUMN `action` ',
         REPLACE(REGEXP_REPLACE(COLUMN_TYPE, ',?''quotation_[a-z_]+''', ''), '(,', '('),
         IF(CHARACTER_SET_NAME IS NULL, '', CONCAT(' CHARACTER SET ', CHARACTER_SET_NAME, ' COLLATE ', COLLATION_NAME)),
         IF(IS_NULLABLE = 'YES', ' NULL', ' NOT NULL'),
         IF(COLUMN_DEFAULT IS NULL OR COLUMN_DEFAULT = 'NULL', IF(IS_NULLABLE = 'YES', ' DEFAULT NULL', ''),
            CONCAT(' DEFAULT ', IF(LEFT(COLUMN_DEFAULT, 1) = '''', COLUMN_DEFAULT, QUOTE(COLUMN_DEFAULT)))),
         IF(COLUMN_COMMENT = '', '', CONCAT(' COMMENT ', QUOTE(COLUMN_COMMENT)))),
  'DO 0') FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activity_logs' AND COLUMN_NAME = 'action');
SET @sql := IFNULL(@sql, 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- notifications.type
SET @sql := (SELECT IF(COLUMN_TYPE REGEXP ',?''quotation_[a-z_]+''',
  CONCAT('ALTER TABLE `notifications` MODIFY COLUMN `type` ',
         REPLACE(REGEXP_REPLACE(COLUMN_TYPE, ',?''quotation_[a-z_]+''', ''), '(,', '('),
         IF(CHARACTER_SET_NAME IS NULL, '', CONCAT(' CHARACTER SET ', CHARACTER_SET_NAME, ' COLLATE ', COLLATION_NAME)),
         IF(IS_NULLABLE = 'YES', ' NULL', ' NOT NULL'),
         IF(COLUMN_DEFAULT IS NULL OR COLUMN_DEFAULT = 'NULL', IF(IS_NULLABLE = 'YES', ' DEFAULT NULL', ''),
            CONCAT(' DEFAULT ', IF(LEFT(COLUMN_DEFAULT, 1) = '''', COLUMN_DEFAULT, QUOTE(COLUMN_DEFAULT)))),
         IF(COLUMN_COMMENT = '', '', CONCAT(' COMMENT ', QUOTE(COLUMN_COMMENT)))),
  'DO 0') FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'type');
SET @sql := IFNULL(@sql, 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- calendar_events.type
SET @sql := (SELECT IF(COLUMN_TYPE REGEXP ',?''quotation_deadline''',
  CONCAT('ALTER TABLE `calendar_events` MODIFY COLUMN `type` ',
         REPLACE(REGEXP_REPLACE(COLUMN_TYPE, ',?''quotation_deadline''', ''), '(,', '('),
         IF(CHARACTER_SET_NAME IS NULL, '', CONCAT(' CHARACTER SET ', CHARACTER_SET_NAME, ' COLLATE ', COLLATION_NAME)),
         IF(IS_NULLABLE = 'YES', ' NULL', ' NOT NULL'),
         IF(COLUMN_DEFAULT IS NULL OR COLUMN_DEFAULT = 'NULL', IF(IS_NULLABLE = 'YES', ' DEFAULT NULL', ''),
            CONCAT(' DEFAULT ', IF(LEFT(COLUMN_DEFAULT, 1) = '''', COLUMN_DEFAULT, QUOTE(COLUMN_DEFAULT)))),
         IF(COLUMN_COMMENT = '', '', CONCAT(' COMMENT ', QUOTE(COLUMN_COMMENT)))),
  'DO 0') FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'calendar_events' AND COLUMN_NAME = 'type');
SET @sql := IFNULL(@sql, 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- team_members.owner_type
SET @sql := (SELECT IF(COLUMN_TYPE REGEXP ',?''QUOTATION''',
  CONCAT('ALTER TABLE `team_members` MODIFY COLUMN `owner_type` ',
         REPLACE(REGEXP_REPLACE(COLUMN_TYPE, ',?''QUOTATION''', ''), '(,', '('),
         IF(CHARACTER_SET_NAME IS NULL, '', CONCAT(' CHARACTER SET ', CHARACTER_SET_NAME, ' COLLATE ', COLLATION_NAME)),
         IF(IS_NULLABLE = 'YES', ' NULL', ' NOT NULL'),
         IF(COLUMN_DEFAULT IS NULL OR COLUMN_DEFAULT = 'NULL', IF(IS_NULLABLE = 'YES', ' DEFAULT NULL', ''),
            CONCAT(' DEFAULT ', IF(LEFT(COLUMN_DEFAULT, 1) = '''', COLUMN_DEFAULT, QUOTE(COLUMN_DEFAULT)))),
         IF(COLUMN_COMMENT = '', '', CONCAT(' COMMENT ', QUOTE(COLUMN_COMMENT)))),
  'DO 0') FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'team_members' AND COLUMN_NAME = 'owner_type');
SET @sql := IFNULL(@sql, 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- client_links.purpose
SET @sql := (SELECT IF(COLUMN_TYPE REGEXP ',?''quotation_selection''',
  CONCAT('ALTER TABLE `client_links` MODIFY COLUMN `purpose` ',
         REPLACE(REGEXP_REPLACE(COLUMN_TYPE, ',?''quotation_selection''', ''), '(,', '('),
         IF(CHARACTER_SET_NAME IS NULL, '', CONCAT(' CHARACTER SET ', CHARACTER_SET_NAME, ' COLLATE ', COLLATION_NAME)),
         IF(IS_NULLABLE = 'YES', ' NULL', ' NOT NULL'),
         IF(COLUMN_DEFAULT IS NULL OR COLUMN_DEFAULT = 'NULL', IF(IS_NULLABLE = 'YES', ' DEFAULT NULL', ''),
            CONCAT(' DEFAULT ', IF(LEFT(COLUMN_DEFAULT, 1) = '''', COLUMN_DEFAULT, QUOTE(COLUMN_DEFAULT)))),
         IF(COLUMN_COMMENT = '', '', CONCAT(' COMMENT ', QUOTE(COLUMN_COMMENT)))),
  'DO 0') FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'client_links' AND COLUMN_NAME = 'purpose');
SET @sql := IFNULL(@sql, 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- client_link_responses.kind
SET @sql := (SELECT IF(COLUMN_TYPE REGEXP ',?''quotation_selected''',
  CONCAT('ALTER TABLE `client_link_responses` MODIFY COLUMN `kind` ',
         REPLACE(REGEXP_REPLACE(COLUMN_TYPE, ',?''quotation_selected''', ''), '(,', '('),
         IF(CHARACTER_SET_NAME IS NULL, '', CONCAT(' CHARACTER SET ', CHARACTER_SET_NAME, ' COLLATE ', COLLATION_NAME)),
         IF(IS_NULLABLE = 'YES', ' NULL', ' NOT NULL'),
         IF(COLUMN_DEFAULT IS NULL OR COLUMN_DEFAULT = 'NULL', IF(IS_NULLABLE = 'YES', ' DEFAULT NULL', ''),
            CONCAT(' DEFAULT ', IF(LEFT(COLUMN_DEFAULT, 1) = '''', COLUMN_DEFAULT, QUOTE(COLUMN_DEFAULT)))),
         IF(COLUMN_COMMENT = '', '', CONCAT(' COMMENT ', QUOTE(COLUMN_COMMENT)))),
  'DO 0') FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'client_link_responses' AND COLUMN_NAME = 'kind');
SET @sql := IFNULL(@sql, 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- purchase_orders.source_type
SET @sql := (SELECT IF(COLUMN_TYPE REGEXP ',?''QUOTATION''',
  CONCAT('ALTER TABLE `purchase_orders` MODIFY COLUMN `source_type` ',
         REPLACE(REGEXP_REPLACE(COLUMN_TYPE, ',?''QUOTATION''', ''), '(,', '('),
         IF(CHARACTER_SET_NAME IS NULL, '', CONCAT(' CHARACTER SET ', CHARACTER_SET_NAME, ' COLLATE ', COLLATION_NAME)),
         IF(IS_NULLABLE = 'YES', ' NULL', ' NOT NULL'),
         IF(COLUMN_DEFAULT IS NULL OR COLUMN_DEFAULT = 'NULL', IF(IS_NULLABLE = 'YES', ' DEFAULT NULL', ''),
            CONCAT(' DEFAULT ', IF(LEFT(COLUMN_DEFAULT, 1) = '''', COLUMN_DEFAULT, QUOTE(COLUMN_DEFAULT)))),
         IF(COLUMN_COMMENT = '', '', CONCAT(' COMMENT ', QUOTE(COLUMN_COMMENT)))),
  'DO 0') FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchase_orders' AND COLUMN_NAME = 'source_type');
SET @sql := IFNULL(@sql, 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------------
-- 5. Drop foreign keys that point at the removed tables, the referencing
--    columns, and finally the tables.
-- ---------------------------------------------------------------------------

-- Foreign keys from tables that stay (e.g. purchase_orders.quotation_id on
-- some installs). Repeated so up to 6 such constraints are removed per run.
SET @sql := IFNULL((SELECT CONCAT('ALTER TABLE `', TABLE_NAME, '` DROP FOREIGN KEY `', CONSTRAINT_NAME, '`')
  FROM information_schema.KEY_COLUMN_USAGE
 WHERE TABLE_SCHEMA = DATABASE()
   AND REFERENCED_TABLE_NAME IN ('quotations', 'quotation_items', 'quotation_versions', 'quotation_comparisons',
                                 'material_quotations', 'shortlist_entries', 'shortlist_entries_workspace_backup',
                                 'shortlist_packages', 'project_shortlists')
   AND TABLE_NAME NOT IN ('quotations', 'quotation_items', 'quotation_versions', 'quotation_comparisons',
                          'material_quotations', 'shortlist_entries', 'shortlist_entries_workspace_backup',
                          'shortlist_packages', 'project_shortlists')
 LIMIT 1), 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IFNULL((SELECT CONCAT('ALTER TABLE `', TABLE_NAME, '` DROP FOREIGN KEY `', CONSTRAINT_NAME, '`')
  FROM information_schema.KEY_COLUMN_USAGE
 WHERE TABLE_SCHEMA = DATABASE()
   AND REFERENCED_TABLE_NAME IN ('quotations', 'quotation_items', 'quotation_versions', 'quotation_comparisons',
                                 'material_quotations', 'shortlist_entries', 'shortlist_entries_workspace_backup',
                                 'shortlist_packages', 'project_shortlists')
   AND TABLE_NAME NOT IN ('quotations', 'quotation_items', 'quotation_versions', 'quotation_comparisons',
                          'material_quotations', 'shortlist_entries', 'shortlist_entries_workspace_backup',
                          'shortlist_packages', 'project_shortlists')
 LIMIT 1), 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IFNULL((SELECT CONCAT('ALTER TABLE `', TABLE_NAME, '` DROP FOREIGN KEY `', CONSTRAINT_NAME, '`')
  FROM information_schema.KEY_COLUMN_USAGE
 WHERE TABLE_SCHEMA = DATABASE()
   AND REFERENCED_TABLE_NAME IN ('quotations', 'quotation_items', 'quotation_versions', 'quotation_comparisons',
                                 'material_quotations', 'shortlist_entries', 'shortlist_entries_workspace_backup',
                                 'shortlist_packages', 'project_shortlists')
   AND TABLE_NAME NOT IN ('quotations', 'quotation_items', 'quotation_versions', 'quotation_comparisons',
                          'material_quotations', 'shortlist_entries', 'shortlist_entries_workspace_backup',
                          'shortlist_packages', 'project_shortlists')
 LIMIT 1), 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IFNULL((SELECT CONCAT('ALTER TABLE `', TABLE_NAME, '` DROP FOREIGN KEY `', CONSTRAINT_NAME, '`')
  FROM information_schema.KEY_COLUMN_USAGE
 WHERE TABLE_SCHEMA = DATABASE()
   AND REFERENCED_TABLE_NAME IN ('quotations', 'quotation_items', 'quotation_versions', 'quotation_comparisons',
                                 'material_quotations', 'shortlist_entries', 'shortlist_entries_workspace_backup',
                                 'shortlist_packages', 'project_shortlists')
   AND TABLE_NAME NOT IN ('quotations', 'quotation_items', 'quotation_versions', 'quotation_comparisons',
                          'material_quotations', 'shortlist_entries', 'shortlist_entries_workspace_backup',
                          'shortlist_packages', 'project_shortlists')
 LIMIT 1), 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IFNULL((SELECT CONCAT('ALTER TABLE `', TABLE_NAME, '` DROP FOREIGN KEY `', CONSTRAINT_NAME, '`')
  FROM information_schema.KEY_COLUMN_USAGE
 WHERE TABLE_SCHEMA = DATABASE()
   AND REFERENCED_TABLE_NAME IN ('quotations', 'quotation_items', 'quotation_versions', 'quotation_comparisons',
                                 'material_quotations', 'shortlist_entries', 'shortlist_entries_workspace_backup',
                                 'shortlist_packages', 'project_shortlists')
   AND TABLE_NAME NOT IN ('quotations', 'quotation_items', 'quotation_versions', 'quotation_comparisons',
                          'material_quotations', 'shortlist_entries', 'shortlist_entries_workspace_backup',
                          'shortlist_packages', 'project_shortlists')
 LIMIT 1), 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IFNULL((SELECT CONCAT('ALTER TABLE `', TABLE_NAME, '` DROP FOREIGN KEY `', CONSTRAINT_NAME, '`')
  FROM information_schema.KEY_COLUMN_USAGE
 WHERE TABLE_SCHEMA = DATABASE()
   AND REFERENCED_TABLE_NAME IN ('quotations', 'quotation_items', 'quotation_versions', 'quotation_comparisons',
                                 'material_quotations', 'shortlist_entries', 'shortlist_entries_workspace_backup',
                                 'shortlist_packages', 'project_shortlists')
   AND TABLE_NAME NOT IN ('quotations', 'quotation_items', 'quotation_versions', 'quotation_comparisons',
                          'material_quotations', 'shortlist_entries', 'shortlist_entries_workspace_backup',
                          'shortlist_packages', 'project_shortlists')
 LIMIT 1), 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Referencing / quotation-only columns on tables that stay (indexes on a
-- dropped column are removed with it).
SET @sql := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()
                 AND TABLE_NAME = 'purchase_orders' AND COLUMN_NAME = 'quotation_id') > 0,
  'ALTER TABLE `purchase_orders` DROP COLUMN `quotation_id`', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()
                 AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'quotation_count') > 0,
  'ALTER TABLE `projects` DROP COLUMN `quotation_count`', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()
                 AND TABLE_NAME = 'material_estimates' AND COLUMN_NAME = 'converted_to_quotation') > 0,
  'ALTER TABLE `material_estimates` DROP COLUMN `converted_to_quotation`', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()
                 AND TABLE_NAME = 'project_procurement_items' AND COLUMN_NAME = 'quotation_finalised_at') > 0,
  'ALTER TABLE `project_procurement_items` DROP COLUMN `quotation_finalised_at`', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF((SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()
                 AND TABLE_NAME = 'project_vendor_procurements' AND COLUMN_NAME = 'quotation_finalised_date') > 0,
  'ALTER TABLE `project_vendor_procurements` DROP COLUMN `quotation_finalised_date`', 'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- The documents themselves (children first).
DROP TABLE IF EXISTS `quotation_items`;
DROP TABLE IF EXISTS `quotation_versions`;
DROP TABLE IF EXISTS `quotation_comparisons`;
DROP TABLE IF EXISTS `material_quotations`;
DROP TABLE IF EXISTS `quotations`;
DROP TABLE IF EXISTS `shortlist_entries`;
DROP TABLE IF EXISTS `shortlist_entries_workspace_backup`;
DROP TABLE IF EXISTS `shortlist_packages`;
DROP TABLE IF EXISTS `project_shortlists`;

-- ---------------------------------------------------------------------------
-- 6. Reference data wording
-- ---------------------------------------------------------------------------
DELETE a FROM team_section_access a
  JOIN team_sections s ON s.id = a.section_id
 WHERE s.`key` = 'QUOTATIONS';
DELETE FROM team_sections WHERE `key` = 'QUOTATIONS';

UPDATE teams
   SET description = REPLACE(description, 'vendor management, quotations, purchase orders', 'vendor management, purchase orders')
 WHERE description LIKE '%vendor management, quotations, purchase orders%';

UPDATE document_types SET description = REPLACE(description, ' once tender drawings are final and quotations are approved.', ' once tender drawings are final.')
 WHERE description LIKE '% once tender drawings are final and quotations are approved.%';
UPDATE document_types SET description = REPLACE(description, ' for quantification and quotation.', ' for quantification.')
 WHERE description LIKE '% for quantification and quotation.%';
UPDATE document_types SET description = REPLACE(description, 'Material estimate before quotation approval.', 'Material estimate approved before purchase orders are raised.')
 WHERE description LIKE '%Material estimate before quotation approval.%';
UPDATE document_types SET description = REPLACE(description, ' and created with the quotations.', '.')
 WHERE description LIKE '% and created with the quotations.%';
UPDATE document_types SET description = REPLACE(description, 'collected from shortlisted vendors.', 'collected from vendors.')
 WHERE description LIKE '%collected from shortlisted vendors.%';
UPDATE document_types SET description = REPLACE(description, 'rates and quotes remain estimates until approved.', 'rates remain estimates until approved.')
 WHERE description LIKE '%rates and quotes remain estimates until approved.%';

UPDATE terms_templates
   SET content_html = REPLACE(REPLACE(content_html, 'specifications, quotations, estimates,', 'specifications, estimates,'),
                              'Quotation valid for 30 days', 'Rates valid for 30 days')
 WHERE content_html LIKE '%specifications, quotations, estimates,%' OR content_html LIKE '%Quotation valid for 30 days%';
UPDATE terms_template_versions
   SET content_html = REPLACE(REPLACE(content_html, 'specifications, quotations, estimates,', 'specifications, estimates,'),
                              'Quotation valid for 30 days', 'Rates valid for 30 days')
 WHERE content_html LIKE '%specifications, quotations, estimates,%' OR content_html LIKE '%Quotation valid for 30 days%';

UPDATE settings
   SET value = JSON_REMOVE(value, '$.quotationValidityDays')
 WHERE `key` = 'billing' AND JSON_VALID(value)
   AND JSON_CONTAINS_PATH(value, 'one', '$.quotationValidityDays');

SET SQL_NOTES = @OLD_SQL_NOTES;
