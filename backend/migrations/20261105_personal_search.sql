-- Apply before deployment. Requires MySQL 8.0; no runtime schema changes.
CREATE TABLE IF NOT EXISTS erp_search_documents (
  sequence_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  index_name VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  document_id VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  project_id VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL,
  document JSON NOT NULL,
  PRIMARY KEY (sequence_id),
  UNIQUE KEY uq_search_document (index_name, document_id),
  KEY idx_search_project (project_id, index_name, sequence_id)
) ENGINE=InnoDB;
