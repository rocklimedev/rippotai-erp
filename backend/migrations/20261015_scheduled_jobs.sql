-- Requires MySQL 5.7+ / compatible MariaDB with InnoDB and named locks.
CREATE TABLE IF NOT EXISTS scheduled_jobs (
  name VARCHAR(100) PRIMARY KEY,
  next_run_at DATETIME(3) NOT NULL,
  occurrence_id CHAR(36) NOT NULL,
  last_success_at DATETIME(3) NULL,
  last_failed_at DATETIME(3) NULL,
  failures INT UNSIGNED NOT NULL DEFAULT 0,
  last_error TEXT NULL
) ENGINE=InnoDB;

-- A retry of the same due occurrence must not replay committed automation effects.
ALTER TABLE automation_runs
  ADD COLUMN execution_key VARCHAR(160) NULL,
  ADD UNIQUE KEY uq_automation_execution (rule_id, entity_type, entity_id, execution_key);
