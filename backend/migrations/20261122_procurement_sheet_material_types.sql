-- 20261122_procurement_sheet_material_types.sql
--
-- Procurement Sheet divided by material type: each procurement keeps an
-- ordered list of sheets (material types) and every item row records the
-- sheet it belongs to. Idempotent; existing rows are kept (sheet left empty,
-- the app files them under their material's type).

SET @procurement_sheet_ddl = IF(
  EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'material_procurements'
      AND COLUMN_NAME = 'sheets'
  ),
  'DO 0',
  'ALTER TABLE material_procurements ADD COLUMN sheets LONGTEXT NULL AFTER remarks'
);
PREPARE procurement_sheet_stmt FROM @procurement_sheet_ddl;
EXECUTE procurement_sheet_stmt;
DEALLOCATE PREPARE procurement_sheet_stmt;

SET @procurement_sheet_ddl = IF(
  EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'material_procurement_items'
      AND COLUMN_NAME = 'sheet_name'
  ),
  'DO 0',
  'ALTER TABLE material_procurement_items ADD COLUMN sheet_name VARCHAR(120) NULL AFTER location'
);
PREPARE procurement_sheet_stmt FROM @procurement_sheet_ddl;
EXECUTE procurement_sheet_stmt;
DEALLOCATE PREPARE procurement_sheet_stmt;
