SET @lead_referral_name_ddl = IF(
  EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'leads'
      AND COLUMN_NAME = 'referral_name'
  ),
  'DO 0',
  'ALTER TABLE leads ADD COLUMN referral_name VARCHAR(255) NULL'
);
PREPARE lead_referral_name_stmt FROM @lead_referral_name_ddl;
EXECUTE lead_referral_name_stmt;
DEALLOCATE PREPARE lead_referral_name_stmt;
