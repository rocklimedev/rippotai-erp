SET @procurement_custom_fields_ddl = IF(
  EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'material_procurement_items'
      AND COLUMN_NAME = 'custom_values'
  ),
  'DO 0',
  'ALTER TABLE material_procurement_items ADD COLUMN custom_values JSON NULL'
);
PREPARE procurement_custom_fields_stmt FROM @procurement_custom_fields_ddl;
EXECUTE procurement_custom_fields_stmt;
DEALLOCATE PREPARE procurement_custom_fields_stmt;
