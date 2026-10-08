-- Apply before deploying the saved vendor comparison workspace.
CREATE TABLE IF NOT EXISTS vendor_rate_comparisons (
  id CHAR(36) NOT NULL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  project_id CHAR(36) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  boq_id CHAR(36) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  notes TEXT NULL,
  snapshot JSON NOT NULL,
  revision INT NOT NULL DEFAULT 1,
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_rate_comparison_project (project_id),
  KEY idx_rate_comparison_boq (boq_id),
  KEY idx_rate_comparison_updated (updated_at),
  CONSTRAINT fk_rate_comparison_project FOREIGN KEY (project_id) REFERENCES projects(id),
  CONSTRAINT fk_rate_comparison_boq FOREIGN KEY (boq_id) REFERENCES boqs(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
