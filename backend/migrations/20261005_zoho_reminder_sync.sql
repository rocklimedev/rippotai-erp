-- Apply before starting the sync-enabled backend.
CREATE TABLE IF NOT EXISTS reminder_sync_settings (
  id CHAR(36) NOT NULL PRIMARY KEY, user_id CHAR(36) NOT NULL,
  kind ENUM('tasks','calendar') NOT NULL, enabled BOOLEAN NOT NULL DEFAULT FALSE,
  config JSON NOT NULL, last_run DATETIME NULL, last_error TEXT NULL,
  lock_token CHAR(36) NULL, lock_until DATETIME NULL,
  created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL,
  UNIQUE KEY uq_reminder_settings_user_kind (user_id, kind)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS reminder_sync_records (
  id CHAR(36) NOT NULL PRIMARY KEY, user_id CHAR(36) NOT NULL,
  kind ENUM('tasks','calendar') NOT NULL, local_id CHAR(36) NOT NULL,
  remote_id VARCHAR(255) NULL, destination JSON NOT NULL, fingerprint VARCHAR(64) NULL,
  status ENUM('pending','synced','failed','uncertain') NOT NULL DEFAULT 'pending',
  error TEXT NULL, synced_at DATETIME NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL,
  UNIQUE KEY uq_reminder_records_user_kind_local (user_id, kind, local_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
