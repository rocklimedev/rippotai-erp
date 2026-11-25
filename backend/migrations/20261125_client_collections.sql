-- Money collected from the client per project (Command Center › Commercial):
-- TOKEN = token / booking amount, PROJECT_PAYMENT = a project payment.
CREATE TABLE IF NOT EXISTS client_collections (
  id CHAR(36) NOT NULL PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  type ENUM('TOKEN', 'PROJECT_PAYMENT') NOT NULL,
  amount DECIMAL(14, 2) NOT NULL,
  received_on DATE NOT NULL,
  note TEXT NULL,
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  KEY idx_client_collections_project (project_id, received_on)
);
