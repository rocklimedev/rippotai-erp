-- Apply before deploying the Crucial Work feature. Existing tasks stay unmarked.
-- Stable reference numbers are allocated to every task; marking does not renumber them.
SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'tasks' AND column_name = 'is_crucial'), 'SELECT 1', 'ALTER TABLE tasks ADD COLUMN is_crucial BOOLEAN NOT NULL DEFAULT FALSE');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'tasks' AND column_name = 'crucial_reason'), 'SELECT 1', 'ALTER TABLE tasks ADD COLUMN crucial_reason TEXT NULL');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'tasks' AND column_name = 'crucial_ref'), 'SELECT 1', 'ALTER TABLE tasks ADD COLUMN crucial_ref INT UNSIGNED NOT NULL AUTO_INCREMENT, ADD UNIQUE KEY tasks_crucial_ref_unique (crucial_ref)');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS crucial_task_checks (
  id CHAR(36) NOT NULL PRIMARY KEY,
  task_id CHAR(36) NOT NULL,
  cycle_date DATE NOT NULL,
  cycle ENUM('daily', 'weekly') NOT NULL,
  check_status ENUM('checked', 'in_progress', 'not_checked') NOT NULL,
  follow_up TEXT NULL,
  checked_by CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY crucial_task_cycle_unique (task_id, cycle_date, cycle),
  KEY crucial_check_cycle (cycle_date, cycle)
);
