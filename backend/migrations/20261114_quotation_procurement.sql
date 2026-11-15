-- 20261114_quotation_procurement.sql
--
-- New procurement Quotation (Build › Procurement › Quotation):
--   Vendor Comparison Sheet → finalised vendor → Quotation → Raise PO / WO.
--
-- Creates fresh tables (the removed client `quotations` / `material_quotations`
-- tables are NOT reused):
--   procurement_quotations          one live quotation per project + vendor
--   procurement_quotation_items     its lines (item, description, unit, qty, rate, tax)
--   procurement_quotation_versions  frozen copy of every earlier version (refill rule)
-- and registers the permissions procurement-quotations:read|create|update|delete,
-- granted to every role that already holds the matching purchase-orders permission
-- (roles are matched through their existing grants, i.e. by role, not by id).
--
-- Idempotent (CREATE TABLE IF NOT EXISTS, INSERT IGNORE). No demo data.
-- Portable: MariaDB 10.11 / 11.x / 13 and MySQL 8. No foreign keys to existing
-- tables, so it also applies when their collation differs from this file's.
-- Must run after 20261110_remove_quotations_shortlists.sql (which deletes any
-- older procurement-quotations permission rows).

SET @OLD_SQL_NOTES = @@SQL_NOTES;
SET SQL_NOTES = 0;

CREATE TABLE IF NOT EXISTS `procurement_quotations` (
  `id` CHAR(36) NOT NULL,
  `quotation_number` VARCHAR(50) NOT NULL,
  `project_id` CHAR(36) NOT NULL,
  `vendor_id` CHAR(36) NOT NULL,
  `vendor_kind` ENUM('MATERIAL','LABOUR') NOT NULL DEFAULT 'MATERIAL',
  `comparison_id` CHAR(36) NULL,
  `status` ENUM('DRAFT','SUBMITTED','APPROVED','REJECTED','ORDERED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `version` INT NOT NULL DEFAULT 1,
  `quotation_date` DATE NOT NULL,
  `valid_until` DATE NULL,
  `vendor_name` VARCHAR(255) NULL,
  `vendor_type` VARCHAR(255) NULL,
  `vendor_phone` VARCHAR(50) NULL,
  `vendor_address` TEXT NULL,
  `project_name` VARCHAR(255) NULL,
  `project_address` TEXT NULL,
  `client_name` VARCHAR(255) NULL,
  `subtotal` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `tax_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `payment_terms` LONGTEXT NULL,
  `terms` TEXT NULL,
  `notes` TEXT NULL,
  `purchase_order_id` CHAR(36) NULL,
  `work_order_id` CHAR(36) NULL,
  `approved_by` CHAR(36) NULL,
  `approved_at` DATETIME NULL,
  `created_by` CHAR(36) NULL,
  `updated_by` CHAR(36) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_procurement_quotations_number` (`quotation_number`),
  KEY `idx_procurement_quotations_project_vendor` (`project_id`, `vendor_id`),
  KEY `idx_procurement_quotations_vendor` (`vendor_id`),
  KEY `idx_procurement_quotations_comparison` (`comparison_id`),
  KEY `idx_procurement_quotations_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `procurement_quotation_items` (
  `id` CHAR(36) NOT NULL,
  `quotation_id` CHAR(36) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `category_name` VARCHAR(255) NULL,
  `item_name` VARCHAR(500) NOT NULL,
  `description` TEXT NULL,
  `unit` VARCHAR(30) NULL,
  `quantity` DECIMAL(15,3) NOT NULL DEFAULT 0.000,
  `rate` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `tax_percent` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `tax_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `remarks` TEXT NULL,
  `source_item_id` VARCHAR(100) NULL,
  `material_id` CHAR(36) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_procurement_quotation_items_quotation` (`quotation_id`, `sort_order`),
  CONSTRAINT `fk_procurement_quotation_items_quotation`
    FOREIGN KEY (`quotation_id`) REFERENCES `procurement_quotations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `procurement_quotation_versions` (
  `id` CHAR(36) NOT NULL,
  `quotation_id` CHAR(36) NOT NULL,
  `version` INT NOT NULL,
  `snapshot` LONGTEXT NOT NULL,
  `created_by` CHAR(36) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_procurement_quotation_versions` (`quotation_id`, `version`),
  CONSTRAINT `fk_procurement_quotation_versions_quotation`
    FOREIGN KEY (`quotation_id`) REFERENCES `procurement_quotations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES
  (UUID(), 'procurement-quotations:read',   'procurement-quotations', 'read',   'View, print and export vendor quotations', NOW()),
  (UUID(), 'procurement-quotations:create', 'procurement-quotations', 'create', 'Create vendor quotations from a vendor comparison', NOW()),
  (UUID(), 'procurement-quotations:update', 'procurement-quotations', 'update', 'Edit vendor quotations (each save is a new version) and change their status', NOW()),
  (UUID(), 'procurement-quotations:delete', 'procurement-quotations', 'delete', 'Delete vendor quotations', NOW());

-- Same roles as purchase orders: a role gets quotation:<action> when it has
-- purchase-orders:<action>.
INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_at, granted_by)
SELECT rp.role_id, q.id, NOW(), NULL
  FROM role_permissions rp
  JOIN permissions po ON po.id = rp.permission_id AND po.resource = 'purchase-orders'
  JOIN permissions q ON q.resource = 'procurement-quotations' AND q.action = po.action;

-- Administrators always hold all four.
INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_at, granted_by)
SELECT r.id, q.id, NOW(), NULL
  FROM roles r
  JOIN permissions q ON q.resource = 'procurement-quotations'
 WHERE r.name IN ('ADMIN', 'SUPERADMIN', 'SUPER_ADMIN');

SET SQL_NOTES = @OLD_SQL_NOTES;
