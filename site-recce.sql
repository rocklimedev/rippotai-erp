-- ============================================================
-- SITE RECCE MODULE
-- ============================================================

-- ------------------------------------------------------------
-- 01. MASTER SITE RECCE
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `site_recces` (
    `id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',

    -- Project relationship
    `project_id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',

    -- Basic project/site details
    `project_name` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `client_name` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `site_address` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    -- Recce details
    `recce_date` DATE NOT NULL,
    `site_engineer_id` CHAR(36) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `accompanied_by` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    -- Property details
    `unit_floor_no` VARCHAR(100) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `carpet_area_sqft` DECIMAL(12,2) NULL DEFAULT NULL,
    `built_up_area_sqft` DECIMAL(12,2) NULL DEFAULT NULL,
    `number_of_rooms` INT NULL DEFAULT NULL,
    `number_of_floors` INT NULL DEFAULT NULL,

    -- Site type
    -- FLAT / FLOOR / KOTHI / RAW
    `site_type` ENUM(
        'FLAT',
        'FLOOR',
        'KOTHI',
        'RAW'
    ) NULL DEFAULT NULL,

    -- Access for material & labour
    `lift_available` BOOLEAN NULL DEFAULT NULL,
    `lift_size` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `staircase_width` VARCHAR(100) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `material_entry_point` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    -- Utilities available on site
    `water_connection` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `power_load_available` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `drainage_point_location` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    -- Society / RWA restrictions
    `society_rwa_restrictions` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `working_hours_allowed` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `material_movement_rule` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    -- Existing site condition
    `existing_condition` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    -- Audit
    `created_by` CHAR(36) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `updated_by` CHAR(36) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    `deleted_at` DATETIME NULL DEFAULT NULL,

    PRIMARY KEY (`id`),

    UNIQUE KEY `uk_site_recces_project_id` (`project_id`),

    KEY `idx_site_recces_project_id` (`project_id`),
    KEY `idx_site_recces_site_engineer_id` (`site_engineer_id`),
    KEY `idx_site_recces_recce_date` (`recce_date`),
    KEY `idx_site_recces_created_by` (`created_by`),
    KEY `idx_site_recces_updated_by` (`updated_by`),

    CONSTRAINT `fk_site_recces_project`
        FOREIGN KEY (`project_id`)
        REFERENCES `projects` (`id`)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT `fk_site_recces_site_engineer`
        FOREIGN KEY (`site_engineer_id`)
        REFERENCES `users` (`id`)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT `fk_site_recces_created_by`
        FOREIGN KEY (`created_by`)
        REFERENCES `users` (`id`)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT `fk_site_recces_updated_by`
        FOREIGN KEY (`updated_by`)
        REFERENCES `users` (`id`)
        ON UPDATE CASCADE
        ON DELETE SET NULL

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8
  COLLATE=utf8_unicode_ci;


-- ------------------------------------------------------------
-- 02. ROOM-WISE MEASUREMENTS
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `site_recce_rooms` (
    `id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',

    `site_recce_id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',

    -- Room information
    `room_name` VARCHAR(255) NOT NULL COLLATE 'utf8_unicode_ci',

    `room_type` ENUM(
        'LIVING_DINING',
        'MASTER_BEDROOM',
        'BEDROOM',
        'KITCHEN',
        'BATHROOM',
        'BALCONY',
        'OTHER'
    ) NOT NULL DEFAULT 'OTHER',

    `room_number` INT NULL DEFAULT NULL,

    -- Measurements
    `length` DECIMAL(10,2) NULL DEFAULT NULL,
    `width` DECIMAL(10,2) NULL DEFAULT NULL,
    `height` DECIMAL(10,2) NULL DEFAULT NULL,

    -- Units
    `measurement_unit` ENUM(
        'FT',
        'M',
        'IN',
        'CM'
    ) NOT NULL DEFAULT 'FT',

    -- Existing site condition
    `existing_flooring` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `existing_ceiling` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `notes` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `sort_order` INT NOT NULL DEFAULT 0,

    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),

    KEY `idx_site_recce_rooms_site_recce_id`
        (`site_recce_id`),

    KEY `idx_site_recce_rooms_room_type`
        (`room_type`),

    CONSTRAINT `fk_site_recce_rooms_site_recce`
        FOREIGN KEY (`site_recce_id`)
        REFERENCES `site_recces` (`id`)
        ON UPDATE CASCADE
        ON DELETE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8
  COLLATE=utf8_unicode_ci;


-- ------------------------------------------------------------
-- 03. ROOM LAYOUT & PHOTO REFERENCES
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `site_recce_photos` (
    `id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',

    `site_recce_id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',
    `room_id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',

    -- Shot information
    `shot_number` INT NOT NULL,

    -- Layout reference
    -- File/image showing room layout with:
    -- 1 standing position dot
    -- 1 camera direction arrow
    `layout_image_url` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    -- Actual site photograph
    `photo_url` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    -- Optional storage/file references
    `layout_file_name` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `photo_file_name` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    -- Camera / shot metadata
    `standing_position` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
    `camera_direction` VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    -- Additional notes
    `notes` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),

    UNIQUE KEY `uk_site_recce_room_shot`
        (`room_id`, `shot_number`),

    KEY `idx_site_recce_photos_site_recce_id`
        (`site_recce_id`),

    KEY `idx_site_recce_photos_room_id`
        (`room_id`),

    CONSTRAINT `fk_site_recce_photos_site_recce`
        FOREIGN KEY (`site_recce_id`)
        REFERENCES `site_recces` (`id`)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT `fk_site_recce_photos_room`
        FOREIGN KEY (`room_id`)
        REFERENCES `site_recce_rooms` (`id`)
        ON UPDATE CASCADE
        ON DELETE CASCADE

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8
  COLLATE=utf8_unicode_ci;