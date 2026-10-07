-- Independent document storage; existing legacy snag_items are preserved.
CREATE TABLE IF NOT EXISTS snag_lists (
 id CHAR(36) NOT NULL PRIMARY KEY,
 project_id CHAR(36) NOT NULL,
 project_name VARCHAR(255) NOT NULL,
 title VARCHAR(255) NOT NULL,
 document_date DATE NOT NULL,
 revision INT NOT NULL,
 items JSON NOT NULL,
 item_count INT NOT NULL,
 open_count INT NOT NULL,
 excel_data LONGBLOB NOT NULL,
 created_by CHAR(36) NULL,
 updated_by CHAR(36) NULL,
 created_at DATETIME NOT NULL,
 updated_at DATETIME NOT NULL,
 KEY idx_snag_lists_project_date (project_id, document_date),
 KEY idx_snag_lists_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS snag_list_revisions (
 id CHAR(36) NOT NULL PRIMARY KEY,
 snag_list_id CHAR(36) NOT NULL,
 revision INT NOT NULL,
 document JSON NOT NULL,
 excel_data LONGBLOB NOT NULL,
 created_by CHAR(36) NULL,
 created_at DATETIME NOT NULL,
 UNIQUE KEY uq_snag_list_revision (snag_list_id, revision),
 CONSTRAINT fk_snag_list_revision FOREIGN KEY (snag_list_id) REFERENCES snag_lists(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
