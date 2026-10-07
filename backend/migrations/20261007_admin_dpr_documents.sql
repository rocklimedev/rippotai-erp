-- Apply after db/migrations/20261006_admin_dpr.sql, before deploying the updated app.
-- Entries remain in their existing tables. Each saved DPR additionally retains
-- an immutable JSON snapshot of both workbook sections and the exact XLSX bytes.
CREATE TABLE IF NOT EXISTS admin_dpr_documents (
  id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  project_id CHAR(36) NULL,
  project_names JSON NOT NULL,
  project_ids JSON NOT NULL,
  from_date DATE NULL,
  to_date DATE NULL,
  filters JSON NOT NULL,
  reports JSON NOT NULL,
  logs JSON NOT NULL,
  report_count INT NOT NULL,
  log_count INT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  excel_data LONGBLOB NOT NULL,
  created_by CHAR(36) NULL,
  created_by_name VARCHAR(150) NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_admin_dpr_documents_created (created_at),
  KEY idx_admin_dpr_documents_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
