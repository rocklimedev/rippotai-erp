CREATE TABLE scope_categories (
    id CHAR(36) NOT NULL,

    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,

    description TEXT NULL,

    sort_order INT NOT NULL DEFAULT 0,

    is_active TINYINT(1) NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_at DATETIME NULL,

    PRIMARY KEY (id),

    INDEX idx_scope_categories_active (is_active),
    INDEX idx_scope_categories_sort_order (sort_order)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


  CREATE TABLE project_spaces (
    id CHAR(36) NOT NULL,

    project_id CHAR(36) NOT NULL,

    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,

    description TEXT NULL,

    sort_order INT NOT NULL DEFAULT 0,

    is_active TINYINT(1) NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_at DATETIME NULL,

    PRIMARY KEY (id),

    INDEX idx_project_spaces_project_id (project_id),
    INDEX idx_project_spaces_sort_order (sort_order),
    INDEX idx_project_spaces_active (is_active),

    UNIQUE KEY uq_project_space_slug (
        project_id,
        slug
    )

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


  CREATE TABLE scope_categories (
    id CHAR(36) NOT NULL,

    project_id CHAR(36) NOT NULL,
    scope_category_id CHAR(36) NOT NULL,

    sort_order INT NOT NULL DEFAULT 0,

    is_active TINYINT(1) NOT NULL DEFAULT 1,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uq_project_scope_category (
        project_id,
        scope_category_id
    ),

    INDEX idx_psc_project_id (project_id),
    INDEX idx_psc_category_id (scope_category_id)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE scope_items (
    id CHAR(36) NOT NULL,

    project_id CHAR(36) NOT NULL,

    project_space_id CHAR(36) NOT NULL,
    scope_category_id CHAR(36) NOT NULL,

    scope_of_work TEXT NULL,

    is_included TINYINT(1) NOT NULL DEFAULT 1,

    is_excluded TINYINT(1) NOT NULL DEFAULT 0,

    notes TEXT NULL,

    sort_order INT NOT NULL DEFAULT 0,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_at DATETIME NULL,

    PRIMARY KEY (id),

    INDEX idx_scope_items_project_id (project_id),
    INDEX idx_scope_items_space_id (project_space_id),
    INDEX idx_scope_items_category_id (scope_category_id),

    UNIQUE KEY uq_scope_item (
        project_id,
        project_space_id,
        scope_category_id
    )

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE scope_of_work (
    id CHAR(36) NOT NULL,

    project_id CHAR(36) NOT NULL,

    scope_summary TEXT NULL,

    specific_exclusions TEXT NULL,

    notes TEXT NULL,

    project_mode VARCHAR(50) NULL,

    version INT NOT NULL DEFAULT 1,

    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',

    prepared_by CHAR(36) NULL,
    reviewed_by CHAR(36) NULL,

    accepted_at DATETIME NULL,
    accepted_by CHAR(36) NULL,

    client_signature_name VARCHAR(255) NULL,
    client_signature_date DATE NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    deleted_at DATETIME NULL,

    PRIMARY KEY (id),

    UNIQUE KEY uq_project_scope_project (
        project_id,
        version
    ),

    INDEX idx_project_scope_project_id (project_id),
    INDEX idx_project_scope_status (status)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;