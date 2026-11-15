-- Document list: review workflow + revision snapshots for every flow document.
-- Idempotent (CREATE TABLE IF NOT EXISTS). No data is inserted.
-- document_reviews: one row per Approve / Revise / Reject / Archive with its comment.
-- document_snapshots: previous state of a document (main row + child rows as JSON)
--   stored each time it is saved again; `version` is the version the snapshot holds.
--   (The existing `document_versions` table belongs to uploaded files and is unchanged.)
CREATE TABLE IF NOT EXISTS document_reviews (
  id CHAR(36) NOT NULL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id CHAR(36) NOT NULL,
  project_id CHAR(36) NULL,
  action VARCHAR(20) NOT NULL,
  comment TEXT NULL,
  version INT NULL,
  user_id CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY document_reviews_entity (entity_type, entity_id, created_at),
  KEY document_reviews_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS document_snapshots (
  id CHAR(36) NOT NULL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id CHAR(36) NOT NULL,
  project_id CHAR(36) NULL,
  version INT NOT NULL DEFAULT 1,
  data LONGTEXT NULL,
  user_id CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY document_snapshots_entity (entity_type, entity_id, version),
  KEY document_snapshots_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
