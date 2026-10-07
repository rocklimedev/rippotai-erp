-- MySQL / MariaDB. Run before deploying the new workspace API.
-- Preserve all original records, including ENUM values already coerced to ''.
CREATE TABLE IF NOT EXISTS shortlist_entries_workspace_backup LIKE shortlist_entries;
ALTER TABLE shortlist_entries_workspace_backup
 MODIFY trade VARCHAR(32) NOT NULL, MODIFY working_type VARCHAR(32) NOT NULL,
 MODIFY status VARCHAR(32) NOT NULL DEFAULT 'DRAFT';
INSERT IGNORE INTO shortlist_entries_workspace_backup
 (id,project_shortlist_id,trade,working_type,sort_order,vendor_id,material_id,name_of_vendor,
 estimate_value,quotation_value,currency,quotation_id,status,notes,is_selected,created_by,updated_by,created_at,updated_at)
 SELECT id,project_shortlist_id,trade,working_type,sort_order,vendor_id,material_id,name_of_vendor,
 estimate_value,quotation_value,currency,quotation_id,status,notes,is_selected,created_by,updated_by,created_at,updated_at
 FROM shortlist_entries;

-- VARCHAR avoids MySQL silently converting new application ENUM labels to ''.
-- DTOs and the workspace service validate the supported coordinates/statuses.
ALTER TABLE shortlist_entries
  MODIFY trade VARCHAR(32) NOT NULL,
  MODIFY working_type VARCHAR(32) NOT NULL,
  MODIFY status VARCHAR(32) NOT NULL DEFAULT 'DRAFT';

UPDATE shortlist_entries SET trade = CASE trade
  WHEN 'CIVIL' THEN 'Civil' WHEN 'ELECTRICAL' THEN 'Electrician'
  WHEN 'PLUMBING' THEN 'Plumber' WHEN 'CARPENTRY' THEN 'Carpentar'
  WHEN 'PAINTING' THEN 'Paint' WHEN 'FALSE_CEILING' THEN 'POP'
  WHEN 'FLOORING' THEN 'Flooring' WHEN 'HVAC' THEN 'AC'
  WHEN 'GLASS' THEN 'Glass' WHEN 'METAL' THEN 'MS'
  ELSE trade END;
-- VENDOR/MATERIAL describe shortlist type, not Contractor/Individual/Freelancer.
-- Leave these and blank coordinates untouched for explicit recovery in the UI.
-- Keep legacy statuses readable; align selected flags where selection is known.
UPDATE shortlist_entries SET status = 'SELECTED' WHERE is_selected = 1;

-- Consolidate only rows with valid, recoverable coordinates. The backup keeps
-- every discarded duplicate. Prefer assigned rows, then the latest edit.
CREATE TEMPORARY TABLE shortlist_workspace_duplicates (id CHAR(36) PRIMARY KEY);
INSERT INTO shortlist_workspace_duplicates (id)
SELECT DISTINCT a.id FROM shortlist_entries a JOIN shortlist_entries b
 ON a.project_shortlist_id=b.project_shortlist_id
 AND a.trade=b.trade AND a.working_type=b.working_type AND a.id<>b.id
WHERE a.trade IN ('Plumber','Electrician','AC','POP','Flooring','Carpentar','MS','Solar','Glass','Paint','Civil','Facade')
 AND a.working_type IN ('Contractor','Individual','Freelancer')
 AND (
   (b.vendor_id IS NOT NULL OR b.material_id IS NOT NULL OR COALESCE(TRIM(b.name_of_vendor),'')<>'') >
   (a.vendor_id IS NOT NULL OR a.material_id IS NOT NULL OR COALESCE(TRIM(a.name_of_vendor),'')<>'')
   OR (
    (b.vendor_id IS NOT NULL OR b.material_id IS NOT NULL OR COALESCE(TRIM(b.name_of_vendor),'')<>'') =
    (a.vendor_id IS NOT NULL OR a.material_id IS NOT NULL OR COALESCE(TRIM(a.name_of_vendor),'')<>'')
    AND (b.updated_at>a.updated_at OR (b.updated_at=a.updated_at AND b.id<a.id))
   )
 );
DELETE e FROM shortlist_entries e JOIN shortlist_workspace_duplicates d ON e.id=d.id;
DROP TEMPORARY TABLE shortlist_workspace_duplicates;

-- Nullable generated coordinates let unidentified old records coexist while
-- enforcing one valid workspace row per shortlist/trade/work type.
SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.columns
 WHERE table_schema=DATABASE() AND table_name='shortlist_entries' AND column_name='workspace_trade'),
 'SELECT 1',
 'ALTER TABLE shortlist_entries ADD workspace_trade VARCHAR(32) GENERATED ALWAYS AS (CASE WHEN trade IN (''Plumber'',''Electrician'',''AC'',''POP'',''Flooring'',''Carpentar'',''MS'',''Solar'',''Glass'',''Paint'',''Civil'',''Facade'') AND working_type IN (''Contractor'',''Individual'',''Freelancer'') THEN trade ELSE NULL END) STORED, ADD workspace_working_type VARCHAR(32) GENERATED ALWAYS AS (CASE WHEN working_type IN (''Contractor'',''Individual'',''Freelancer'') THEN working_type ELSE NULL END) STORED');
PREPARE migration_stmt FROM @ddl; EXECUTE migration_stmt; DEALLOCATE PREPARE migration_stmt;
SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.statistics
 WHERE table_schema=DATABASE() AND table_name='shortlist_entries' AND index_name='uq_shortlist_workspace_row'),
 'SELECT 1', 'ALTER TABLE shortlist_entries ADD UNIQUE INDEX uq_shortlist_workspace_row (project_shortlist_id, workspace_trade, workspace_working_type)');
PREPARE migration_stmt FROM @ddl; EXECUTE migration_stmt; DEALLOCATE PREPARE migration_stmt;

-- Review records requiring explicit placement; no original values are guessed.
SELECT id, project_shortlist_id, trade, working_type, name_of_vendor,
 estimate_value, quotation_value FROM shortlist_entries WHERE workspace_trade IS NULL;
