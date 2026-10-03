-- MySQL: reusable snapshots. No source-project FK: packages survive source deletion.
-- Run before deploying the package API. Rollback: DROP TABLE shortlist_packages;
CREATE TABLE IF NOT EXISTS shortlist_packages (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  shortlist_type ENUM('VENDOR', 'MATERIAL') NOT NULL,
  entries JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_shortlist_packages_type (shortlist_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
