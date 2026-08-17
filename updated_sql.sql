CREATE TABLE `payment_schedules` (
    `id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',

    `project_id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',

    `title` VARCHAR(255) NOT NULL DEFAULT 'Payment Schedule'
        COLLATE 'utf8_unicode_ci',

    `total_contract_value` DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    `gst_rate` DECIMAL(5,2) NULL DEFAULT NULL,
    `gst_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    `total_payable` DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    `status` ENUM(
        'DRAFT',
        'ACTIVE',
        'COMPLETED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'DRAFT',

    `accepted_by_client` BOOLEAN NOT NULL DEFAULT FALSE,
    `accepted_at` DATETIME NULL DEFAULT NULL,

    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    `deleted_at` DATETIME NULL DEFAULT NULL,

    PRIMARY KEY (`id`),

    KEY `idx_payment_schedules_project_id`
        (`project_id`),

    KEY `idx_payment_schedules_status`
        (`status`),

    CONSTRAINT `fk_payment_schedules_project`
        FOREIGN KEY (`project_id`)
        REFERENCES `projects` (`id`)
        ON DELETE RESTRICT
        ON UPDATE CASCADE

) ENGINE=InnoDB
DEFAULT CHARSET=utf8
COLLATE=utf8_unicode_ci;
CREATE TABLE `payment_schedule_milestones` (
    `id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',

    `payment_schedule_id` CHAR(36) NOT NULL COLLATE 'utf8_unicode_ci',

    `milestone_number` INT NOT NULL,
    `milestone_code` VARCHAR(20) NOT NULL COLLATE 'utf8_unicode_ci',

    `title` VARCHAR(255) NOT NULL COLLATE 'utf8_unicode_ci',

    `description` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `release_trigger` TEXT NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',

    `percentage` DECIMAL(5,2) NOT NULL DEFAULT 0.00,

    `amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    `status` ENUM(
        'PENDING',
        'DUE',
        'INVOICED',
        'PARTIALLY_PAID',
        'PAID',
        'OVERDUE',
        'WAIVED'
    ) NOT NULL DEFAULT 'PENDING',

    `due_date` DATE NULL DEFAULT NULL,
    `invoice_date` DATE NULL DEFAULT NULL,

    `paid_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    `paid_at` DATETIME NULL DEFAULT NULL,

    `sort_order` INT NOT NULL DEFAULT 0,

    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),

    UNIQUE KEY `uq_payment_schedule_milestone_code`
        (`payment_schedule_id`, `milestone_code`),

    KEY `idx_payment_schedule_milestones_schedule`
        (`payment_schedule_id`),

    KEY `idx_payment_schedule_milestones_status`
        (`status`),

    CONSTRAINT `fk_payment_schedule_milestones_schedule`
        FOREIGN KEY (`payment_schedule_id`)
        REFERENCES `payment_schedules` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE

) ENGINE=InnoDB
DEFAULT CHARSET=utf8
COLLATE=utf8_unicode_ci;