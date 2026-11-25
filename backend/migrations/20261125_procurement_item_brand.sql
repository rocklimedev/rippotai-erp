SET @procurement_brand_ddl = IF(
  EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'material_procurement_items'
      AND COLUMN_NAME = 'brand'
  ),
  'DO 0',
  'ALTER TABLE material_procurement_items ADD COLUMN brand VARCHAR(150) NULL'
);
PREPARE procurement_brand_stmt FROM @procurement_brand_ddl;
EXECUTE procurement_brand_stmt;
DEALLOCATE PREPARE procurement_brand_stmt;
