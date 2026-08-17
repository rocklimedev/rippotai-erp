-- --------------------------------------------------------
-- Host:                         119.18.54.11
-- Server version:               5.7.23-23 - Percona Server (GPL), Release 23, Revision 500fcf5
-- Server OS:                    Linux
-- HeidiSQL Version:             12.17.0.7270
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Dumping structure for table spsyn8lm_rippotai_erp.activity_logs
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `user_email` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `user_role` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `action` enum('login','logout','login_failed','password_changed','password_reset_requested','password_reset_completed','token_refreshed','user_created','user_updated','user_profile_updated','user_avatar_updated','user_deactivated','user_reactivated','user_deleted','user_role_changed','user_permission_updated','project_created','project_updated','project_archived','project_restored','project_deleted','project_member_added','project_member_removed','project_status_changed','client_created','client_updated','client_deleted','client_restored','brief_created','brief_updated','brief_deleted','calendar_event_created','calendar_event_updated','calendar_event_deleted','task_created','task_updated','task_status_changed','task_completed','task_deleted','lead_created','lead_updated','lead_stage_changed','lead_note_added','lead_proposal_sent','lead_deleted','quotation_created','quotation_updated','quotation_submitted','quotation_approved','quotation_returned','quotation_declined','quotation_cancelled','quotation_deleted','quotation_revision_created','quotation_sent_to_client','quotation_restored','vendor_created','vendor_updated','vendor_deleted','vendor_approved','vendor_rejected','vendor_status_changed','drawing_uploaded','drawing_superseded','site_recce_created','site_recce_updated','site_recce_status_changed','site_recce_deleted','settings_updated','system_config_changed','billing_settings_updated','file_uploaded','file_deleted','file_downloaded','document_generated','invoice_created','invoice_updated','invoice_paid','payment_received','data_exported','data_imported','permission_denied','unauthorized_access_attempt') COLLATE utf8_unicode_ci NOT NULL,
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

-- Dumping structure for table spsyn8lm_rippotai_erp.apps
CREATE TABLE IF NOT EXISTS `apps` (
  `code` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`code`) USING BTREE
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

-- Dumping structure for table spsyn8lm_rippotai_erp.boq_miscellaneous
CREATE TABLE IF NOT EXISTS `boq_miscellaneous` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `boq_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `value` decimal(15,2) NOT NULL DEFAULT '0.00',
  `notes` text COLLATE utf8_unicode_ci,
  `sort_order` int(11) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_boq_miscellaneous_boq_id` (`boq_id`),
  CONSTRAINT `fk_boq_miscellaneous_boq` FOREIGN KEY (`boq_id`) REFERENCES `boqs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
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

-- Dumping structure for table spsyn8lm_rippotai_erp.boq_versions
CREATE TABLE IF NOT EXISTS `boq_versions` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `boq_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `version` int(11) NOT NULL,
  `version_name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_boq_versions_boq` (`boq_id`),
  CONSTRAINT `fk_boq_versions_boq` FOREIGN KEY (`boq_id`) REFERENCES `boqs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.boqs
CREATE TABLE IF NOT EXISTS `boqs` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `project_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `boq_number` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `source_template_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `boq_version_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `status` enum('draft','pending_approval','approved','rejected','archived') COLLATE utf8_unicode_ci NOT NULL DEFAULT 'draft',
  `locked` tinyint(1) NOT NULL DEFAULT '0',
  `total_value` decimal(15,2) NOT NULL DEFAULT '0.00',
  `version` int(11) NOT NULL DEFAULT '1',
  `client_name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `location` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `prepared_by` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `date` date DEFAULT NULL,
  `terms_html` text COLLATE utf8_unicode_ci,
  `terms_template_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `terms_template_version` int(11) DEFAULT NULL,
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
  KEY `fk_boqs_version` (`boq_version_id`),
  CONSTRAINT `fk_boq_template` FOREIGN KEY (`source_template_id`) REFERENCES `boq_templates` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_boqs_version` FOREIGN KEY (`boq_version_id`) REFERENCES `boq_versions` (`id`) ON DELETE SET NULL
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

-- Dumping structure for table spsyn8lm_rippotai_erp.lead_activity
CREATE TABLE IF NOT EXISTS `lead_activity` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lead_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_lead_activity_lead` (`lead_id`),
  CONSTRAINT `fk_lead_activity_lead` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.lead_notes
CREATE TABLE IF NOT EXISTS `lead_notes` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lead_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `author` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_lead_notes_lead` (`lead_id`),
  CONSTRAINT `fk_lead_notes_lead` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.leads
CREATE TABLE IF NOT EXISTS `leads` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `whatsapp` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` enum('Residential','Commercial','Institutional') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Residential',
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `size` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `budget` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `timeline` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `source` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stage` enum('capture','qual','disc','prop','nego','contract','handoff','nurture','lost') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'capture',
  `days` int(11) NOT NULL DEFAULT '0',
  `stage_entered_at` datetime DEFAULT NULL,
  `tag` enum('Hot','Warm','Cold') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` enum('Green','Red','Yellow','Blue') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stuck_mode` enum('auto','always','never') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'auto',
  `follow_up` date DEFAULT NULL,
  `proposal_amount` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `proposal_timeline` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `proposal_remarks` text COLLATE utf8mb4_unicode_ci,
  `doc_brief` smallint(6) NOT NULL DEFAULT '0',
  `doc_proposal` smallint(6) NOT NULL DEFAULT '0',
  `doc_contract` smallint(6) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_leads_phone` (`phone`),
  KEY `idx_leads_stage` (`stage`),
  KEY `idx_leads_owner` (`owner`),
  KEY `idx_leads_followup` (`follow_up`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- Dumping structure for table spsyn8lm_rippotai_erp.milestones
CREATE TABLE IF NOT EXISTS `milestones` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `project_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `description` text COLLATE utf8_unicode_ci,
  `due_date` date NOT NULL,
  `planned_start` date DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `status` enum('PENDING','IN_PROGRESS','COMPLETED','CANCELLED') COLLATE utf8_unicode_ci NOT NULL DEFAULT 'PENDING',
  `order` int(11) NOT NULL DEFAULT '0',
  `weight` decimal(5,2) DEFAULT NULL,
  `assignee_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `updated_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_milestones_project` (`project_id`) USING BTREE,
  KEY `idx_milestones_status` (`status`) USING BTREE,
  KEY `idx_milestones_due_date` (`due_date`) USING BTREE,
  KEY `idx_milestones_order` (`project_id`,`order`) USING BTREE,
  KEY `idx_milestones_assignee` (`assignee_id`) USING BTREE,
  KEY `idx_milestones_deleted_at` (`deleted_at`) USING BTREE,
  KEY `fk_milestones_created_by` (`created_by`),
  KEY `fk_milestones_updated_by` (`updated_by`),
  CONSTRAINT `fk_milestones_assignee` FOREIGN KEY (`assignee_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_milestones_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_milestones_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_milestones_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.notifications
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `type` enum('project_created','project_updated','project_archived','project_restored','project_deleted','brief_created','brief_updated','brief_deleted','calendar_event_created','calendar_event_updated','calendar_event_deleted','client_created','client_updated','client_deleted','client_restored','drawing_uploaded','drawing_superseded','lead_created','lead_updated','lead_stage_changed','lead_note_added','lead_proposal_sent','lead_deleted','quotation_created','quotation_updated','quotation_submitted','quotation_approved','quotation_returned_for_editing','quotation_declined','quotation_cancelled','quotation_deleted','quotation_restored','vendor_created','vendor_updated','vendor_status_changed','vendor_deleted','user_created','user_updated','user_profile_updated','user_avatar_updated','user_deactivated','user_deleted','task_created','task_updated','task_status_changed','task_completed','task_deleted','site_recce_created','site_recce_updated','site_recce_status_changed','site_recce_deleted','purchase_order_created','purchase_order_updated','purchase_order_approved','purchase_order_rejected','purchase_order_cancelled','system','reminder','announcement') COLLATE utf8_unicode_ci NOT NULL,
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

-- Dumping structure for table spsyn8lm_rippotai_erp.password_reset_tokens
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `token_hash` varchar(64) COLLATE utf8_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_password_reset_tokens_token_hash` (`token_hash`),
  KEY `idx_password_reset_tokens_user_id` (`user_id`),
  KEY `idx_password_reset_tokens_expires_at` (`expires_at`),
  CONSTRAINT `fk_password_reset_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.payment_schedule_milestones
CREATE TABLE IF NOT EXISTS `payment_schedule_milestones` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `payment_schedule_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `milestone_number` int(11) NOT NULL,
  `milestone_code` varchar(20) COLLATE utf8_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `description` text COLLATE utf8_unicode_ci,
  `release_trigger` text COLLATE utf8_unicode_ci,
  `percentage` decimal(5,2) NOT NULL DEFAULT '0.00',
  `amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `status` enum('PENDING','DUE','INVOICED','PARTIALLY_PAID','PAID','OVERDUE','WAIVED') COLLATE utf8_unicode_ci NOT NULL DEFAULT 'PENDING',
  `due_date` date DEFAULT NULL,
  `invoice_date` date DEFAULT NULL,
  `paid_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `paid_at` datetime DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_payment_schedule_milestones_schedule_id` (`payment_schedule_id`),
  KEY `idx_payment_schedule_milestones_status` (`status`),
  KEY `idx_payment_schedule_milestones_due_date` (`due_date`),
  CONSTRAINT `fk_payment_schedule_milestones_schedule` FOREIGN KEY (`payment_schedule_id`) REFERENCES `payment_schedules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.payment_schedules
CREATE TABLE IF NOT EXISTS `payment_schedules` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `project_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'Payment Schedule',
  `terms_template_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `terms_version` int(11) DEFAULT NULL,
  `total_contract_value` decimal(15,2) NOT NULL DEFAULT '0.00',
  `gst_rate` decimal(5,2) DEFAULT NULL,
  `gst_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total_payable` decimal(15,2) NOT NULL DEFAULT '0.00',
  `status` enum('DRAFT','ACTIVE','COMPLETED','CANCELLED') COLLATE utf8_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `accepted_by_client` tinyint(1) NOT NULL DEFAULT '0',
  `accepted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_payment_schedules_project_id` (`project_id`),
  KEY `idx_payment_schedules_status` (`status`),
  KEY `idx_payment_schedules_deleted_at` (`deleted_at`),
  KEY `idx_payment_schedules_terms_template_id` (`terms_template_id`) USING BTREE,
  CONSTRAINT `fk_payment_schedules_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_payment_schedules_terms_template` FOREIGN KEY (`terms_template_id`) REFERENCES `terms_templates` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
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

-- Dumping structure for table spsyn8lm_rippotai_erp.plan_of_action_phases
CREATE TABLE IF NOT EXISTS `plan_of_action_phases` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `plan_of_action_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `project_phase_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `duration_min_days` int(11) DEFAULT NULL,
  `duration_max_days` int(11) DEFAULT NULL,
  `parallel_work_note` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `inclusion_note` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `gantt_start_offset_days` int(11) NOT NULL DEFAULT '0',
  `gantt_duration_days` int(11) NOT NULL DEFAULT '0',
  `sort_order` int(11) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uq_plan_of_action_phase` (`plan_of_action_id`,`project_phase_id`) USING BTREE,
  KEY `idx_plan_of_action_phases_plan` (`plan_of_action_id`) USING BTREE,
  KEY `idx_plan_of_action_phases_phase` (`project_phase_id`) USING BTREE,
  KEY `idx_plan_of_action_phases_sort` (`plan_of_action_id`,`sort_order`) USING BTREE,
  KEY `idx_plan_of_action_phases_deleted_at` (`deleted_at`) USING BTREE,
  CONSTRAINT `fk_plan_of_action_phases_phase` FOREIGN KEY (`project_phase_id`) REFERENCES `project_phases` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_plan_of_action_phases_plan` FOREIGN KEY (`plan_of_action_id`) REFERENCES `plan_of_actions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.plan_of_actions
CREATE TABLE IF NOT EXISTS `plan_of_actions` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `project_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'Plan of Action',
  `execution_description` text COLLATE utf8_unicode_ci,
  `total_phases` int(11) NOT NULL DEFAULT '0',
  `total_duration_min_days` int(11) DEFAULT NULL,
  `total_duration_max_days` int(11) DEFAULT NULL,
  `total_duration_label` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `terms_template_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `terms_template_version_id` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `terms_content_snapshot` text COLLATE utf8_unicode_ci,
  `status` enum('draft','published','archived') COLLATE utf8_unicode_ci NOT NULL DEFAULT 'draft',
  `published_at` datetime DEFAULT NULL,
  `version` int(11) NOT NULL DEFAULT '1',
  `created_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `updated_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_plan_of_actions_project_id` (`project_id`) USING BTREE,
  KEY `idx_plan_of_actions_status` (`status`) USING BTREE,
  KEY `idx_plan_of_actions_terms_template_id` (`terms_template_id`) USING BTREE,
  KEY `idx_plan_of_actions_terms_template_version_id` (`terms_template_version_id`) USING BTREE,
  KEY `idx_plan_of_actions_created_by` (`created_by`) USING BTREE,
  KEY `idx_plan_of_actions_updated_by` (`updated_by`) USING BTREE,
  KEY `idx_plan_of_actions_deleted_at` (`deleted_at`) USING BTREE,
  CONSTRAINT `fk_plan_of_actions_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_plan_of_actions_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  CONSTRAINT `fk_plan_of_actions_terms_template` FOREIGN KEY (`terms_template_id`) REFERENCES `terms_templates` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_plan_of_actions_terms_template_version` FOREIGN KEY (`terms_template_version_id`) REFERENCES `terms_template_versions` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_plan_of_actions_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.project_briefs
CREATE TABLE IF NOT EXISTS `project_briefs` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `project_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `doc_no` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `sections` json NOT NULL,
  `pdf_path` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL,
  `pdf_size` int(11) DEFAULT NULL,
  `created_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project_briefs_doc_no` (`doc_no`),
  KEY `idx_project_briefs_project_id` (`project_id`),
  KEY `idx_project_briefs_created_by` (`created_by`),
  CONSTRAINT `fk_project_briefs_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_project_briefs_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.project_phases
CREATE TABLE IF NOT EXISTS `project_phases` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `phase_number` int(11) NOT NULL,
  `phase_code` varchar(20) COLLATE utf8_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `description` text COLLATE utf8_unicode_ci,
  `sort_order` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_project_phases_deleted_at` (`deleted_at`) USING BTREE
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
  `current_phase` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `progress_pct` decimal(5,2) DEFAULT '0.00',
  `timeline_status` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `next_milestone_name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `schedule_variance` int(11) NOT NULL DEFAULT '0',
  `planned_duration` int(11) NOT NULL DEFAULT '0',
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
  KEY `idx_projects_timeline_status` (`timeline_status`),
  KEY `idx_projects_progress_pct` (`progress_pct`),
  CONSTRAINT `fk_projects_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_projects_project_type` FOREIGN KEY (`project_type_id`) REFERENCES `project_types` (`id`) ON DELETE SET NULL,
  CONSTRAINT `projects_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `projects_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `projects_ibfk_3` FOREIGN KEY (`archived_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.quotation_comparisons
CREATE TABLE IF NOT EXISTS `quotation_comparisons` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `projectId` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `workCategory` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `quotationIds` json NOT NULL,
  `comparedAt` datetime DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_quotation_comparisons_project` (`projectId`),
  CONSTRAINT `fk_quotation_comparisons_project` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
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

-- Dumping structure for table spsyn8lm_rippotai_erp.quotations
CREATE TABLE IF NOT EXISTS `quotations` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `quotation_number` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `current_version` int(11) NOT NULL DEFAULT '1',
  `quotation_date` date NOT NULL,
  `expiry_date` date DEFAULT NULL,
  `validity_days` int(11) DEFAULT '30',
  `comparison_notes` text COLLATE utf8_unicode_ci,
  `selected_at` timestamp NULL DEFAULT NULL,
  `selected_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `is_selected` tinyint(1) NOT NULL DEFAULT '0',
  `boq_reference` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
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
  KEY `idx_quotations_expiry` (`expiry_date`),
  KEY `idx_quotations_selected_by` (`selected_by`),
  CONSTRAINT `quotations_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  CONSTRAINT `quotations_ibfk_2` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`),
  CONSTRAINT `quotations_ibfk_3` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `quotations_ibfk_4` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `quotations_ibfk_5` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `quotations_ibfk_6` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `quotations_ibfk_7` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `quotations_ibfk_8` FOREIGN KEY (`selected_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.role_apps
CREATE TABLE IF NOT EXISTS `role_apps` (
  `role_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `app_code` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `granted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `granted_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`role_id`,`app_code`) USING BTREE,
  KEY `fk_role_apps_app` (`app_code`),
  KEY `fk_role_apps_granted_by` (`granted_by`),
  CONSTRAINT `fk_role_apps_app` FOREIGN KEY (`app_code`) REFERENCES `apps` (`code`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_role_apps_granted_by` FOREIGN KEY (`granted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_role_apps_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
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

-- Dumping structure for table spsyn8lm_rippotai_erp.team_members
CREATE TABLE IF NOT EXISTS `team_members` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `owner_type` enum('PROJECT','PLAN_OF_ACTION','QUOTATION','BOQ') COLLATE utf8_unicode_ci NOT NULL,
  `owner_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `role_label` varchar(150) COLLATE utf8_unicode_ci NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `sort_order` int(11) NOT NULL DEFAULT '0',
  `created_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uq_team_members_owner_user_role` (`owner_type`,`owner_id`,`user_id`,`role_label`) USING BTREE,
  KEY `idx_team_members_owner` (`owner_type`,`owner_id`) USING BTREE,
  KEY `idx_team_members_user_id` (`user_id`) USING BTREE,
  KEY `idx_team_members_created_by` (`created_by`) USING BTREE,
  KEY `idx_team_members_deleted_at` (`deleted_at`) USING BTREE,
  CONSTRAINT `fk_team_members_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_team_members_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.terms_template_versions
CREATE TABLE IF NOT EXISTS `terms_template_versions` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `terms_template_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `version` int(11) NOT NULL,
  `content_html` longtext COLLATE utf8_unicode_ci NOT NULL,
  `change_note` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_terms_template_version` (`terms_template_id`,`version`),
  KEY `idx_terms_template_versions_template` (`terms_template_id`),
  KEY `idx_terms_template_versions_created_by` (`created_by`),
  CONSTRAINT `fk_terms_template_versions_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_terms_template_versions_template` FOREIGN KEY (`terms_template_id`) REFERENCES `terms_templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Data exporting was unselected.

-- Dumping structure for table spsyn8lm_rippotai_erp.terms_templates
CREATE TABLE IF NOT EXISTS `terms_templates` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `scope` enum('GLOBAL','PROJECT','CLIENT','BOQ','ESTIMATE','PLAN_OF_ACTION') COLLATE utf8_unicode_ci NOT NULL DEFAULT 'GLOBAL',
  `content_html` longtext COLLATE utf8_unicode_ci NOT NULL,
  `current_version` int(11) NOT NULL DEFAULT '1',
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `updated_by` char(36) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_terms_template_scope` (`scope`),
  KEY `idx_terms_template_active` (`is_active`),
  KEY `idx_terms_template_default` (`is_default`),
  KEY `fk_terms_template_created_by` (`created_by`),
  KEY `fk_terms_template_updated_by` (`updated_by`),
  CONSTRAINT `fk_terms_template_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_terms_template_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
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

-- Dumping structure for table spsyn8lm_rippotai_erp.user_dashboard_layouts
CREATE TABLE IF NOT EXISTS `user_dashboard_layouts` (
  `user_id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `app_key` varchar(64) COLLATE utf8_unicode_ci NOT NULL,
  `layout` json NOT NULL,
  `hidden_keys` json NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`app_key`),
  CONSTRAINT `fk_dashboard_layout_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
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

-- Dumping structure for table spsyn8lm_rippotai_erp.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` char(36) COLLATE utf8_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `phone` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `job_title` varchar(150) COLLATE utf8_unicode_ci DEFAULT NULL,
  `avatar_url` text COLLATE utf8_unicode_ci,
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
