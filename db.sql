-- --------------------------------------------------------
-- Host:                         116.206.104.225
-- Server version:               5.7.23-23 - Percona Server (GPL), Release 23, Revision 500fcf5
-- Server OS:                    Linux
-- HeidiSQL Version:             12.11.0.7065
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for spsyn8lm_rippotai_erp
CREATE DATABASE IF NOT EXISTS `spsyn8lm_rippotai_erp` /*!40100 DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci */;
USE `spsyn8lm_rippotai_erp`;

-- Dumping structure for table spsyn8lm_rippotai_erp.activity_logs
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `user_email` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `user_role` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `action` enum('login','logout','quotation_created','quotation_updated','quotation_submitted','quotation_approved','quotation_returned','quotation_declined','quotation_deleted','project_created','project_updated','project_archived','vendor_created','vendor_updated','vendor_deleted','settings_updated','user_created','user_updated','user_deactivated') COLLATE utf8_unicode_ci NOT NULL,
  `entity_type` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `entity_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `entity_label` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `changes` json DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_activity_logs_user` (`user_id`),
  KEY `idx_activity_logs_created` (`created_at`),
  CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.auth_tokens
CREATE TABLE IF NOT EXISTS `auth_tokens` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `token_hash` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `type` enum('refresh','session') COLLATE utf8_unicode_ci NOT NULL DEFAULT 'refresh',
  `device_info` text COLLATE utf8_unicode_ci,
  `ip_address` varchar(45) COLLATE utf8_unicode_ci DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `revoked_at` timestamp NULL DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `token_hash` (`token_hash`) USING BTREE,
  KEY `idx_auth_tokens_token_hash` (`token_hash`) USING BTREE,
  KEY `idx_auth_tokens_user_id` (`user_id`) USING BTREE,
  CONSTRAINT `auth_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.boqs
CREATE TABLE IF NOT EXISTS `boqs` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `project_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `boq_number` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `source_template_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `status` enum('draft','pending_approval','approved','rejected','archived') COLLATE utf8_unicode_ci NOT NULL DEFAULT 'draft',
  `locked` tinyint(1) NOT NULL DEFAULT '0',
  `total_value` decimal(15,2) NOT NULL DEFAULT '0.00',
  `version` int(11) NOT NULL DEFAULT '1',
  `client_name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `location` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `prepared_by` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `date` date DEFAULT NULL,
  `terms_html` text COLLATE utf8_unicode_ci,
  `misc_pct` decimal(5,2) NOT NULL DEFAULT '10.00',
  `design_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `execution_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `supervisor_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `additional_total` decimal(15,2) NOT NULL DEFAULT '0.00',
  `approved_at` datetime DEFAULT NULL,
  `approved_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `updated_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_boq_number` (`boq_number`),
  KEY `fk_boq_template` (`source_template_id`),
  CONSTRAINT `fk_boq_template` FOREIGN KEY (`source_template_id`) REFERENCES `boq_templates` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.boq_activities
CREATE TABLE IF NOT EXISTS `boq_activities` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `boq_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `user_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `action` enum('created','updated','item_added','item_updated','item_deleted','item_moved','category_added','category_deleted','rate_changed','submitted','approved','rejected','archived','deleted') COLLATE utf8_unicode_ci NOT NULL,
  `target` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `details` text COLLATE utf8_unicode_ci,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_activity_boq` (`boq_id`),
  CONSTRAINT `fk_activity_boq` FOREIGN KEY (`boq_id`) REFERENCES `boqs` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.boq_categories
CREATE TABLE IF NOT EXISTS `boq_categories` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `boq_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_boq_category_boq` (`boq_id`),
  CONSTRAINT `fk_boq_category_boq` FOREIGN KEY (`boq_id`) REFERENCES `boqs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.boq_items
CREATE TABLE IF NOT EXISTS `boq_items` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `boq_category_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `library_item_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `unit_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `unit` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,
  `quantity` decimal(15,2) NOT NULL DEFAULT '0.00',
  `rate` decimal(15,2) NOT NULL DEFAULT '0.00',
  `amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `calc_type` enum('M','L') COLLATE utf8_unicode_ci NOT NULL DEFAULT 'M',
  `location` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `detail` json DEFAULT NULL,
  `notes` text COLLATE utf8_unicode_ci,
  `hidden` tinyint(1) NOT NULL DEFAULT '0',
  `sort_order` int(11) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_boq_item_category` (`boq_category_id`),
  KEY `fk_boq_item_library` (`library_item_id`),
  CONSTRAINT `fk_boq_item_category` FOREIGN KEY (`boq_category_id`) REFERENCES `boq_categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_boq_item_library` FOREIGN KEY (`library_item_id`) REFERENCES `library_items` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.boq_templates
CREATE TABLE IF NOT EXISTS `boq_templates` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `template_tier` enum('essential','premium','luxury') COLLATE utf8_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8_unicode_ci,
  `created_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `updated_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.boq_template_categories
CREATE TABLE IF NOT EXISTS `boq_template_categories` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `template_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_template_category_template` (`template_id`),
  CONSTRAINT `fk_template_category_template` FOREIGN KEY (`template_id`) REFERENCES `boq_templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.boq_template_items
CREATE TABLE IF NOT EXISTS `boq_template_items` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `boq_category_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `library_item_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `unit_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `unit` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,
  `quantity` decimal(15,2) NOT NULL DEFAULT '0.00',
  `rate` decimal(15,2) NOT NULL DEFAULT '0.00',
  `notes` text COLLATE utf8_unicode_ci,
  `sort_order` int(11) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_template_item_library` (`library_item_id`),
  KEY `fk_boq_item_category` (`boq_category_id`),
  CONSTRAINT `fk_template_item_library` FOREIGN KEY (`library_item_id`) REFERENCES `library_items` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.calendar_events
CREATE TABLE IF NOT EXISTS `calendar_events` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `type` enum('task','client_meeting','internal_meeting','vendor_call','presentation','note','timeline','milestone_due','quotation_deadline','site_visit','handover','personal') COLLATE utf8_unicode_ci NOT NULL DEFAULT 'internal_meeting',
  `starts_at` datetime NOT NULL,
  `ends_at` datetime DEFAULT NULL,
  `all_day` tinyint(1) NOT NULL DEFAULT '0',
  `project_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `location` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8_unicode_ci,
  `attendees` json NOT NULL,
  `created_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_calendar_events_type` (`type`),
  KEY `idx_calendar_events_starts_at` (`starts_at`),
  KEY `idx_calendar_events_project_id` (`project_id`),
  CONSTRAINT `fk_calendar_events_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.clients
CREATE TABLE IF NOT EXISTS `clients` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `contact_person` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_clients_slug` (`slug`),
  KEY `idx_clients_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.documents
CREATE TABLE IF NOT EXISTS `documents` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `project_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `category` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `filename` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `storage_filename` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `url` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `mime` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `size` bigint(20) DEFAULT NULL,
  `version` varchar(50) COLLATE utf8_unicode_ci DEFAULT 'V1',
  `status` varchar(50) COLLATE utf8_unicode_ci DEFAULT 'draft',
  `visibility` varchar(50) COLLATE utf8_unicode_ci DEFAULT 'internal',
  `remarks` text COLLATE utf8_unicode_ci,
  `is_locked` tinyint(1) DEFAULT '0',
  `locked_by` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `locked_at` datetime DEFAULT NULL,
  `uploaded_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `uploaded_by_name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `document_date` date DEFAULT NULL,
  `doc_type` varchar(50) COLLATE utf8_unicode_ci DEFAULT 'upload',
  `doc_no` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `sections` json DEFAULT NULL,
  `source_app` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_documents_project` (`project_id`),
  CONSTRAINT `fk_documents_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.document_attachments
CREATE TABLE IF NOT EXISTS `document_attachments` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `document_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `filename` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `storage_filename` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `url` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `mime` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `size` bigint(20) DEFAULT NULL,
  `remark` text COLLATE utf8_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_document_attachments_document` (`document_id`),
  CONSTRAINT `fk_document_attachments_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.drawings
CREATE TABLE IF NOT EXISTS `drawings` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `project_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `drawing_number` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `discipline` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `revision` varchar(255) COLLATE utf8_unicode_ci DEFAULT 'R1',
  `issue_date` date DEFAULT NULL,
  `issue_purpose` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `status` varchar(50) COLLATE utf8_unicode_ci DEFAULT 'Draft',
  `remarks` text COLLATE utf8_unicode_ci,
  `filename` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `storage_filename` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `url` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `mime` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `size` bigint(20) DEFAULT NULL,
  `uploaded_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_drawings_project` (`project_id`),
  CONSTRAINT `fk_drawings_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.library_categories
CREATE TABLE IF NOT EXISTS `library_categories` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.library_items
CREATE TABLE IF NOT EXISTS `library_items` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `category_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `category_name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `unit_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `unit` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,
  `default_rate` decimal(15,2) NOT NULL DEFAULT '0.00',
  `notes` text COLLATE utf8_unicode_ci,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_library_item_category` (`category_id`),
  CONSTRAINT `fk_library_item_category` FOREIGN KEY (`category_id`) REFERENCES `library_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.notifications
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `type` enum('quotation_submitted','quotation_approved','quotation_returned','quotation_declined') COLLATE utf8_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `message` text COLLATE utf8_unicode_ci NOT NULL,
  `entity_type` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `entity_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user` (`user_id`,`is_read`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.permissions
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `resource` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `action` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `description` text COLLATE utf8_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `uk_permissions_resource_action` (`resource`,`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.projects
CREATE TABLE IF NOT EXISTS `projects` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `client_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `project_type_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `site_location` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `description` text COLLATE utf8_unicode_ci,
  `priority` enum('LOW','MEDIUM','HIGH','CRITICAL') COLLATE utf8_unicode_ci NOT NULL DEFAULT 'MEDIUM',
  `status` enum('active','completed','on_hold','inactive') COLLATE utf8_unicode_ci NOT NULL DEFAULT 'active',
  `expected_completion_date` date DEFAULT NULL,
  `quotation_count` int(11) NOT NULL DEFAULT '0',
  `approved_value` decimal(15,2) NOT NULL DEFAULT '0.00',
  `created_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `updated_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `archived_at` timestamp NULL DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `archived_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  KEY `archived_by` (`archived_by`),
  KEY `idx_projects_status` (`status`),
  KEY `idx_projects_archived` (`archived_at`),
  KEY `idx_projects_deleted_at` (`deleted_at`),
  KEY `idx_projects_client` (`client_id`),
  KEY `idx_projects_project_type` (`project_type_id`),
  KEY `idx_projects_priority` (`priority`),
  CONSTRAINT `fk_projects_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_projects_project_type` FOREIGN KEY (`project_type_id`) REFERENCES `project_types` (`id`) ON DELETE SET NULL,
  CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `projects_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `projects_ibfk_3` FOREIGN KEY (`archived_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.project_types
CREATE TABLE IF NOT EXISTS `project_types` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `description` text COLLATE utf8_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project_types_slug` (`slug`),
  KEY `idx_project_types_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.quotations
CREATE TABLE IF NOT EXISTS `quotations` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `quotation_number` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `current_version` int(11) NOT NULL DEFAULT '1',
  `quotation_date` date NOT NULL,
  `status` enum('draft','submitted','approved','returned_for_editing','declined','cancelled') COLLATE utf8_unicode_ci NOT NULL DEFAULT 'draft',
  `project_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `vendor_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `project_snapshot` json NOT NULL,
  `vendor_snapshot` json NOT NULL,
  `subtotal` decimal(15,2) NOT NULL DEFAULT '0.00',
  `additional_charges` decimal(15,2) NOT NULL DEFAULT '0.00',
  `global_discount_type` enum('fixed','percentage') COLLATE utf8_unicode_ci NOT NULL DEFAULT 'fixed',
  `global_discount_value` decimal(15,2) NOT NULL DEFAULT '0.00',
  `discount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `tax_percent` decimal(5,2) NOT NULL DEFAULT '0.00',
  `tax_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `terms_conditions` text COLLATE utf8_unicode_ci,
  `submitted_at` timestamp NULL DEFAULT NULL,
  `submitted_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `reviewed_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `review_remarks` text COLLATE utf8_unicode_ci,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `updated_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `quotation_number` (`quotation_number`),
  KEY `submitted_by` (`submitted_by`),
  KEY `reviewed_by` (`reviewed_by`),
  KEY `deleted_by` (`deleted_by`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  KEY `idx_quotations_project` (`project_id`),
  KEY `idx_quotations_vendor` (`vendor_id`),
  KEY `idx_quotations_status` (`status`),
  KEY `idx_quotations_date` (`quotation_date`),
  CONSTRAINT `quotations_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  CONSTRAINT `quotations_ibfk_2` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`),
  CONSTRAINT `quotations_ibfk_3` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `quotations_ibfk_4` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `quotations_ibfk_5` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `quotations_ibfk_6` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `quotations_ibfk_7` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.quotation_items
CREATE TABLE IF NOT EXISTS `quotation_items` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `quotation_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `sno` smallint(6) NOT NULL,
  `particular` text COLLATE utf8_unicode_ci NOT NULL,
  `unit_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `rate` decimal(12,2) NOT NULL DEFAULT '0.00',
  `quantity` decimal(10,3) NOT NULL DEFAULT '0.000',
  `amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `remarks` text COLLATE utf8_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_quotation_sno` (`quotation_id`,`sno`),
  KEY `idx_quotation_items_qid` (`quotation_id`),
  KEY `idx_quotation_items_unit_id` (`unit_id`),
  CONSTRAINT `fk_quotation_items_unit` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotation_items_ibfk_1` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.quotation_versions
CREATE TABLE IF NOT EXISTS `quotation_versions` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `quotation_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `version` int(11) NOT NULL,
  `snapshot` json NOT NULL,
  `remarks` text COLLATE utf8_unicode_ci,
  `created_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_quotation_version` (`quotation_id`,`version`),
  KEY `fk_qv_created_by` (`created_by`),
  KEY `idx_qv_quotation` (`quotation_id`),
  KEY `idx_qv_created_at` (`created_at`),
  CONSTRAINT `fk_qv_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_qv_quotation` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.roles
CREATE TABLE IF NOT EXISTS `roles` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `name` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `description` text COLLATE utf8_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.role_permissions
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `role_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `permission_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `granted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `granted_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  KEY `granted_by` (`granted_by`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_ibfk_3` FOREIGN KEY (`granted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.settings
CREATE TABLE IF NOT EXISTS `settings` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `key` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `value` json NOT NULL,
  `updated_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `settings_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.site_image_attachment
CREATE TABLE IF NOT EXISTS `site_image_attachment` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `site_layout_attachment_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `document_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `caption` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `sort_order` int(11) DEFAULT '0',
  `created_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_image_layout` (`site_layout_attachment_id`),
  KEY `idx_image_document` (`document_id`),
  CONSTRAINT `fk_image_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_image_layout` FOREIGN KEY (`site_layout_attachment_id`) REFERENCES `site_layout_attachment` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.site_layout_attachment
CREATE TABLE IF NOT EXISTS `site_layout_attachment` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `site_recce_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `floor_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `document_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `remark` text COLLATE utf8_unicode_ci,
  `sort_order` int(11) DEFAULT '0',
  `created_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_layout_recce` (`site_recce_id`),
  KEY `idx_layout_floor` (`floor_id`),
  KEY `idx_layout_document` (`document_id`),
  CONSTRAINT `fk_layout_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_layout_floor` FOREIGN KEY (`floor_id`) REFERENCES `site_recce_floor` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_layout_recce` FOREIGN KEY (`site_recce_id`) REFERENCES `site_recce` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.site_recce
CREATE TABLE IF NOT EXISTS `site_recce` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `project_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `document_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `supervisor_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `recce_date` date DEFAULT NULL,
  `time_of_visit` time DEFAULT NULL,
  `status` enum('draft','scheduled','in_progress','completed','approved','cancelled') COLLATE utf8_unicode_ci DEFAULT 'draft',
  `remarks` text COLLATE utf8_unicode_ci,
  `site_accessibility` enum('Easy','Moderate','Difficult') COLLATE utf8_unicode_ci DEFAULT NULL,
  `road_width_near_site` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `vehicle_entry_available` enum('Yes','No') COLLATE utf8_unicode_ci DEFAULT NULL,
  `loading_unloading_space` enum('Yes','No','Limited') COLLATE utf8_unicode_ci DEFAULT NULL,
  `lift_available` enum('Yes','No') COLLATE utf8_unicode_ci DEFAULT NULL,
  `service_lift_available` enum('Yes','No') COLLATE utf8_unicode_ci DEFAULT NULL,
  `staircase_width` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `floor_level` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `parking_availability` enum('Yes','No','Limited') COLLATE utf8_unicode_ci DEFAULT NULL,
  `access_restrictions` text COLLATE utf8_unicode_ci,
  `current_site_status` enum('Empty Site','Under Construction','Renovation Site','Occupied Site','Partially Occupied','Demolition Required') COLLATE utf8_unicode_ci DEFAULT NULL,
  `existing_flooring_condition` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `existing_wall_condition` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `existing_ceiling_condition` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `existing_doors_windows_condition` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `leakage_dampness_observed` text COLLATE utf8_unicode_ci,
  `cracks_observed` text COLLATE utf8_unicode_ci,
  `existing_points_available` enum('Yes','No') COLLATE utf8_unicode_ci DEFAULT NULL,
  `main_db_location` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `meter_location` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `power_supply_status` enum('Available','Not Available','Temporary Connection Required') COLLATE utf8_unicode_ci DEFAULT NULL,
  `water_supply_available` enum('Yes','No') COLLATE utf8_unicode_ci DEFAULT NULL,
  `drainage_line_available` enum('Yes','No') COLLATE utf8_unicode_ci DEFAULT NULL,
  `existing_plumbing_condition` enum('Good','Average','Poor','Needs Replacement') COLLATE utf8_unicode_ci DEFAULT NULL,
  `kitchen_plumbing_checked` enum('Yes','No','Not Applicable') COLLATE utf8_unicode_ci DEFAULT NULL,
  `bathroom_plumbing_checked` enum('Yes','No','Not Applicable') COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `updated_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_site_recce_project` (`project_id`),
  KEY `idx_site_recce_document` (`document_id`),
  KEY `idx_site_recce_supervisor` (`supervisor_id`),
  KEY `idx_site_recce_created_by` (`created_by`),
  KEY `idx_site_recce_status` (`status`),
  KEY `idx_site_recce_date` (`recce_date`),
  KEY `fk_site_recce_updated_by` (`updated_by`),
  CONSTRAINT `fk_site_recce_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_site_recce_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_site_recce_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_site_recce_supervisor` FOREIGN KEY (`supervisor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_site_recce_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.site_recce_document
CREATE TABLE IF NOT EXISTS `site_recce_document` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `site_recce_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `document_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `remark` text COLLATE utf8_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_recce_document` (`site_recce_id`,`document_id`),
  KEY `idx_recce_doc_recce` (`site_recce_id`),
  KEY `idx_recce_doc_document` (`document_id`),
  CONSTRAINT `fk_recce_doc_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_recce_doc_recce` FOREIGN KEY (`site_recce_id`) REFERENCES `site_recce` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.site_recce_floor
CREATE TABLE IF NOT EXISTS `site_recce_floor` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `site_recce_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `floor_name` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `floor_order` int(11) DEFAULT '0',
  `approx_area_sqft` decimal(12,2) DEFAULT NULL,
  `remarks` text COLLATE utf8_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_floor_recce` (`site_recce_id`),
  CONSTRAINT `fk_floor_recce` FOREIGN KEY (`site_recce_id`) REFERENCES `site_recce` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.site_recce_room
CREATE TABLE IF NOT EXISTS `site_recce_room` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `floor_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `room_name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `room_type` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `ceiling_height` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `beam_column_details` text COLLATE utf8_unicode_ci,
  `length` decimal(10,2) DEFAULT NULL,
  `width` decimal(10,2) DEFAULT NULL,
  `height` decimal(10,2) DEFAULT NULL,
  `unit` varchar(20) COLLATE utf8_unicode_ci DEFAULT 'ft',
  `remarks` text COLLATE utf8_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_room_floor` (`floor_id`),
  CONSTRAINT `fk_room_floor` FOREIGN KEY (`floor_id`) REFERENCES `site_recce_floor` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.tasks
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `project_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `priority` enum('low','medium','high','critical') COLLATE utf8_unicode_ci NOT NULL DEFAULT 'medium',
  `status` enum('todo','completed') COLLATE utf8_unicode_ci NOT NULL DEFAULT 'todo',
  `due_date` datetime DEFAULT NULL,
  `due_bucket` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `order_index` int(11) NOT NULL DEFAULT '0',
  `workload_estimate_hours` int(11) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tasks_project_id` (`project_id`),
  KEY `idx_tasks_created_by` (`created_by`),
  CONSTRAINT `fk_tasks_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_tasks_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.units
CREATE TABLE IF NOT EXISTS `units` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `name` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `code` varchar(20) COLLATE utf8_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_units_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `role_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `last_login_at` timestamp NULL DEFAULT NULL,
  `created_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `created_by` (`created_by`),
  KEY `idx_users_email` (`email`),
  KEY `idx_users_role` (`role_id`),
  KEY `idx_users_is_active` (`is_active`),
  CONSTRAINT `users_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.user_signatures
CREATE TABLE IF NOT EXISTS `user_signatures` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `signature_url` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL,
  `signature_file_name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `signature_file_type` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `signature_file_size` bigint(20) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_user_signature` (`user_id`),
  KEY `idx_signature_user` (`user_id`),
  KEY `idx_signature_created_by` (`created_by`),
  CONSTRAINT `fk_signature_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_signature_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.vendors
CREATE TABLE IF NOT EXISTS `vendors` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `company_name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `position` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `designation` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `vendor_category_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `business_type_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `contact_number` varchar(20) COLLATE utf8_unicode_ci NOT NULL,
  `alternate_contact` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8_unicode_ci,
  `state` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `country` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8_unicode_ci,
  `status` enum('active','inactive','blacklisted','blocked') COLLATE utf8_unicode_ci NOT NULL DEFAULT 'active',
  `created_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `updated_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  KEY `idx_vendors_status` (`status`),
  KEY `idx_vendors_contact` (`contact_number`),
  KEY `idx_vendor_category_id` (`vendor_category_id`),
  KEY `idx_business_type_id` (`business_type_id`),
  CONSTRAINT `fk_vendor_business_type` FOREIGN KEY (`business_type_id`) REFERENCES `vendor_business_types` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_vendor_category` FOREIGN KEY (`vendor_category_id`) REFERENCES `vendor_categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `vendors_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `vendors_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.vendor_business_types
CREATE TABLE IF NOT EXISTS `vendor_business_types` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `category_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8_unicode_ci NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_category_business` (`category_id`,`name`),
  CONSTRAINT `fk_vendor_business_category` FOREIGN KEY (`category_id`) REFERENCES `vendor_categories` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.vendor_categories
CREATE TABLE IF NOT EXISTS `vendor_categories` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.verification_tokens
CREATE TABLE IF NOT EXISTS `verification_tokens` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `type` enum('email_verification','password_reset') COLLATE utf8_unicode_ci NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `verification_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
