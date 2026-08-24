
CREATE TABLE IF NOT EXISTS `project_briefs` (
    `id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',
    `project_id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',


    `relationship_to_client` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `referred_by_source` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `brief_date` DATE NULL DEFAULT NULL,

    -- --------------------------------------------------------
    -- 02. SITE & PROPERTY DETAILS
    -- --------------------------------------------------------
    `site_address` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `property_type` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `site_area` DECIMAL(15,2) NULL DEFAULT NULL,
    `site_area_unit` ENUM('SQ_FT','GAJ','OTHER') NULL DEFAULT NULL,
    `site_area_other_unit` VARCHAR(50) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `facing_orientation` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `parking_provision` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `ownership_status` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `number_of_floors` INT NULL DEFAULT NULL,
    `lift_available` TINYINT(1) NULL DEFAULT NULL,

    `site_type` ENUM(
        'FLAT',
        'FLOOR',
        'KOTHI',
        'RAW',
        'OTHER'
    ) NULL DEFAULT NULL,

    `site_type_other` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `site_condition` ENUM(
        'OCCUPIED',
        'UNOCCUPIED'
    ) NULL DEFAULT NULL,

    `drawings_other` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    -- --------------------------------------------------------
    -- 03. SCOPE OF WORK
    -- --------------------------------------------------------
    `work_type_other` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `services_other` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `areas_included_in_scope` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `areas_excluded_from_scope` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `work_already_done_by_others` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    -- --------------------------------------------------------
    -- 05. DESIGN DIRECTION & PREFERENCES
    -- --------------------------------------------------------
    `vastu_requirements` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `colours_to_avoid` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `materials_liked` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `materials_disliked_hard_no` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `must_have_elements` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `colours_preferred` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `maintenance_appetite` ENUM(
        'HIGH',
        'MEDIUM',
        'LOW'
    ) NULL DEFAULT NULL,

    -- --------------------------------------------------------
    -- 06. BUDGET
    -- --------------------------------------------------------
    `initial_client_budget` DECIMAL(15,2) NULL DEFAULT NULL,
    `budget_currency` VARCHAR(10) NOT NULL DEFAULT 'INR' COLLATE 'utf8_unicode_ci',

    `budget_gst_status` ENUM(
        'INCLUDES_GST',
        'EXCLUDES_GST',
        'NOT_SPECIFIED'
    ) NULL DEFAULT NULL,

    `funding_stage` ENUM(
        'SELF_FUNDED',
        'LOAN',
        'NOT_SPECIFIED'
    ) NULL DEFAULT NULL,

    `budget_flexibility` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    -- --------------------------------------------------------
    -- 07. TIMELINE
    -- --------------------------------------------------------
    `desired_start_date` DATE NULL DEFAULT NULL,

    `start_date_status` ENUM(
        'FIXED',
        'PREFERRED',
        'NOT_SPECIFIED'
    ) NULL DEFAULT NULL,

    `site_handover_date` DATE NULL DEFAULT NULL,
    `target_completion_date` DATE NULL DEFAULT NULL,
    `deadline_reason` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `phasing_required` TINYINT(1) NULL DEFAULT NULL,


    `society_rwa_permitted_work_timings` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `noc_or_security_deposit_required` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `structural_changes_permitted` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `material_movement_restrictions` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `neighbour_sensitivities` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `power_and_water_availability` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `access_storage_debris_disposal` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `ongoing_work_by_other_agencies` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',


    `household_notes` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',


    `open_points_to_close` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `brief_taken_by` CHAR(36) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `brief_taken_date` DATE NULL DEFAULT NULL,

    `confirmed_by_user_id` CHAR(36) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `confirmed_date` DATE NULL DEFAULT NULL,


    `status` ENUM(
        'DRAFT',
        'READY_FOR_DESIGN',
        'SIGNED_OFF',
        'ARCHIVED'
    ) NOT NULL DEFAULT 'DRAFT',

    `version` INT NOT NULL DEFAULT 1,

    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` DATETIME NULL DEFAULT NULL,

    PRIMARY KEY (`id`) USING BTREE,

    UNIQUE INDEX `uk_project_briefs_project_version`
        (`project_id`, `version`) USING BTREE,

    INDEX `idx_project_briefs_project`
        (`project_id`) USING BTREE,

    INDEX `idx_project_briefs_status`
        (`status`) USING BTREE,

    INDEX `idx_project_briefs_brief_date`
        (`brief_date`) USING BTREE,

    INDEX `idx_project_briefs_deleted_at`
        (`deleted_at`) USING BTREE,

    CONSTRAINT `fk_project_briefs_project`
        FOREIGN KEY (`project_id`)
        REFERENCES `projects` (`id`)
        ON UPDATE RESTRICT
        ON DELETE CASCADE,

    CONSTRAINT `fk_project_briefs_taken_by`
        FOREIGN KEY (`brief_taken_by`)
        REFERENCES `users` (`id`)
        ON UPDATE RESTRICT
        ON DELETE SET NULL,

    CONSTRAINT `fk_project_briefs_confirmed_by`
        FOREIGN KEY (`confirmed_by_user_id`)
        REFERENCES `users` (`id`)
        ON UPDATE RESTRICT
        ON DELETE SET NULL
)
COLLATE='utf8_unicode_ci'
ENGINE=InnoDB;


-- ============================================================
-- 01. DRAWINGS & DOCUMENTS AVAILABLE WITH CLIENT
-- ============================================================
CREATE TABLE IF NOT EXISTS `project_brief_documents` (
    `id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',
    `project_brief_id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',

    `document_type` ENUM(
        'SANCTIONED_PLAN',
        'ARCHITECTURAL_DRAWINGS',
        'STRUCTURAL_DRAWINGS',
        'MEP_LAYOUT',
        'COMPLETION_CERTIFICATE',
        'SOCIETY_NOC',
        'PREVIOUS_DESIGNER_FILES',
        'NOTHING_AVAILABLE',
        'OTHER'
    ) NOT NULL,

    `document_name` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `document_url` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `notes` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`) USING BTREE,

    INDEX `idx_project_brief_documents_brief`
        (`project_brief_id`) USING BTREE,

    CONSTRAINT `fk_project_brief_documents_brief`
        FOREIGN KEY (`project_brief_id`)
        REFERENCES `project_briefs` (`id`)
        ON UPDATE RESTRICT
        ON DELETE CASCADE
)
COLLATE='utf8_unicode_ci'
ENGINE=InnoDB;


-- ============================================================
-- 03. TYPE OF WORK
-- ============================================================
CREATE TABLE IF NOT EXISTS `project_brief_work_types` (
    `id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',
    `project_brief_id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',

    `work_type` ENUM(
        'TURNKEY',
        'CONSULTANCY',
        'BUILDER_FINANCE',
        'PMC_WORK',
        'OTHER'
    ) NOT NULL,

    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`) USING BTREE,

    UNIQUE INDEX `uk_project_brief_work_type`
        (`project_brief_id`, `work_type`) USING BTREE,

    CONSTRAINT `fk_project_brief_work_types_brief`
        FOREIGN KEY (`project_brief_id`)
        REFERENCES `project_briefs` (`id`)
        ON UPDATE RESTRICT
        ON DELETE CASCADE
)
COLLATE='utf8_unicode_ci'
ENGINE=InnoDB;


-- ============================================================
-- 03. SERVICES REQUIRED
-- ============================================================
CREATE TABLE IF NOT EXISTS `project_brief_services` (
    `id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',
    `project_brief_id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',

    `service_type` ENUM(
        'ARCHITECTURE_DESIGN',
        'INTERIOR_DESIGN',
        'EXECUTION',
        'LABOUR_WORK',
        'LANDSCAPE_DESIGN',
        'MATERIAL_PROCUREMENT',
        'OTHER'
    ) NOT NULL,

    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`) USING BTREE,

    UNIQUE INDEX `uk_project_brief_service`
        (`project_brief_id`, `service_type`) USING BTREE,

    CONSTRAINT `fk_project_brief_services_brief`
        FOREIGN KEY (`project_brief_id`)
        REFERENCES `project_briefs` (`id`)
        ON UPDATE RESTRICT
        ON DELETE CASCADE
)
COLLATE='utf8_unicode_ci'
ENGINE=InnoDB;


-- ============================================================
-- 03. MATERIAL PROCUREMENT CATEGORIES
-- Only applicable when MATERIAL_PROCUREMENT is selected.
-- ============================================================
CREATE TABLE IF NOT EXISTS `project_brief_procurement_categories` (
    `id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',
    `project_brief_id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',

    `category` ENUM(
        'CIVIL_BUILDING_MATERIAL',
        'METAL_WORK',
        'AC_PIPING_DRAINAGE',
        'ELECTRICAL',
        'PLUMBING',
        'NETWORKING',
        'TILES',
        'SANITARY',
        'CP_FITTINGS',
        'CHEMICALS_ADHESIVES',
        'STONE',
        'MARBLE',
        'GRANITE',
        'DOORS',
        'CHAUKHATS',
        'HARDWARE',
        'PLY_WOOD',
        'PAINTS_POLISHES',
        'FACADE_WORK',
        'FRP',
        'MICRO_CONCRETE',
        'OTHER'
    ) NOT NULL,

    `other_description` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`) USING BTREE,

    UNIQUE INDEX `uk_project_brief_procurement_category`
        (`project_brief_id`, `category`) USING BTREE,

    CONSTRAINT `fk_project_brief_procurement_categories_brief`
        FOREIGN KEY (`project_brief_id`)
        REFERENCES `project_briefs` (`id`)
        ON UPDATE RESTRICT
        ON DELETE CASCADE
)
COLLATE='utf8_unicode_ci'
ENGINE=InnoDB;


-- ============================================================
-- 04. SPACE REQUIREMENTS
--
-- Kept flexible because the source brief asks for space-by-space
-- requirements in the client's own words.
-- ============================================================
CREATE TABLE IF NOT EXISTS `project_brief_space_requirements` (
    `id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',
    `project_brief_id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',

    `sort_order` INT NOT NULL DEFAULT 0,
    `space_name` VARCHAR(255) NOT NULL COLLATE 'utf8_unicode_ci',
    `requirement_details` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `quantity` DECIMAL(10,2) NULL DEFAULT NULL,
    `notes` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`) USING BTREE,

    INDEX `idx_project_brief_spaces_brief`
        (`project_brief_id`) USING BTREE,

    INDEX `idx_project_brief_spaces_sort`
        (`project_brief_id`, `sort_order`) USING BTREE,

    CONSTRAINT `fk_project_brief_spaces_brief`
        FOREIGN KEY (`project_brief_id`)
        REFERENCES `project_briefs` (`id`)
        ON UPDATE RESTRICT
        ON DELETE CASCADE
)
COLLATE='utf8_unicode_ci'
ENGINE=InnoDB;


-- ============================================================
-- 05. DESIGN STYLE DIRECTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS `project_brief_style_directions` (
    `id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',
    `project_brief_id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',

    `style_direction` ENUM(
        'CONTEMPORARY',
        'MINIMAL',
        'CLASSIC_TRADITIONAL',
        'INDIAN_CONTEMPORARY',
        'INDUSTRIAL',
        'MID_CENTURY',
        'LUXE_OPULENT',
        'WARM_RUSTIC',
        'OTHER'
    ) NOT NULL,

    `other_description` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`) USING BTREE,

    UNIQUE INDEX `uk_project_brief_style_direction`
        (`project_brief_id`, `style_direction`) USING BTREE,

    CONSTRAINT `fk_project_brief_style_directions_brief`
        FOREIGN KEY (`project_brief_id`)
        REFERENCES `project_briefs` (`id`)
        ON UPDATE RESTRICT
        ON DELETE CASCADE
)
COLLATE='utf8_unicode_ci'
ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `project_brief_references` (
    `id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',
    `project_brief_id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',

    `title` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `reference_url` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `file_url` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `description` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `sort_order` INT NOT NULL DEFAULT 0,

    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`) USING BTREE,

    INDEX `idx_project_brief_references_brief`
        (`project_brief_id`) USING BTREE,

    CONSTRAINT `fk_project_brief_references_brief`
        FOREIGN KEY (`project_brief_id`)
        REFERENCES `project_briefs` (`id`)
        ON UPDATE RESTRICT
        ON DELETE CASCADE
)
COLLATE='utf8_unicode_ci'
ENGINE=InnoDB;


-- ============================================================
-- 07. PHASING
-- ============================================================
CREATE TABLE IF NOT EXISTS `project_brief_phases` (
    `id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',
    `project_brief_id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',

    `sort_order` INT NOT NULL DEFAULT 0,
    `phase_name` VARCHAR(255) NOT NULL COLLATE 'utf8_unicode_ci',
    `start_date` DATE NULL DEFAULT NULL,
    `end_date` DATE NULL DEFAULT NULL,
    `expected_time` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `notes` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`) USING BTREE,

    INDEX `idx_project_brief_phases_brief`
        (`project_brief_id`) USING BTREE,

    INDEX `idx_project_brief_phases_dates`
        (`start_date`, `end_date`) USING BTREE,

    CONSTRAINT `fk_project_brief_phases_brief`
        FOREIGN KEY (`project_brief_id`)
        REFERENCES `project_briefs` (`id`)
        ON UPDATE RESTRICT
        ON DELETE CASCADE
)
COLLATE='utf8_unicode_ci'
ENGINE=InnoDB;


-- ============================================================
-- 09. USERS & LIFESTYLE
--
-- These are occupants/users of the designed space.
-- They are NOT application users from the `users` table.
-- ============================================================
CREATE TABLE IF NOT EXISTS `project_brief_occupants` (
    `id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',
    `project_brief_id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',

    `sort_order` INT NOT NULL DEFAULT 0,
    `name` VARCHAR(255) NOT NULL COLLATE 'utf8_unicode_ci',
    `relationship` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `specific_needs_preferences` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`) USING BTREE,

    INDEX `idx_project_brief_occupants_brief`
        (`project_brief_id`) USING BTREE,

    CONSTRAINT `fk_project_brief_occupants_brief`
        FOREIGN KEY (`project_brief_id`)
        REFERENCES `project_briefs` (`id`)
        ON UPDATE RESTRICT
        ON DELETE CASCADE
)
COLLATE='utf8_unicode_ci'
ENGINE=InnoDB;


-- ============================================================
-- OPTIONAL ATTACHMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS `project_brief_attachments` (
    `id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',
    `project_brief_id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',

    `category` ENUM(
        'DRAWING',
        'DOCUMENT',
        'REFERENCE',
        'PHOTO',
        'OTHER'
    ) NOT NULL DEFAULT 'OTHER',

    `name` VARCHAR(255) NOT NULL COLLATE 'utf8_unicode_ci',
    `file_url` TEXT NOT NULL COLLATE 'utf8_unicode_ci',
    `mime_type` VARCHAR(150) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `uploaded_by` CHAR(36) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`) USING BTREE,

    INDEX `idx_project_brief_attachments_brief`
        (`project_brief_id`) USING BTREE,

    INDEX `idx_project_brief_attachments_uploaded_by`
        (`uploaded_by`) USING BTREE,

    CONSTRAINT `fk_project_brief_attachments_brief`
        FOREIGN KEY (`project_brief_id`)
        REFERENCES `project_briefs` (`id`)
        ON UPDATE RESTRICT
        ON DELETE CASCADE,

    CONSTRAINT `fk_project_brief_attachments_uploaded_by`
        FOREIGN KEY (`uploaded_by`)
        REFERENCES `users` (`id`)
        ON UPDATE RESTRICT
        ON DELETE SET NULL
)
COLLATE='utf8_unicode_ci'
ENGINE=InnoDB;



