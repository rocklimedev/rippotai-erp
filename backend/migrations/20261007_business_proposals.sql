CREATE TABLE IF NOT EXISTS business_proposals (
  id CHAR(36) NOT NULL PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  snapshot JSON NOT NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX business_proposals_project (project_id),
  INDEX business_proposals_updated (updated_at)
);
