-- Run with the application stopped, before deploying the UUID model/API.
-- DDL implicitly commits in MySQL/MariaDB; take a database backup first.
-- Legacy IDs get a deterministic UUID mapping, shared by reports and manpower.
-- The reserved prefix also makes this migration safe to rerun.
DELIMITER $$
CREATE PROCEDURE migrate_daily_site_report_uuid()
BEGIN
  DECLARE finished INT DEFAULT 0;
  DECLARE fk_name VARCHAR(64);
  DECLARE delete_rule VARCHAR(20);
  DECLARE update_rule VARCHAR(20);
  DECLARE report_type VARCHAR(64);
  DECLARE fk_cursor CURSOR FOR
    SELECT CONSTRAINT_NAME, DELETE_RULE, UPDATE_RULE
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'manpower_entries'
      AND REFERENCED_TABLE_NAME = 'daily_site_reports';
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET finished = 1;

  SELECT DATA_TYPE INTO report_type FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'daily_site_reports'
      AND COLUMN_NAME = 'id';

  IF report_type IN ('int', 'bigint', 'smallint', 'mediumint', 'tinyint') THEN
    IF EXISTS (
      SELECT 1 FROM manpower_entries m LEFT JOIN daily_site_reports r
        ON r.id = m.daily_site_report_id WHERE r.id IS NULL
    ) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Orphan manpower report references must be repaired before UUID migration';
    END IF;
    IF EXISTS (
      SELECT 1 FROM information_schema.KEY_COLUMN_USAGE
      WHERE REFERENCED_TABLE_SCHEMA = DATABASE()
        AND REFERENCED_TABLE_NAME = 'daily_site_reports'
        AND (TABLE_NAME <> 'manpower_entries' OR COLUMN_NAME <> 'daily_site_report_id')
    ) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Additional report foreign keys require an extended UUID migration';
    END IF;

    CREATE TEMPORARY TABLE daily_report_uuid_foreign_keys (
      name VARCHAR(64), on_delete VARCHAR(20), on_update VARCHAR(20)
    );
    OPEN fk_cursor;
    drop_keys: LOOP
      FETCH fk_cursor INTO fk_name, delete_rule, update_rule;
      IF finished = 1 THEN LEAVE drop_keys; END IF;
      INSERT INTO daily_report_uuid_foreign_keys VALUES (fk_name, delete_rule, update_rule);
      SET @daily_report_ddl = CONCAT('ALTER TABLE manpower_entries DROP FOREIGN KEY `', REPLACE(fk_name, '`', '``'), '`');
      PREPARE daily_report_stmt FROM @daily_report_ddl;
      EXECUTE daily_report_stmt;
      DEALLOCATE PREPARE daily_report_stmt;
    END LOOP;
    CLOSE fk_cursor;

    -- Remove AUTO_INCREMENT while converting the existing values to strings.
    ALTER TABLE daily_site_reports MODIFY id CHAR(36) NOT NULL;
    ALTER TABLE manpower_entries MODIFY daily_site_report_id CHAR(36) NOT NULL;
    START TRANSACTION;
    UPDATE manpower_entries
      SET daily_site_report_id = CONCAT('d5100000-0000-4000-8000-', LPAD(HEX(CAST(daily_site_report_id AS UNSIGNED)), 12, '0'));
    UPDATE daily_site_reports
      SET id = CONCAT('d5100000-0000-4000-8000-', LPAD(HEX(CAST(id AS UNSIGNED)), 12, '0'));
    COMMIT;

    WHILE EXISTS (SELECT 1 FROM daily_report_uuid_foreign_keys) DO
      SELECT name, on_delete, on_update INTO fk_name, delete_rule, update_rule
        FROM daily_report_uuid_foreign_keys LIMIT 1;
      SET @daily_report_ddl = CONCAT('ALTER TABLE manpower_entries ADD CONSTRAINT `', REPLACE(fk_name, '`', '``'),
        '` FOREIGN KEY (daily_site_report_id) REFERENCES daily_site_reports (id) ON DELETE ', delete_rule, ' ON UPDATE ', update_rule);
      PREPARE daily_report_stmt FROM @daily_report_ddl;
      EXECUTE daily_report_stmt;
      DEALLOCATE PREPARE daily_report_stmt;
      DELETE FROM daily_report_uuid_foreign_keys WHERE name = fk_name;
    END WHILE;
    DROP TEMPORARY TABLE daily_report_uuid_foreign_keys;
  END IF;
END$$
CALL migrate_daily_site_report_uuid()$$
DROP PROCEDURE migrate_daily_site_report_uuid$$
DELIMITER ;
