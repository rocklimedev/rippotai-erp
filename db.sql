CREATE TABLE `document_types` (
    `id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',

    `code` VARCHAR(100) NOT NULL COLLATE 'utf8_unicode_ci',
    `name` VARCHAR(255) NOT NULL COLLATE 'utf8_unicode_ci',

    `phase_code` VARCHAR(50) NOT NULL COLLATE 'utf8_unicode_ci',
    `phase_name` VARCHAR(255) NOT NULL COLLATE 'utf8_unicode_ci',

    `section_code` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `section_name` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `sequence` INT NOT NULL DEFAULT 0,

    -- DOCUMENT = documents table
    -- DRAWING  = drawings table
    `target_type` VARCHAR(30) NOT NULL DEFAULT 'DOCUMENT' COLLATE 'utf8_unicode_ci',

    -- REQUIRED / OPTIONAL / CONDITIONAL
    `requirement_type` VARCHAR(30) NOT NULL DEFAULT 'REQUIRED' COLLATE 'utf8_unicode_ci',

    `allows_multiple` TINYINT(1) NOT NULL DEFAULT 0,
    `requires_revision` TINYINT(1) NOT NULL DEFAULT 0,
    `requires_approval` TINYINT(1) NOT NULL DEFAULT 0,

    `description` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `is_active` TINYINT(1) NOT NULL DEFAULT 1,

    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`) USING BTREE,

    UNIQUE KEY `uq_document_types_code` (`code`) USING BTREE,

    INDEX `idx_document_types_phase`
        (`phase_code`) USING BTREE,

    INDEX `idx_document_types_section`
        (`section_code`) USING BTREE,

    INDEX `idx_document_types_order`
        (`phase_code`, `sequence`) USING BTREE
)
COLLATE='utf8_unicode_ci'
ENGINE=InnoDB;

CREATE TABLE `document_requirements` (
    `id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',

    `project_id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',
    `document_type_id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',

    `requirement_type` VARCHAR(30) NOT NULL DEFAULT 'REQUIRED'
        COLLATE 'utf8_unicode_ci',

    `is_enabled` TINYINT(1) NOT NULL DEFAULT 1,
    `is_completed` TINYINT(1) NOT NULL DEFAULT 0,

    `completed_at` DATETIME NULL DEFAULT NULL,

    `remarks` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`) USING BTREE,

    UNIQUE KEY `uq_project_document_requirement`
        (`project_id`, `document_type_id`) USING BTREE,

    INDEX `idx_document_requirements_project`
        (`project_id`) USING BTREE,

    INDEX `idx_document_requirements_type`
        (`document_type_id`) USING BTREE,

    CONSTRAINT `fk_document_requirements_project`
        FOREIGN KEY (`project_id`)
        REFERENCES `projects` (`id`)
        ON UPDATE RESTRICT
        ON DELETE CASCADE,

    CONSTRAINT `fk_document_requirements_type`
        FOREIGN KEY (`document_type_id`)
        REFERENCES `document_types` (`id`)
        ON UPDATE RESTRICT
        ON DELETE RESTRICT
)
COLLATE='utf8_unicode_ci'
ENGINE=InnoDB;

CREATE TABLE `documents` (
    `id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',

    `project_id` CHAR(36) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `document_type_id` CHAR(36) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `requirement_id` CHAR(36) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `category` VARCHAR(100) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `title` VARCHAR(255) NOT NULL COLLATE 'utf8_unicode_ci',

    `filename` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `storage_filename` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `url` VARCHAR(1000) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `mime` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `size` BIGINT NULL DEFAULT NULL,

    `version` VARCHAR(50) NULL DEFAULT 'V1' COLLATE 'utf8_unicode_ci',

    `status` VARCHAR(50) NULL DEFAULT 'draft' COLLATE 'utf8_unicode_ci',

    `visibility` VARCHAR(50) NULL DEFAULT 'internal'
        COLLATE 'utf8_unicode_ci',

    `remarks` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `is_locked` TINYINT(1) NOT NULL DEFAULT 0,

    `locked_by` CHAR(36) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `locked_at` DATETIME NULL DEFAULT NULL,

    `uploaded_by` CHAR(36) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `uploaded_by_name` VARCHAR(255) NULL DEFAULT NULL
        COLLATE 'utf8_unicode_ci',

    `document_date` DATE NULL DEFAULT NULL,

    `doc_type` VARCHAR(50) NULL DEFAULT 'upload'
        COLLATE 'utf8_unicode_ci',

    `doc_no` VARCHAR(255) NULL DEFAULT NULL
        COLLATE 'utf8_unicode_ci',

    `sections` JSON NULL DEFAULT NULL,

    `source_app` VARCHAR(255) NULL DEFAULT NULL
        COLLATE 'utf8_unicode_ci',

    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,

    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`) USING BTREE,

    INDEX `idx_documents_project`
        (`project_id`) USING BTREE,

    INDEX `idx_documents_type`
        (`document_type_id`) USING BTREE,

    INDEX `idx_documents_requirement`
        (`requirement_id`) USING BTREE,

    INDEX `idx_documents_status`
        (`status`) USING BTREE,

    CONSTRAINT `fk_documents_project`
        FOREIGN KEY (`project_id`)
        REFERENCES `projects` (`id`)
        ON UPDATE RESTRICT
        ON DELETE SET NULL,

    CONSTRAINT `fk_documents_type`
        FOREIGN KEY (`document_type_id`)
        REFERENCES `document_types` (`id`)
        ON UPDATE RESTRICT
        ON DELETE SET NULL,

    CONSTRAINT `fk_documents_requirement`
        FOREIGN KEY (`requirement_id`)
        REFERENCES `document_requirements` (`id`)
        ON UPDATE RESTRICT
        ON DELETE SET NULL
)
COLLATE='utf8_unicode_ci'
ENGINE=InnoDB;

CREATE TABLE `document_versions` (
    `id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',

    `document_id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',

    `version` VARCHAR(50) NOT NULL COLLATE 'utf8_unicode_ci',

    `filename` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `storage_filename` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `url` VARCHAR(1000) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `mime` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `size` BIGINT NULL DEFAULT NULL,

    `status` VARCHAR(50) NULL DEFAULT 'draft'
        COLLATE 'utf8_unicode_ci',

    `remarks` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `uploaded_by` CHAR(36) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `uploaded_by_name` VARCHAR(255) NULL DEFAULT NULL
        COLLATE 'utf8_unicode_ci',

    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,

    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`) USING BTREE,

    UNIQUE KEY `uq_document_version`
        (`document_id`, `version`) USING BTREE,

    INDEX `idx_document_versions_document`
        (`document_id`) USING BTREE,

    CONSTRAINT `fk_document_versions_document`
        FOREIGN KEY (`document_id`)
        REFERENCES `documents` (`id`)
        ON UPDATE RESTRICT
        ON DELETE CASCADE
)
COLLATE='utf8_unicode_ci'
ENGINE=InnoDB;

CREATE TABLE `document_attachments` (
    `id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',

    `document_id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',

    `filename` VARCHAR(255) NOT NULL COLLATE 'utf8_unicode_ci',
    `storage_filename` VARCHAR(255) NULL DEFAULT NULL
        COLLATE 'utf8_unicode_ci',

    `url` VARCHAR(1000) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `mime` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `size` BIGINT NULL DEFAULT NULL,

    `remark` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,

    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`) USING BTREE,

    INDEX `idx_document_attachments_document`
        (`document_id`) USING BTREE,

    CONSTRAINT `fk_document_attachments_document`
        FOREIGN KEY (`document_id`)
        REFERENCES `documents` (`id`)
        ON UPDATE RESTRICT
        ON DELETE CASCADE
)
COLLATE='utf8_unicode_ci'
ENGINE=InnoDB;

CREATE TABLE `drawings` (
    `id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',

    `project_id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',

    `document_type_id` CHAR(36) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `requirement_id` CHAR(36) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `title` VARCHAR(255) NOT NULL COLLATE 'utf8_unicode_ci',

    `drawing_number` VARCHAR(255) NOT NULL COLLATE 'utf8_unicode_ci',

    `phase_code` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `discipline` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `sheet_number` VARCHAR(100) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `scale` VARCHAR(100) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `issue_purpose` VARCHAR(255) NULL DEFAULT NULL
        COLLATE 'utf8_unicode_ci',

    `status` VARCHAR(50) NULL DEFAULT 'Draft'
        COLLATE 'utf8_unicode_ci',

    `remarks` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `sequence` INT NULL DEFAULT NULL,

    `drawn_by` CHAR(36) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `checked_by` CHAR(36) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `approved_by` CHAR(36) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,

    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`) USING BTREE,

    UNIQUE KEY `uq_project_drawing_number`
        (`project_id`, `drawing_number`) USING BTREE,

    INDEX `idx_drawings_project`
        (`project_id`) USING BTREE,

    INDEX `idx_drawings_type`
        (`document_type_id`) USING BTREE,

    INDEX `idx_drawings_requirement`
        (`requirement_id`) USING BTREE,

    INDEX `idx_drawings_phase`
        (`phase_code`) USING BTREE,

    INDEX `idx_drawings_discipline`
        (`discipline`) USING BTREE,

    INDEX `idx_drawings_status`
        (`status`) USING BTREE,

    CONSTRAINT `fk_drawings_project`
        FOREIGN KEY (`project_id`)
        REFERENCES `projects` (`id`)
        ON UPDATE RESTRICT
        ON DELETE CASCADE,

    CONSTRAINT `fk_drawings_type`
        FOREIGN KEY (`document_type_id`)
        REFERENCES `document_types` (`id`)
        ON UPDATE RESTRICT
        ON DELETE SET NULL,

    CONSTRAINT `fk_drawings_requirement`
        FOREIGN KEY (`requirement_id`)
        REFERENCES `document_requirements` (`id`)
        ON UPDATE RESTRICT
        ON DELETE SET NULL
)
COLLATE='utf8_unicode_ci'
ENGINE=InnoDB;

CREATE TABLE `drawing_revisions` (
    `id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',

    `drawing_id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',

    `revision` VARCHAR(50) NOT NULL COLLATE 'utf8_unicode_ci',

    `issue_date` DATE NULL DEFAULT NULL,

    `issue_purpose` VARCHAR(255) NULL DEFAULT NULL
        COLLATE 'utf8_unicode_ci',

    `status` VARCHAR(50) NULL DEFAULT 'Draft'
        COLLATE 'utf8_unicode_ci',

    `filename` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `storage_filename` VARCHAR(255) NULL DEFAULT NULL
        COLLATE 'utf8_unicode_ci',

    `url` VARCHAR(1000) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `mime` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `size` BIGINT NULL DEFAULT NULL,

    `remarks` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `uploaded_by` CHAR(36) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `uploaded_by_name` VARCHAR(255) NULL DEFAULT NULL
        COLLATE 'utf8_unicode_ci',

    `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,

    `updated_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`) USING BTREE,

    UNIQUE KEY `uq_drawing_revision`
        (`drawing_id`, `revision`) USING BTREE,

    INDEX `idx_drawing_revisions_drawing`
        (`drawing_id`) USING BTREE,

    INDEX `idx_drawing_revisions_status`
        (`status`) USING BTREE,

    CONSTRAINT `fk_drawing_revisions_drawing`
        FOREIGN KEY (`drawing_id`)
        REFERENCES `drawings` (`id`)
        ON UPDATE RESTRICT
        ON DELETE CASCADE
)
COLLATE='utf8_unicode_ci'
ENGINE=InnoDB;