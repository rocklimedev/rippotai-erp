-- finish-pages: native Tasks (status workflow, assignee, description, start date) + Notes app
ALTER TABLE tasks
  MODIFY status ENUM('todo','in_progress','review','blocked','completed') NOT NULL DEFAULT 'todo',
  ADD COLUMN IF NOT EXISTS description TEXT NULL AFTER title,
  ADD COLUMN IF NOT EXISTS assigned_to CHAR(36) NULL AFTER created_by,
  ADD COLUMN IF NOT EXISTS start_date DATETIME NULL AFTER status;
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks (assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status);

CREATE TABLE IF NOT EXISTS notes (
  id CHAR(36) NOT NULL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  body TEXT NULL,
  project_id CHAR(36) NULL,
  client_id CHAR(36) NULL,
  category VARCHAR(40) NOT NULL DEFAULT 'general',
  tone VARCHAR(20) NOT NULL DEFAULT 'mute',
  pinned TINYINT(1) NOT NULL DEFAULT 0,
  is_shared TINYINT(1) NOT NULL DEFAULT 1,
  created_by CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_notes_project (project_id),
  KEY idx_notes_client (client_id),
  KEY idx_notes_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
