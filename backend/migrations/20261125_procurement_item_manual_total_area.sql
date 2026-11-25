SET @procurement_manual_area_ddl = IF(
  EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'material_procurement_items'
      AND COLUMN_NAME = 'is_total_area_manual'
  ),
  'DO 0',
  'ALTER TABLE material_procurement_items ADD COLUMN is_total_area_manual BOOLEAN NULL'
);
PREPARE procurement_manual_area_stmt FROM @procurement_manual_area_ddl;
EXECUTE procurement_manual_area_stmt;
DEALLOCATE PREPARE procurement_manual_area_stmt;
