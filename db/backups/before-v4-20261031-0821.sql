/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.20-13.0.2-MariaDB, for osx10.23 (arm64)
--
-- Host: localhost    Database: spsyn8lm_rippotai_erp
-- ------------------------------------------------------
-- Server version	13.0.2-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `_local_migrations`
--

DROP TABLE IF EXISTS `_local_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `_local_migrations` (
  `name` varchar(255) NOT NULL,
  `applied_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_local_migrations`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `_local_migrations` WRITE;
/*!40000 ALTER TABLE `_local_migrations` DISABLE KEYS */;
INSERT INTO `_local_migrations` VALUES
('20260912_command_center_gate_engine.sql','2026-10-29 18:31:15'),
('20260918_unified_project_planner.sql','2026-10-29 18:31:15'),
('20260929_crm_pipeline_deals.sql','2026-10-29 18:31:15'),
('20260929_daily_site_reports_v2.sql','2026-10-29 18:31:15'),
('20260930_automation_client_links.sql','2026-10-29 18:31:15'),
('20260930_boq_status_enum.sql','2026-10-29 18:31:15'),
('20260930_client_brief_template.sql','2026-10-29 18:31:15'),
('20260930_scope_of_work_template.sql','2026-10-29 18:31:15'),
('20260930_site_ops_project_uuid.sql','2026-10-29 18:31:15'),
('20260930_site_recce_template.sql','2026-10-29 18:31:15'),
('20260930_workspace_notes_tasks.sql','2026-10-29 18:31:15'),
('20261002_client_links_token_enc.sql','2026-10-29 18:31:15'),
('20261002_fix_site_preparation_typo.sql','2026-10-29 18:31:15'),
('20261003_quality_checklist_template.sql','2026-10-29 18:31:15'),
('20261003_shortlist_packages.sql','2026-10-29 18:31:15'),
('20261005_zoho_reminder_sync.sql','2026-10-29 18:31:15'),
('20261006_client_brief_site_classification.sql','2026-10-29 18:31:15'),
('20261006_site_recce_other_room_type.sql','2026-10-29 18:31:15'),
('20261007_admin_dpr_documents.sql','2026-10-29 18:31:15'),
('20261007_business_proposals.sql','2026-10-29 18:31:15'),
('20261007_shortlist_workspace.sql','2026-10-29 18:31:15'),
('20261007_snag_list_documents.sql','2026-10-29 18:31:15'),
('20261007_visit_event_allocations.sql','2026-10-29 18:31:16'),
('20261008_vendor_rate_comparisons.sql','2026-10-29 18:31:16'),
('20261009_site_recce_existing_layouts.sql','2026-10-29 18:31:16'),
('20261009_site_recce_room_area.sql','2026-10-29 18:31:16'),
('20261010_daily_site_report_uuid.sql','2026-10-29 18:31:16'),
('20261010_developer_admin_permissions.sql','2026-10-29 18:31:16'),
('20261010_non_admin_role_permissions.sql','2026-10-29 18:31:16'),
('20261010_staff_route_permissions.sql','2026-10-29 18:31:16'),
('20261012_budget_guides.sql','2026-10-29 18:31:16'),
('20261012_command_center_authority_permission.sql','2026-10-29 18:31:16'),
('20261012_crucial_work.sql','2026-10-29 18:31:16'),
('20261015_email_verification.sql','2026-10-29 18:31:16'),
('20261022_user_pending_email.sql','2026-10-29 18:31:16'),
('20261027_admin_dpr_delete_permission.sql','2026-10-29 18:31:16'),
('20261027_checklist_delete_permission.sql','2026-10-29 18:31:16'),
('20261027_client_brief_expected_timeline.sql','2026-10-29 18:31:16'),
('20261027_daily_site_report_delete_permission.sql','2026-10-29 18:31:16'),
('20261027_scope_category_optional_slug.sql','2026-10-29 18:31:16'),
('20261027_site_recce_room_measurement_precision.sql','2026-10-29 18:31:16'),
('20261027_snag_list_delete_permission.sql','2026-10-29 18:31:16'),
('20261027_vendor_rate_comparison_delete_permission.sql','2026-10-29 18:31:16');
/*!40000 ALTER TABLE `_local_migrations` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `access_rules`
--

DROP TABLE IF EXISTS `access_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `access_rules` (
  `id` char(36) NOT NULL,
  `subject_type` enum('USER','ROLE') NOT NULL,
  `subject_id` char(36) NOT NULL,
  `resource` varchar(255) NOT NULL,
  `action` varchar(50) NOT NULL,
  `effect` enum('ALLOW','DENY') NOT NULL,
  `created_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_access_subject` (`subject_type`,`subject_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `access_rules`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `access_rules` WRITE;
/*!40000 ALTER TABLE `access_rules` DISABLE KEYS */;
/*!40000 ALTER TABLE `access_rules` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_logs` (
  `id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `user_email` varchar(255) NOT NULL,
  `user_role` varchar(50) NOT NULL,
  `action` enum('login','logout','login_failed','password_changed','password_reset_requested','password_reset_completed','token_refreshed','user_created','user_updated','user_profile_updated','user_avatar_updated','user_deactivated','user_reactivated','user_deleted','user_role_changed','user_permission_updated','project_created','project_updated','project_archived','project_restored','project_deleted','project_member_added','project_member_removed','project_status_changed','client_created','client_updated','client_deleted','client_restored','brief_created','brief_updated','brief_deleted','calendar_event_created','calendar_event_updated','calendar_event_deleted','task_created','task_updated','task_status_changed','task_completed','task_deleted','lead_created','lead_updated','lead_stage_changed','lead_note_added','lead_proposal_sent','lead_deleted','quotation_created','quotation_updated','quotation_submitted','quotation_approved','quotation_returned','quotation_declined','quotation_cancelled','quotation_deleted','quotation_revision_created','quotation_sent_to_client','quotation_restored','vendor_created','vendor_updated','vendor_deleted','vendor_approved','vendor_rejected','vendor_status_changed','drawing_uploaded','drawing_superseded','site_recce_created','site_recce_updated','site_recce_status_changed','site_recce_deleted','settings_updated','system_config_changed','billing_settings_updated','file_uploaded','file_deleted','file_downloaded','document_generated','invoice_created','invoice_updated','invoice_paid','payment_received','data_exported','data_imported','permission_denied','unauthorized_access_attempt') NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` char(36) DEFAULT NULL,
  `entity_label` varchar(255) DEFAULT NULL,
  `changes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`changes`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_activity_logs_user` (`user_id`),
  KEY `idx_activity_logs_created` (`created_at`),
  CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_logs`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity_logs` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `admin_daily_logs`
--

DROP TABLE IF EXISTS `admin_daily_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_daily_logs` (
  `id` char(36) NOT NULL,
  `log_date` date NOT NULL,
  `work_type` varchar(150) NOT NULL,
  `project_id` char(36) DEFAULT NULL,
  `details` text NOT NULL,
  `status` enum('PENDING','IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `pending_with` varchar(255) DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `deleted_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_adl_log_date` (`log_date`),
  KEY `idx_adl_status_due` (`status`,`due_date`),
  KEY `idx_adl_project` (`project_id`),
  KEY `idx_adl_created_by` (`created_by`),
  KEY `idx_adl_updated_by` (`updated_by`),
  KEY `fk_adl_deleted_by` (`deleted_by`),
  CONSTRAINT `fk_adl_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_adl_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_adl_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_adl_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_daily_logs`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `admin_daily_logs` WRITE;
/*!40000 ALTER TABLE `admin_daily_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_daily_logs` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `admin_daily_reports`
--

DROP TABLE IF EXISTS `admin_daily_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_daily_reports` (
  `id` char(36) NOT NULL,
  `report_date` date NOT NULL,
  `project_id` char(36) NOT NULL,
  `work_status` enum('PENDING','IN_PROGRESS','COMPLETED','ON_HOLD','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `work_details` text DEFAULT NULL,
  `contractor_working` text DEFAULT NULL,
  `work_planned_tomorrow` text DEFAULT NULL,
  `material_required_tomorrow` text DEFAULT NULL,
  `material_sent_from_vendor` text DEFAULT NULL,
  `material_sent_from_inventory` text DEFAULT NULL,
  `issues_blockers` text DEFAULT NULL,
  `photos_attached` tinyint(1) NOT NULL DEFAULT 0,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `deleted_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_adr_date_project` (`report_date`,`project_id`),
  KEY `idx_admin_daily_reports_project_id` (`project_id`),
  KEY `idx_admin_daily_reports_created_by` (`created_by`),
  KEY `idx_admin_daily_reports_updated_by` (`updated_by`),
  KEY `idx_admin_daily_reports_deleted_by` (`deleted_by`),
  CONSTRAINT `fk_adr_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_adr_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_adr_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_adr_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_daily_reports`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `admin_daily_reports` WRITE;
/*!40000 ALTER TABLE `admin_daily_reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_daily_reports` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `admin_dpr_documents`
--

DROP TABLE IF EXISTS `admin_dpr_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_dpr_documents` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `project_id` char(36) DEFAULT NULL,
  `project_names` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`project_names`)),
  `project_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`project_ids`)),
  `from_date` date DEFAULT NULL,
  `to_date` date DEFAULT NULL,
  `filters` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`filters`)),
  `reports` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`reports`)),
  `logs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`logs`)),
  `report_count` int(11) NOT NULL,
  `log_count` int(11) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `excel_data` longblob NOT NULL,
  `created_by` char(36) DEFAULT NULL,
  `created_by_name` varchar(150) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_admin_dpr_documents_created` (`created_at`),
  KEY `idx_admin_dpr_documents_project` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_dpr_documents`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `admin_dpr_documents` WRITE;
/*!40000 ALTER TABLE `admin_dpr_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_dpr_documents` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `apps`
--

DROP TABLE IF EXISTS `apps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `apps` (
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`code`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `apps`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `apps` WRITE;
/*!40000 ALTER TABLE `apps` DISABLE KEYS */;
INSERT INTO `apps` VALUES
('accounts','Accounts',1),
('adminConsole','Admin Console',1),
('automation','Automation',1),
('boq','BOQ',1),
('build','Build',1),
('calendar','Calendar',1),
('commandCenter','Command Center',1),
('crm','CRM',1),
('dashboard','Dashboard',1),
('design','Design',1),
('documents','Documents',1),
('inventory','Inventory',1),
('leads','Leads',1),
('projects','Projects',1),
('quotations','Quotations',1),
('settings','Settings',1),
('tasks','Tasks',1),
('vendors','Vendors',1);
/*!40000 ALTER TABLE `apps` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `architect_site_visits`
--

DROP TABLE IF EXISTS `architect_site_visits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `architect_site_visits` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `stage_id` char(36) NOT NULL,
  `status` enum('NOT_SCHEDULED','SCHEDULED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'NOT_SCHEDULED',
  `scheduled_date` date DEFAULT NULL,
  `visited_date` date DEFAULT NULL,
  `architect_id` char(36) DEFAULT NULL,
  `findings` text DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `hold_released` tinyint(1) NOT NULL DEFAULT 0,
  `hold_released_at` datetime DEFAULT NULL,
  `hold_released_by` char(36) DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_project_stage` (`project_id`,`stage_id`),
  KEY `idx_asv_scheduled` (`scheduled_date`,`status`),
  KEY `idx_asv_project` (`project_id`),
  KEY `idx_asv_stage` (`stage_id`),
  KEY `idx_asv_architect` (`architect_id`),
  KEY `idx_asv_hold_released_by` (`hold_released_by`),
  KEY `fk_asv_created_by` (`created_by`),
  KEY `fk_asv_updated_by` (`updated_by`),
  CONSTRAINT `fk_asv_architect` FOREIGN KEY (`architect_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_asv_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_asv_hold_released_by` FOREIGN KEY (`hold_released_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_asv_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_asv_stage` FOREIGN KEY (`stage_id`) REFERENCES `architect_visit_stages` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_asv_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `architect_site_visits`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `architect_site_visits` WRITE;
/*!40000 ALTER TABLE `architect_site_visits` DISABLE KEYS */;
/*!40000 ALTER TABLE `architect_site_visits` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `architect_visit_stages`
--

DROP TABLE IF EXISTS `architect_visit_stages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `architect_visit_stages` (
  `id` char(36) NOT NULL,
  `visit_no` int(11) NOT NULL,
  `stage` varchar(255) NOT NULL,
  `checks_purpose` text NOT NULL,
  `visit_type` varchar(40) NOT NULL,
  `remarks` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_avs_visit_no` (`visit_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `architect_visit_stages`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `architect_visit_stages` WRITE;
/*!40000 ALTER TABLE `architect_visit_stages` DISABLE KEYS */;
/*!40000 ALTER TABLE `architect_visit_stages` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `auth_tokens`
--

DROP TABLE IF EXISTS `auth_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_tokens` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `type` enum('refresh','session') NOT NULL DEFAULT 'refresh',
  `device_info` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `revoked_at` timestamp NULL DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `token_hash` (`token_hash`) USING BTREE,
  KEY `idx_auth_tokens_token_hash` (`token_hash`) USING BTREE,
  KEY `idx_auth_tokens_user_id` (`user_id`) USING BTREE,
  CONSTRAINT `auth_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_tokens`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `auth_tokens` WRITE;
/*!40000 ALTER TABLE `auth_tokens` DISABLE KEYS */;
INSERT INTO `auth_tokens` VALUES
('16be4eaa-3a85-454b-b90b-3c7e7626e20d','c4af5469-bbd1-11f1-9c80-02fc00000001','1f958dd2bb32f27abd6b095a2145da9d2ba9f53adbcae8a2218fe5744d9c670d','refresh',NULL,NULL,'2026-10-30 19:53:53',NULL,'2026-10-30 06:23:01','2026-10-29 19:53:53'),
('819f9905-872c-48ff-bdd0-4bb83e56a421','c4af5469-bbd1-11f1-9c80-02fc00000001','5f18dd7e8f6fad8ae042e6b9dcb0723b3d2b8a67da2edff04733fa0a1af1695b','refresh',NULL,NULL,'2026-10-30 19:53:18',NULL,'2026-10-29 19:53:18','2026-10-29 19:53:18'),
('f3631249-965a-4c3a-95dd-8d44398deae7','c4af5469-bbd1-11f1-9c80-02fc00000001','dbe9f456024d908eb5946d13d66184c3a53e267c638aa2f4195b9eb41d540304','refresh',NULL,NULL,'2026-10-30 13:02:05',NULL,'2026-10-29 13:02:05','2026-10-29 13:02:05');
/*!40000 ALTER TABLE `auth_tokens` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `automation_audit_logs`
--

DROP TABLE IF EXISTS `automation_audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `automation_audit_logs` (
  `id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `action` varchar(40) NOT NULL,
  `rule_id` char(36) DEFAULT NULL,
  `target` varchar(160) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `ix_automation_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `automation_audit_logs`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `automation_audit_logs` WRITE;
/*!40000 ALTER TABLE `automation_audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `automation_audit_logs` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `automation_escalations`
--

DROP TABLE IF EXISTS `automation_escalations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `automation_escalations` (
  `id` char(36) NOT NULL,
  `rule_id` char(36) DEFAULT NULL,
  `run_id` char(36) DEFAULT NULL,
  `project_id` char(36) DEFAULT NULL,
  `entity_type` varchar(40) DEFAULT NULL,
  `entity_id` varchar(64) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `details` text DEFAULT NULL,
  `priority` enum('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  `level` int(11) NOT NULL DEFAULT 1,
  `assigned_to` char(36) DEFAULT NULL,
  `assigned_role` varchar(80) DEFAULT NULL,
  `status` enum('OPEN','ACKNOWLEDGED','RESOLVED') NOT NULL DEFAULT 'OPEN',
  `resolution_notes` text DEFAULT NULL,
  `opened_at` datetime NOT NULL DEFAULT current_timestamp(),
  `acknowledged_at` datetime DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  `resolved_by` char(36) DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `ix_automation_escalations_status` (`status`),
  KEY `ix_automation_escalations_entity` (`rule_id`,`entity_type`,`entity_id`),
  CONSTRAINT `fk_automation_escalations_rule` FOREIGN KEY (`rule_id`) REFERENCES `automation_rules` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `automation_escalations`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `automation_escalations` WRITE;
/*!40000 ALTER TABLE `automation_escalations` DISABLE KEYS */;
/*!40000 ALTER TABLE `automation_escalations` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `automation_rules`
--

DROP TABLE IF EXISTS `automation_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `automation_rules` (
  `id` char(36) NOT NULL,
  `code` varchar(60) NOT NULL,
  `name` varchar(160) NOT NULL,
  `description` text DEFAULT NULL,
  `phase` varchar(60) DEFAULT NULL,
  `trigger_type` varchar(60) NOT NULL,
  `trigger_json` longtext DEFAULT NULL COMMENT '{ params: { graceDays, days, cooldownHours } }',
  `conditions_json` longtext DEFAULT NULL COMMENT '[{ field, operator, value }] — all must match',
  `actions_json` longtext DEFAULT NULL COMMENT '[{ type: NOTIFY|TASK|ESCALATE, recipient, title, message, priority, dueInDays }]',
  `project_types` longtext DEFAULT NULL,
  `status` enum('ACTIVE','DRAFT','DISABLED') NOT NULL DEFAULT 'DRAFT',
  `last_run_at` datetime DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_automation_rules_code` (`code`),
  KEY `ix_automation_rules_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `automation_rules`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `automation_rules` WRITE;
/*!40000 ALTER TABLE `automation_rules` DISABLE KEYS */;
/*!40000 ALTER TABLE `automation_rules` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `automation_runs`
--

DROP TABLE IF EXISTS `automation_runs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `automation_runs` (
  `id` char(36) NOT NULL,
  `seq` int(11) NOT NULL AUTO_INCREMENT,
  `rule_id` char(36) DEFAULT NULL,
  `rule_name` varchar(160) DEFAULT NULL,
  `trigger_type` varchar(60) DEFAULT NULL,
  `source` enum('manual','schedule','event','test') NOT NULL DEFAULT 'manual',
  `project_id` char(36) DEFAULT NULL,
  `entity_type` varchar(40) DEFAULT NULL,
  `entity_id` varchar(64) DEFAULT NULL,
  `entity_label` varchar(255) DEFAULT NULL,
  `status` enum('SUCCESS','FAILED','SKIPPED') NOT NULL,
  `duration_ms` int(11) DEFAULT NULL,
  `payload_json` longtext DEFAULT NULL,
  `conditions_json` longtext DEFAULT NULL,
  `actions_json` longtext DEFAULT NULL,
  `error` text DEFAULT NULL,
  `triggered_by` char(36) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL,
  `completed_at` datetime(3) DEFAULT NULL,
  `execution_key` varchar(160) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_automation_runs_seq` (`seq`),
  UNIQUE KEY `uq_automation_execution` (`rule_id`,`entity_type`,`entity_id`,`execution_key`),
  KEY `ix_automation_runs_rule_entity` (`rule_id`,`entity_type`,`entity_id`,`started_at`),
  KEY `ix_automation_runs_started` (`started_at`),
  CONSTRAINT `fk_automation_runs_rule` FOREIGN KEY (`rule_id`) REFERENCES `automation_rules` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `automation_runs`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `automation_runs` WRITE;
/*!40000 ALTER TABLE `automation_runs` DISABLE KEYS */;
/*!40000 ALTER TABLE `automation_runs` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `boq_activities`
--

DROP TABLE IF EXISTS `boq_activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `boq_activities` (
  `id` char(36) NOT NULL,
  `boq_id` char(36) DEFAULT NULL,
  `user_id` char(36) DEFAULT NULL,
  `action` enum('created','updated','item_added','item_updated','item_deleted','item_moved','category_added','category_deleted','rate_changed','submitted','approved','rejected','archived','deleted') NOT NULL,
  `target` varchar(255) NOT NULL,
  `details` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_activity_boq` (`boq_id`),
  CONSTRAINT `fk_activity_boq` FOREIGN KEY (`boq_id`) REFERENCES `boqs` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `boq_activities`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `boq_activities` WRITE;
/*!40000 ALTER TABLE `boq_activities` DISABLE KEYS */;
/*!40000 ALTER TABLE `boq_activities` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `boq_categories`
--

DROP TABLE IF EXISTS `boq_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `boq_categories` (
  `id` char(36) NOT NULL,
  `boq_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_boq_category_boq` (`boq_id`),
  CONSTRAINT `fk_boq_category_boq` FOREIGN KEY (`boq_id`) REFERENCES `boqs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `boq_categories`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `boq_categories` WRITE;
/*!40000 ALTER TABLE `boq_categories` DISABLE KEYS */;
INSERT INTO `boq_categories` VALUES
('00b1f322-e42c-4369-b108-a1d1455bcc23','c7df002d-0abe-46cb-bb37-e2f8a81390c8','Painting Works',5,'2026-07-14 06:09:07','2026-07-14 06:09:07'),
('0802c034-bfa5-4d8c-b7f3-6e9637af0558','c7df002d-0abe-46cb-bb37-e2f8a81390c8','Plumbing Works',3,'2026-07-14 06:09:06','2026-07-14 06:09:06'),
('0ec4b1e5-8865-4889-babd-9bb5e9d695a2','6202fca1-e77f-47d7-a432-a355b3103ae9','Painting Works',5,'2026-07-18 04:20:05','2026-07-18 04:20:05'),
('10b583e2-6c14-4920-bbc5-00c4f1098867','6202fca1-e77f-47d7-a432-a355b3103ae9','Electrical Works',2,'2026-07-18 04:20:05','2026-07-18 04:20:05'),
('1c6a5ae6-c6cb-48bd-a58b-2ab8f57959e5','e3669897-2256-4640-84b7-6d421ee11e4e','Civil Work',0,'2026-07-14 07:39:17','2026-07-14 07:39:17'),
('1d6de85c-7f44-11f1-b721-52540021303b','0ae2195f-8bc8-4913-879d-e8abdfa4b4bf','Civil Works',1,'2026-07-14 10:53:15','2026-07-14 10:53:15'),
('1d6df0a7-7f44-11f1-b721-52540021303b','0ae2195f-8bc8-4913-879d-e8abdfa4b4bf','Electrical Works',2,'2026-07-14 10:53:15','2026-07-14 10:53:15'),
('1d6df1de-7f44-11f1-b721-52540021303b','0ae2195f-8bc8-4913-879d-e8abdfa4b4bf','Plumbing Works',3,'2026-07-14 10:53:15','2026-07-14 10:53:15'),
('1d6df267-7f44-11f1-b721-52540021303b','0ae2195f-8bc8-4913-879d-e8abdfa4b4bf','Interior Works',4,'2026-07-14 10:53:15','2026-07-14 10:53:15'),
('1d6df2ff-7f44-11f1-b721-52540021303b','0ae2195f-8bc8-4913-879d-e8abdfa4b4bf','Painting Works',5,'2026-07-14 10:53:15','2026-07-14 10:53:15'),
('216a9e33-09d3-4f93-bd49-950ba8f42b35','60eda06d-3441-4509-90c4-1a5c6e293217','Kitchen Work',0,'2026-07-14 06:32:34','2026-07-14 06:32:34'),
('22ed28fb-cdf4-4450-b941-b1f567b43f02','e3669897-2256-4640-84b7-6d421ee11e4e','Electrical',0,'2026-07-14 07:39:25','2026-07-14 07:39:25'),
('245f1c61-ed90-44af-a467-4ca8a2aa5c8e','60eda06d-3441-4509-90c4-1a5c6e293217','Civil Work',0,'2026-07-14 06:32:22','2026-07-14 06:32:22'),
('38125139-ac8d-44b7-9506-e461a5eb3796','6202fca1-e77f-47d7-a432-a355b3103ae9','Civil Works',1,'2026-07-18 04:20:04','2026-07-18 04:20:04'),
('4a1eea5d-8763-45e1-8666-c0b8feb32c91','cccc80a8-42e7-4cbc-bb4c-415b29f9b5da','Civil Work',0,'2026-07-14 11:10:25','2026-07-14 11:10:25'),
('5059adc3-635b-4ef7-bd57-350b2b0d88dc','86067a3e-957c-4f67-bfed-71fe5f5ecc38','Kitchen Work',2,'2026-07-16 04:53:53','2026-07-16 04:53:53'),
('54db4dd8-c1fe-4074-bc5a-2508c06fb2c6','041eb29e-17cb-4ea4-a188-0b4b0413eef0','Electrical',0,'2026-07-18 04:17:31','2026-07-18 04:17:31'),
('59201f50-8e0d-4e8c-a602-b90f85906ca6','e3669897-2256-4640-84b7-6d421ee11e4e','Sanitary Fittings',0,'2026-07-14 07:39:28','2026-07-14 07:39:28'),
('679896f6-293a-4431-b939-0f8fee64b4c3','cccc80a8-42e7-4cbc-bb4c-415b29f9b5da','Electrical',0,'2026-07-14 11:12:27','2026-07-14 11:12:27'),
('68059e6d-b273-47a7-a36c-ada7860ba1c8','e3669897-2256-4640-84b7-6d421ee11e4e','Flooring',0,'2026-07-14 07:39:20','2026-07-14 07:39:20'),
('68f5b1b6-0f46-40d8-b8c5-7365f665f741','e56c2294-aada-4191-9cf7-f39968749c19','Wall Finishes',0,'2026-07-15 05:23:51','2026-07-15 05:23:51'),
('6bf7770c-8f6c-4b9d-ab2b-075d4e3a977c','118d5e76-c31e-4166-b210-6dcb98c5624e','Civil Work',0,'2026-07-16 04:55:16','2026-07-16 04:55:16'),
('6d7cc8b0-f237-40b7-a4ff-b8967ee141a7','60eda06d-3441-4509-90c4-1a5c6e293217','Doors & Windows',0,'2026-07-14 06:32:27','2026-07-14 06:32:27'),
('6fb36614-0ce6-4d6a-b73c-5b45a4cd3666','6202fca1-e77f-47d7-a432-a355b3103ae9','Interior Works',4,'2026-07-18 04:20:05','2026-07-18 04:20:05'),
('7367b116-d5c0-4f74-8b49-a336cec720dc','e3669897-2256-4640-84b7-6d421ee11e4e','Wall Finishes',0,'2026-07-14 07:39:22','2026-07-14 07:39:22'),
('80a1aedf-d605-4913-a64a-796e2dbacc74','86067a3e-957c-4f67-bfed-71fe5f5ecc38','Sanitary Fittings',1,'2026-07-16 04:53:53','2026-07-16 04:53:53'),
('829007f5-a5b8-418b-847f-36ffe19d19f2','6202fca1-e77f-47d7-a432-a355b3103ae9','Plumbing Works',3,'2026-07-18 04:20:05','2026-07-18 04:20:05'),
('8a692fa9-61ce-4c39-8268-dc857df3a0dd','c7df002d-0abe-46cb-bb37-e2f8a81390c8','Civil Works',1,'2026-07-14 06:09:06','2026-07-14 06:09:06'),
('91f3a428-1645-46aa-8a70-8530798016d2','c7df002d-0abe-46cb-bb37-e2f8a81390c8','Interior Works',4,'2026-07-14 06:09:07','2026-07-14 06:09:07'),
('b145d9ac-8145-40f7-8cc7-8914efc50a67','041eb29e-17cb-4ea4-a188-0b4b0413eef0','Civil Work',0,'2026-07-18 04:17:31','2026-07-18 04:17:31'),
('d3f891ca-2ecb-43e5-acc2-bd4fdd4aa0c2','c7df002d-0abe-46cb-bb37-e2f8a81390c8','Electrical Works',2,'2026-07-14 06:09:06','2026-07-14 06:09:06'),
('d5d47ddb-219d-471c-8568-97ee057f59b9','86067a3e-957c-4f67-bfed-71fe5f5ecc38','Civil Work',0,'2026-07-16 04:53:53','2026-07-16 04:53:53'),
('db090ba8-aaba-43d3-925c-079c599bcf47','182f4651-4a91-4535-bb46-3e6c7066d61f','Civil Work',0,'2026-07-15 11:28:22','2026-07-15 11:28:22'),
('e6c94046-d6f4-498c-bc9c-3c0968c5d44f','930e7888-9033-4427-aa62-962f84d8195a','Civil Work',0,'2026-07-18 11:35:24','2026-07-18 11:35:24');
/*!40000 ALTER TABLE `boq_categories` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `boq_items`
--

DROP TABLE IF EXISTS `boq_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `boq_items` (
  `id` char(36) NOT NULL,
  `boq_category_id` char(36) NOT NULL,
  `library_item_id` char(36) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `unit_id` char(36) DEFAULT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `quantity` decimal(15,2) NOT NULL DEFAULT 0.00,
  `rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `calc_type` enum('M','L') NOT NULL DEFAULT 'M',
  `location` varchar(255) DEFAULT NULL,
  `detail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`detail`)),
  `notes` text DEFAULT NULL,
  `hidden` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_boq_item_category` (`boq_category_id`),
  KEY `fk_boq_item_library` (`library_item_id`),
  CONSTRAINT `fk_boq_item_category` FOREIGN KEY (`boq_category_id`) REFERENCES `boq_categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_boq_item_library` FOREIGN KEY (`library_item_id`) REFERENCES `library_items` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `boq_items`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `boq_items` WRITE;
/*!40000 ALTER TABLE `boq_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `boq_items` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `boq_miscellaneous`
--

DROP TABLE IF EXISTS `boq_miscellaneous`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `boq_miscellaneous` (
  `id` char(36) NOT NULL,
  `boq_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `value` decimal(15,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_boq_miscellaneous_boq_id` (`boq_id`),
  CONSTRAINT `fk_boq_miscellaneous_boq` FOREIGN KEY (`boq_id`) REFERENCES `boqs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `boq_miscellaneous`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `boq_miscellaneous` WRITE;
/*!40000 ALTER TABLE `boq_miscellaneous` DISABLE KEYS */;
/*!40000 ALTER TABLE `boq_miscellaneous` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `boq_template_categories`
--

DROP TABLE IF EXISTS `boq_template_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `boq_template_categories` (
  `id` char(36) NOT NULL,
  `template_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_template_category_template` (`template_id`),
  CONSTRAINT `fk_template_category_template` FOREIGN KEY (`template_id`) REFERENCES `boq_templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `boq_template_categories`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `boq_template_categories` WRITE;
/*!40000 ALTER TABLE `boq_template_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `boq_template_categories` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `boq_template_items`
--

DROP TABLE IF EXISTS `boq_template_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `boq_template_items` (
  `id` char(36) NOT NULL,
  `boq_category_id` char(36) NOT NULL,
  `library_item_id` char(36) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `unit_id` char(36) DEFAULT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `quantity` decimal(15,2) NOT NULL DEFAULT 0.00,
  `rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_template_item_library` (`library_item_id`),
  KEY `fk_boq_item_category` (`boq_category_id`),
  CONSTRAINT `fk_template_item_library` FOREIGN KEY (`library_item_id`) REFERENCES `library_items` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `boq_template_items`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `boq_template_items` WRITE;
/*!40000 ALTER TABLE `boq_template_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `boq_template_items` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `boq_templates`
--

DROP TABLE IF EXISTS `boq_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `boq_templates` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `template_tier` enum('essential','premium','luxury') DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `boq_templates`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `boq_templates` WRITE;
/*!40000 ALTER TABLE `boq_templates` DISABLE KEYS */;
/*!40000 ALTER TABLE `boq_templates` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `boq_versions`
--

DROP TABLE IF EXISTS `boq_versions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `boq_versions` (
  `id` char(36) NOT NULL,
  `boq_id` char(36) NOT NULL,
  `version` int(11) NOT NULL,
  `version_name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_boq_versions_boq` (`boq_id`),
  CONSTRAINT `fk_boq_versions_boq` FOREIGN KEY (`boq_id`) REFERENCES `boqs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `boq_versions`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `boq_versions` WRITE;
/*!40000 ALTER TABLE `boq_versions` DISABLE KEYS */;
/*!40000 ALTER TABLE `boq_versions` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `boqs`
--

DROP TABLE IF EXISTS `boqs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `boqs` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `boq_number` varchar(50) DEFAULT NULL,
  `source_template_id` char(36) DEFAULT NULL,
  `boq_version_id` char(36) DEFAULT NULL,
  `status` enum('draft','in_progress','awaiting_approval','returned','approved','final','archived') NOT NULL DEFAULT 'draft',
  `locked` tinyint(1) NOT NULL DEFAULT 0,
  `total_value` decimal(15,2) NOT NULL DEFAULT 0.00,
  `version` int(11) NOT NULL DEFAULT 1,
  `client_name` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `prepared_by` varchar(255) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `terms_html` text DEFAULT NULL,
  `terms_template_id` char(36) DEFAULT NULL,
  `terms_template_version` int(11) DEFAULT NULL,
  `misc_pct` decimal(5,2) NOT NULL DEFAULT 10.00,
  `design_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `execution_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `supervisor_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `additional_total` decimal(15,2) NOT NULL DEFAULT 0.00,
  `approved_at` datetime DEFAULT NULL,
  `approved_by` char(36) DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_boq_number` (`boq_number`),
  KEY `fk_boq_template` (`source_template_id`),
  KEY `fk_boqs_version` (`boq_version_id`),
  CONSTRAINT `fk_boq_template` FOREIGN KEY (`source_template_id`) REFERENCES `boq_templates` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_boqs_version` FOREIGN KEY (`boq_version_id`) REFERENCES `boq_versions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `boqs`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `boqs` WRITE;
/*!40000 ALTER TABLE `boqs` DISABLE KEYS */;
/*!40000 ALTER TABLE `boqs` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `budget_estimate_categories`
--

DROP TABLE IF EXISTS `budget_estimate_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `budget_estimate_categories` (
  `id` char(36) NOT NULL,
  `estimate_id` char(36) NOT NULL,
  `library_category_id` char(36) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_budget_estimate_categories_estimate` (`estimate_id`) USING BTREE,
  KEY `idx_budget_estimate_categories_library` (`library_category_id`) USING BTREE,
  CONSTRAINT `fk_budget_estimate_categories_estimate` FOREIGN KEY (`estimate_id`) REFERENCES `budget_estimates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_budget_estimate_categories_library` FOREIGN KEY (`library_category_id`) REFERENCES `library_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `budget_estimate_categories`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `budget_estimate_categories` WRITE;
/*!40000 ALTER TABLE `budget_estimate_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `budget_estimate_categories` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `budget_estimate_items`
--

DROP TABLE IF EXISTS `budget_estimate_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `budget_estimate_items` (
  `id` char(36) NOT NULL,
  `estimate_id` char(36) NOT NULL,
  `estimate_category_id` char(36) NOT NULL,
  `library_item_id` char(36) DEFAULT NULL,
  `boq_item_id` char(36) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `unit_id` char(36) DEFAULT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `quantity` decimal(15,2) NOT NULL DEFAULT 0.00,
  `rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `calc_type` enum('M','L') NOT NULL DEFAULT 'M',
  `location` varchar(255) DEFAULT NULL,
  `detail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`detail`)),
  `notes` text DEFAULT NULL,
  `hidden` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_budget_estimate_items_estimate` (`estimate_id`) USING BTREE,
  KEY `idx_budget_estimate_items_category` (`estimate_category_id`) USING BTREE,
  KEY `idx_budget_estimate_items_library` (`library_item_id`) USING BTREE,
  KEY `idx_budget_estimate_items_boq` (`boq_item_id`) USING BTREE,
  KEY `idx_budget_estimate_items_unit` (`unit_id`) USING BTREE,
  CONSTRAINT `fk_budget_estimate_items_boq` FOREIGN KEY (`boq_item_id`) REFERENCES `boq_items` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_budget_estimate_items_category` FOREIGN KEY (`estimate_category_id`) REFERENCES `budget_estimate_categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_budget_estimate_items_estimate` FOREIGN KEY (`estimate_id`) REFERENCES `budget_estimates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_budget_estimate_items_library` FOREIGN KEY (`library_item_id`) REFERENCES `library_items` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_budget_estimate_items_unit` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `budget_estimate_items`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `budget_estimate_items` WRITE;
/*!40000 ALTER TABLE `budget_estimate_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `budget_estimate_items` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `budget_estimate_miscellaneous`
--

DROP TABLE IF EXISTS `budget_estimate_miscellaneous`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `budget_estimate_miscellaneous` (
  `id` char(36) NOT NULL,
  `estimate_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `value` decimal(15,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_budget_estimate_misc_estimate` (`estimate_id`) USING BTREE,
  CONSTRAINT `fk_budget_estimate_misc_estimate` FOREIGN KEY (`estimate_id`) REFERENCES `budget_estimates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `budget_estimate_miscellaneous`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `budget_estimate_miscellaneous` WRITE;
/*!40000 ALTER TABLE `budget_estimate_miscellaneous` DISABLE KEYS */;
/*!40000 ALTER TABLE `budget_estimate_miscellaneous` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `budget_estimate_versions`
--

DROP TABLE IF EXISTS `budget_estimate_versions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `budget_estimate_versions` (
  `id` char(36) NOT NULL,
  `estimate_id` char(36) NOT NULL,
  `version` int(11) NOT NULL,
  `version_name` varchar(255) NOT NULL,
  `total_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `snapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`snapshot`)),
  `created_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uq_budget_estimate_version` (`estimate_id`,`version`) USING BTREE,
  KEY `idx_budget_estimate_versions_estimate` (`estimate_id`) USING BTREE,
  KEY `idx_budget_estimate_versions_created_by` (`created_by`) USING BTREE,
  CONSTRAINT `fk_budget_estimate_versions_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_budget_estimate_versions_estimate` FOREIGN KEY (`estimate_id`) REFERENCES `budget_estimates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `budget_estimate_versions`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `budget_estimate_versions` WRITE;
/*!40000 ALTER TABLE `budget_estimate_versions` DISABLE KEYS */;
/*!40000 ALTER TABLE `budget_estimate_versions` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `budget_estimates`
--

DROP TABLE IF EXISTS `budget_estimates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `budget_estimates` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `boq_id` char(36) DEFAULT NULL,
  `source_template_id` char(36) DEFAULT NULL,
  `estimate_number` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `status` enum('draft','in_progress','submitted','approved','rejected','revised','cancelled') NOT NULL DEFAULT 'draft',
  `subtotal` decimal(15,2) NOT NULL DEFAULT 0.00,
  `misc_percentage` decimal(5,2) NOT NULL DEFAULT 0.00,
  `misc_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `design_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `execution_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `supervisor_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `additional_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `tax_percentage` decimal(5,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `client_name` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `prepared_by` varchar(255) DEFAULT NULL,
  `estimate_date` date DEFAULT NULL,
  `terms_html` text DEFAULT NULL,
  `terms_template_id` char(36) DEFAULT NULL,
  `terms_template_version` int(11) DEFAULT NULL,
  `version` int(11) NOT NULL DEFAULT 1,
  `locked` tinyint(1) NOT NULL DEFAULT 0,
  `approved_at` datetime DEFAULT NULL,
  `approved_by` char(36) DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uq_budget_estimate_number` (`estimate_number`) USING BTREE,
  KEY `idx_budget_estimates_project` (`project_id`) USING BTREE,
  KEY `idx_budget_estimates_boq` (`boq_id`) USING BTREE,
  KEY `idx_budget_estimates_source_template` (`source_template_id`) USING BTREE,
  KEY `idx_budget_estimates_terms_template` (`terms_template_id`) USING BTREE,
  KEY `idx_budget_estimates_approved_by` (`approved_by`) USING BTREE,
  KEY `idx_budget_estimates_created_by` (`created_by`) USING BTREE,
  KEY `idx_budget_estimates_updated_by` (`updated_by`) USING BTREE,
  CONSTRAINT `fk_budget_estimates_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_budget_estimates_boq` FOREIGN KEY (`boq_id`) REFERENCES `boqs` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_budget_estimates_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_budget_estimates_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  CONSTRAINT `fk_budget_estimates_source_template` FOREIGN KEY (`source_template_id`) REFERENCES `boq_templates` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_budget_estimates_terms_template` FOREIGN KEY (`terms_template_id`) REFERENCES `terms_templates` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_budget_estimates_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `budget_estimates`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `budget_estimates` WRITE;
/*!40000 ALTER TABLE `budget_estimates` DISABLE KEYS */;
/*!40000 ALTER TABLE `budget_estimates` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `budget_guides`
--

DROP TABLE IF EXISTS `budget_guides`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `budget_guides` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `project_id` char(36) DEFAULT NULL,
  `source_guide_id` char(36) DEFAULT NULL,
  `project_type` varchar(255) NOT NULL,
  `location` varchar(255) NOT NULL,
  `prepared_by` varchar(255) NOT NULL,
  `currency` char(3) NOT NULL,
  `area_unit` varchar(80) NOT NULL,
  `built_up_area` decimal(18,4) DEFAULT NULL,
  `issue_date` date NOT NULL,
  `validity_months` int(11) NOT NULL,
  `rate_validity_days` int(11) NOT NULL,
  `status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
  `introduction` text NOT NULL,
  `plans` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`plans`)),
  `pricing_notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`pricing_notes`)),
  `next_steps` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`next_steps`)),
  `revision` int(11) NOT NULL DEFAULT 1,
  `created_by` char(36) NOT NULL,
  `updated_by` char(36) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `budget_guides_project` (`project_id`),
  KEY `budget_guides_status_updated` (`status`,`updated_at`),
  KEY `budget_guides_source` (`source_guide_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `budget_guides`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `budget_guides` WRITE;
/*!40000 ALTER TABLE `budget_guides` DISABLE KEYS */;
/*!40000 ALTER TABLE `budget_guides` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `business_proposals`
--

DROP TABLE IF EXISTS `business_proposals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `business_proposals` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `snapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`snapshot`)),
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `business_proposals_project` (`project_id`),
  KEY `business_proposals_updated` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `business_proposals`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `business_proposals` WRITE;
/*!40000 ALTER TABLE `business_proposals` DISABLE KEYS */;
/*!40000 ALTER TABLE `business_proposals` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `calendar_events`
--

DROP TABLE IF EXISTS `calendar_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `calendar_events` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `type` enum('task','client_meeting','internal_meeting','vendor_call','presentation','note','timeline','milestone_due','quotation_deadline','site_visit','handover','personal') NOT NULL DEFAULT 'internal_meeting',
  `starts_at` datetime NOT NULL,
  `ends_at` datetime DEFAULT NULL,
  `all_day` tinyint(1) NOT NULL DEFAULT 0,
  `project_id` char(36) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `attendees` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`attendees`)),
  `created_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_calendar_events_type` (`type`),
  KEY `idx_calendar_events_starts_at` (`starts_at`),
  KEY `idx_calendar_events_project_id` (`project_id`),
  CONSTRAINT `fk_calendar_events_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `calendar_events`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `calendar_events` WRITE;
/*!40000 ALTER TABLE `calendar_events` DISABLE KEYS */;
/*!40000 ALTER TABLE `calendar_events` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `checklist_template_items`
--

DROP TABLE IF EXISTS `checklist_template_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `checklist_template_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `template_id` int(11) NOT NULL,
  `text` varchar(300) NOT NULL,
  `order` int(11) NOT NULL,
  `is_required` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_checklist_template_items_template_id` (`template_id`),
  CONSTRAINT `fk_checklist_template_items_template` FOREIGN KEY (`template_id`) REFERENCES `checklist_templates` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `checklist_template_items`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `checklist_template_items` WRITE;
/*!40000 ALTER TABLE `checklist_template_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `checklist_template_items` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `checklist_templates`
--

DROP TABLE IF EXISTS `checklist_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `checklist_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `trade_team_id` int(11) NOT NULL,
  `step_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_checklist_templates_trade_team_id` (`trade_team_id`),
  KEY `idx_checklist_templates_step_id` (`step_id`),
  KEY `idx_checklist_templates_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `checklist_templates`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `checklist_templates` WRITE;
/*!40000 ALTER TABLE `checklist_templates` DISABLE KEYS */;
/*!40000 ALTER TABLE `checklist_templates` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `client_link_responses`
--

DROP TABLE IF EXISTS `client_link_responses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_link_responses` (
  `id` char(36) NOT NULL,
  `link_id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `kind` enum('boq_approved','boq_changes_requested','quotation_selected','handover_accepted','snag_reported') NOT NULL,
  `target_id` char(36) DEFAULT NULL,
  `signatory_name` varchar(255) DEFAULT NULL,
  `signatory_email` varchar(255) DEFAULT NULL,
  `comments` text DEFAULT NULL,
  `data_json` longtext DEFAULT NULL,
  `signature_png` longtext DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `ix_client_link_responses_project` (`project_id`,`kind`),
  KEY `fk_client_link_responses_link` (`link_id`),
  CONSTRAINT `fk_client_link_responses_link` FOREIGN KEY (`link_id`) REFERENCES `client_links` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_link_responses`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `client_link_responses` WRITE;
/*!40000 ALTER TABLE `client_link_responses` DISABLE KEYS */;
/*!40000 ALTER TABLE `client_link_responses` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `client_links`
--

DROP TABLE IF EXISTS `client_links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `client_links` (
  `id` char(36) NOT NULL,
  `token_hash` char(64) NOT NULL,
  `token_hint` varchar(12) DEFAULT NULL,
  `token_enc` varchar(255) DEFAULT NULL,
  `project_id` char(36) NOT NULL,
  `purpose` enum('project_view','boq_approval','quotation_selection','handover_acceptance') NOT NULL DEFAULT 'project_view',
  `target_id` char(36) DEFAULT NULL,
  `client_name` varchar(255) DEFAULT NULL,
  `client_email` varchar(255) DEFAULT NULL,
  `options_json` longtext DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `revoked_by` char(36) DEFAULT NULL,
  `last_opened_at` datetime DEFAULT NULL,
  `open_count` int(11) NOT NULL DEFAULT 0,
  `created_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_client_links_token` (`token_hash`),
  KEY `ix_client_links_project` (`project_id`),
  KEY `ix_client_links_email` (`client_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_links`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `client_links` WRITE;
/*!40000 ALTER TABLE `client_links` DISABLE KEYS */;
/*!40000 ALTER TABLE `client_links` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `clients`
--

DROP TABLE IF EXISTS `clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `clients` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_clients_slug` (`slug`),
  KEY `idx_clients_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clients`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `clients` WRITE;
/*!40000 ALTER TABLE `clients` DISABLE KEYS */;
/*!40000 ALTER TABLE `clients` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `continuity_roles`
--

DROP TABLE IF EXISTS `continuity_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `continuity_roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `team_id` int(11) NOT NULL,
  `continuity_type` enum('CONTINUOUS','GATE_BOUND') NOT NULL DEFAULT 'CONTINUOUS',
  `opens_at_step_id` int(11) DEFAULT NULL,
  `closes_at_step_id` int(11) DEFAULT NULL,
  `actual_opened_at` datetime DEFAULT NULL,
  `actual_closed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `continuity_roles`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `continuity_roles` WRITE;
/*!40000 ALTER TABLE `continuity_roles` DISABLE KEYS */;
/*!40000 ALTER TABLE `continuity_roles` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `crucial_task_checks`
--

DROP TABLE IF EXISTS `crucial_task_checks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `crucial_task_checks` (
  `id` char(36) NOT NULL,
  `task_id` char(36) NOT NULL,
  `cycle_date` date NOT NULL,
  `cycle` enum('daily','weekly') NOT NULL,
  `check_status` enum('checked','in_progress','not_checked') NOT NULL,
  `follow_up` text DEFAULT NULL,
  `checked_by` char(36) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `crucial_task_cycle_unique` (`task_id`,`cycle_date`,`cycle`),
  KEY `crucial_check_cycle` (`cycle_date`,`cycle`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `crucial_task_checks`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `crucial_task_checks` WRITE;
/*!40000 ALTER TABLE `crucial_task_checks` DISABLE KEYS */;
/*!40000 ALTER TABLE `crucial_task_checks` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `daily_site_reports`
--

DROP TABLE IF EXISTS `daily_site_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `daily_site_reports` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `report_date` date NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'DRAFT',
  `submitted_at` datetime DEFAULT NULL,
  `weather_condition` varchar(50) DEFAULT NULL,
  `weather_notes` text DEFAULT NULL,
  `site_condition` varchar(30) DEFAULT NULL,
  `work_completed` text DEFAULT NULL,
  `work_items` longtext DEFAULT NULL,
  `materials` longtext DEFAULT NULL,
  `equipment` longtext DEFAULT NULL,
  `issue_items` longtext DEFAULT NULL,
  `issues` text DEFAULT NULL,
  `needs_attention` tinyint(1) NOT NULL DEFAULT 0,
  `safety_incident` tinyint(1) NOT NULL DEFAULT 0,
  `safety_notes` text DEFAULT NULL,
  `photos` longtext DEFAULT NULL,
  `next_day_plan` text DEFAULT NULL,
  `reported_by` varchar(150) NOT NULL,
  `share_with_client` tinyint(1) NOT NULL DEFAULT 0,
  `is_shared` tinyint(1) NOT NULL DEFAULT 0,
  `shared_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_daily_site_reports_project_date` (`project_id`,`report_date`),
  KEY `idx_daily_site_reports_project_id` (`project_id`),
  KEY `idx_daily_site_reports_report_date` (`report_date`),
  KEY `idx_daily_site_reports_status` (`status`),
  KEY `idx_daily_site_reports_needs_attention` (`needs_attention`),
  KEY `idx_daily_site_reports_is_shared` (`is_shared`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daily_site_reports`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `daily_site_reports` WRITE;
/*!40000 ALTER TABLE `daily_site_reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `daily_site_reports` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `deliverables`
--

DROP TABLE IF EXISTS `deliverables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `deliverables` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `step_id` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `is_required` tinyint(1) DEFAULT 1,
  `file_type` varchar(60) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `step_id` (`step_id`),
  CONSTRAINT `1` FOREIGN KEY (`step_id`) REFERENCES `steps` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deliverables`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `deliverables` WRITE;
/*!40000 ALTER TABLE `deliverables` DISABLE KEYS */;
/*!40000 ALTER TABLE `deliverables` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `delivery_challan_items`
--

DROP TABLE IF EXISTS `delivery_challan_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_challan_items` (
  `id` char(36) NOT NULL,
  `delivery_challan_id` char(36) NOT NULL,
  `purchase_order_item_id` char(36) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `material_id` char(36) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `line_number` int(11) NOT NULL,
  `description` varchar(500) NOT NULL,
  `brand` varchar(150) DEFAULT NULL,
  `specification` text DEFAULT NULL,
  `quantity` decimal(15,3) NOT NULL,
  `accepted_quantity` decimal(15,3) NOT NULL DEFAULT 0.000,
  `shortage_quantity` decimal(15,3) NOT NULL DEFAULT 0.000,
  `damaged_quantity` decimal(15,3) NOT NULL DEFAULT 0.000,
  `rejected_quantity` decimal(15,3) NOT NULL DEFAULT 0.000,
  `condition_status` enum('GOOD','DAMAGED','SHORT','DAMAGED_AND_SHORT','REJECTED') NOT NULL DEFAULT 'GOOD',
  `condition_notes` text DEFAULT NULL,
  `stored_at` varchar(255) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_delivery_challan_items_delivery_challan_id` (`delivery_challan_id`) USING BTREE,
  KEY `idx_delivery_challan_items_purchase_order_item_id` (`purchase_order_item_id`) USING BTREE,
  KEY `idx_delivery_challan_items_material_id` (`material_id`) USING BTREE,
  CONSTRAINT `fk_delivery_challan_items_delivery_challan` FOREIGN KEY (`delivery_challan_id`) REFERENCES `delivery_challans` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_delivery_challan_items_material` FOREIGN KEY (`material_id`) REFERENCES `material_masters` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_delivery_challan_items_purchase_order_item` FOREIGN KEY (`purchase_order_item_id`) REFERENCES `purchase_order_items` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_challan_items`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `delivery_challan_items` WRITE;
/*!40000 ALTER TABLE `delivery_challan_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `delivery_challan_items` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `delivery_challans`
--

DROP TABLE IF EXISTS `delivery_challans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_challans` (
  `id` char(36) NOT NULL,
  `challan_number` varchar(50) NOT NULL,
  `project_id` char(36) NOT NULL,
  `site_id` char(36) DEFAULT NULL,
  `purchase_order_id` char(36) DEFAULT NULL,
  `vendor_id` char(36) DEFAULT NULL,
  `material_requirement_id` char(36) DEFAULT NULL,
  `challan_date` date NOT NULL,
  `site_address` text DEFAULT NULL,
  `status` enum('DRAFT','IN_TRANSIT','RECEIVED','PARTIALLY_ACCEPTED','REJECTED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `gate_pass_received` tinyint(1) NOT NULL DEFAULT 0,
  `material_checked` tinyint(1) NOT NULL DEFAULT 0,
  `general_remarks` text DEFAULT NULL,
  `discrepancy_notes` text DEFAULT NULL,
  `dispatched_by` char(36) DEFAULT NULL,
  `dispatched_at` datetime DEFAULT NULL,
  `received_by` char(36) DEFAULT NULL,
  `received_at` datetime DEFAULT NULL,
  `attachment_url` text DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_delivery_challans_challan_number` (`challan_number`),
  KEY `idx_delivery_challans_challan_number` (`challan_number`),
  KEY `idx_delivery_challans_project_id` (`project_id`),
  KEY `idx_delivery_challans_site_id` (`site_id`),
  KEY `idx_delivery_challans_purchase_order_id` (`purchase_order_id`),
  KEY `idx_delivery_challans_vendor_id` (`vendor_id`),
  KEY `idx_delivery_challans_status` (`status`),
  KEY `idx_delivery_challans_dispatched_by` (`dispatched_by`),
  KEY `idx_delivery_challans_received_by` (`received_by`),
  KEY `idx_delivery_challans_material_requirement_id` (`material_requirement_id`),
  CONSTRAINT `fk_delivery_challans_material_requirement` FOREIGN KEY (`material_requirement_id`) REFERENCES `material_requirements` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_challans`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `delivery_challans` WRITE;
/*!40000 ALTER TABLE `delivery_challans` DISABLE KEYS */;
/*!40000 ALTER TABLE `delivery_challans` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `document_attachments`
--

DROP TABLE IF EXISTS `document_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_attachments` (
  `id` char(36) NOT NULL,
  `document_id` char(36) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `storage_filename` varchar(255) DEFAULT NULL,
  `url` varchar(1000) DEFAULT NULL,
  `mime` varchar(255) DEFAULT NULL,
  `size` bigint(20) DEFAULT NULL,
  `remark` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_document_attachments_document` (`document_id`) USING BTREE,
  CONSTRAINT `fk_document_attachments_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_attachments`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `document_attachments` WRITE;
/*!40000 ALTER TABLE `document_attachments` DISABLE KEYS */;
/*!40000 ALTER TABLE `document_attachments` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `document_requirements`
--

DROP TABLE IF EXISTS `document_requirements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_requirements` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `document_type_id` char(36) NOT NULL,
  `requirement_type` varchar(30) NOT NULL DEFAULT 'REQUIRED',
  `is_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `is_completed` tinyint(1) NOT NULL DEFAULT 0,
  `completed_at` datetime DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uq_project_document_requirement` (`project_id`,`document_type_id`) USING BTREE,
  KEY `idx_document_requirements_project` (`project_id`) USING BTREE,
  KEY `idx_document_requirements_type` (`document_type_id`) USING BTREE,
  CONSTRAINT `fk_document_requirements_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_document_requirements_type` FOREIGN KEY (`document_type_id`) REFERENCES `document_types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_requirements`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `document_requirements` WRITE;
/*!40000 ALTER TABLE `document_requirements` DISABLE KEYS */;
/*!40000 ALTER TABLE `document_requirements` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `document_types`
--

DROP TABLE IF EXISTS `document_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_types` (
  `id` char(36) NOT NULL,
  `code` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `phase_code` varchar(50) NOT NULL,
  `project_phase_id` char(36) DEFAULT NULL,
  `phase_name` varchar(255) NOT NULL,
  `section_code` varchar(50) DEFAULT NULL,
  `section_name` varchar(255) DEFAULT NULL,
  `sequence` int(11) NOT NULL DEFAULT 0,
  `target_type` varchar(30) NOT NULL DEFAULT 'DOCUMENT',
  `requirement_type` varchar(30) NOT NULL DEFAULT 'REQUIRED',
  `allows_multiple` tinyint(1) NOT NULL DEFAULT 0,
  `requires_revision` tinyint(1) NOT NULL DEFAULT 0,
  `requires_approval` tinyint(1) NOT NULL DEFAULT 0,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uq_document_types_code` (`code`) USING BTREE,
  KEY `idx_document_types_phase` (`phase_code`) USING BTREE,
  KEY `idx_document_types_section` (`section_code`) USING BTREE,
  KEY `idx_document_types_order` (`phase_code`,`sequence`) USING BTREE,
  KEY `idx_document_types_project_phase` (`project_phase_id`),
  CONSTRAINT `fk_document_types_project_phase` FOREIGN KEY (`project_phase_id`) REFERENCES `project_phases` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_types`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `document_types` WRITE;
/*!40000 ALTER TABLE `document_types` DISABLE KEYS */;
INSERT INTO `document_types` VALUES
('2241a298-a1fd-11f1-99c8-52540021303b','BRIEF_CLIENT_BRIEF','Client Brief','01_BRIEF','df430513-9a8b-526e-981a-a33cea8e94ff','BRIEF','1.1','BRIEF',1,'DOCUMENT','REQUIRED',1,0,0,'Requirements, scope, budget and expectations captured in one document.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241ad19-a1fd-11f1-99c8-52540021303b','BRIEF_SCOPE_OF_WORK','Scope of Work','01_BRIEF','df430513-9a8b-526e-981a-a33cea8e94ff','BRIEF','1.4','BRIEF',2,'DOCUMENT','REQUIRED',1,1,1,'Written from the project scope and escalated into Scope of Approval after the recce.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241af39-a1fd-11f1-99c8-52540021303b','RECCE_SITE_RECCE','Site Recce','02_RECCE','3aa4d822-dca3-5e58-be3e-91f9eecaa311','SITE SURVEY / RECCE','2.1','SITE SURVEY / RECCE',1,'DOCUMENT','REQUIRED',1,0,0,'Measurements, photographs and existing conditions recorded during joint site visit.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241b087-a1fd-11f1-99c8-52540021303b','RECCE_SITE_ANALYSIS','Site Analysis','02_RECCE','3aa4d822-dca3-5e58-be3e-91f9eecaa311','SITE SURVEY / RECCE','2.2','SITE SURVEY / RECCE',2,'DOCUMENT','REQUIRED',1,1,0,'Orientation, services, access, structure and constraints read from the survey.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241b1d2-a1fd-11f1-99c8-52540021303b','RECCE_SITE_BRIEF','Site Brief','02_RECCE','3aa4d822-dca3-5e58-be3e-91f9eecaa311','SITE SURVEY / RECCE','2.3','SITE SURVEY / RECCE',3,'DOCUMENT','REQUIRED',1,1,0,'Detailed recce converted into the brief used by the delivery team.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241b329-a1fd-11f1-99c8-52540021303b','RECCE_SCOPE_OF_APPROVAL','Scope of Approval','02_RECCE','3aa4d822-dca3-5e58-be3e-91f9eecaa311','SITE SURVEY / RECCE','2.4','SITE SURVEY / RECCE',4,'DOCUMENT','REQUIRED',1,1,1,'Finalised scope identifying client or statutory approvals and applicable gates.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241b455-a1fd-11f1-99c8-52540021303b','PRE_EXISTING_LAYOUT','Existing Layout — As-Built','03_PRE_DESIGN','a0628b6a-0206-5acd-8fcc-9838fc245781','PRE-DESIGN','3.1','PRE-DESIGN',1,'DRAWING','REQUIRED',1,1,0,'As-is layout drawn from survey measurements.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241b569-a1fd-11f1-99c8-52540021303b','PRE_PROPOSED_LAYOUT','Proposed Layout','03_PRE_DESIGN','a0628b6a-0206-5acd-8fcc-9838fc245781','PRE-DESIGN','3.2','PRE-DESIGN',2,'DRAWING','REQUIRED',1,1,0,'New layout developed from the client brief.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241b698-a1fd-11f1-99c8-52540021303b','PRE_REFERENCE_MOODBOARD','Reference Presentation and Moodboard','03_PRE_DESIGN','a0628b6a-0206-5acd-8fcc-9838fc245781','PRE-DESIGN','3.3','PRE-DESIGN',3,'DOCUMENT','REQUIRED',1,1,0,'Direction and material story developed alongside the proposed layout.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241b878-a1fd-11f1-99c8-52540021303b','PRE_PITCH_PROPOSAL','Pitch / Proposal + Business Proposal','03_PRE_DESIGN','a0628b6a-0206-5acd-8fcc-9838fc245781','PRE-DESIGN','3.4','PRE-DESIGN',4,'DOCUMENT','REQUIRED',1,1,1,'Design pitch and commercial proposal presented together to win the project.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241ba60-a1fd-11f1-99c8-52540021303b','PRE_CONCEPT_DESIGN_01','Concept Design 01 — 3D','03_PRE_DESIGN','a0628b6a-0206-5acd-8fcc-9838fc245781','PRE-DESIGN','3.5','PRE-DESIGN',5,'DOCUMENT','REQUIRED',1,1,1,'First client-facing 3D concept presented with the pitch.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241bb92-a1fd-11f1-99c8-52540021303b','PLAN_PAYMENT_RECEIPT','Payment Receipt','04_PLANNING','bf4191fb-1601-53e1-b84f-ec7a21a56d6d','PLANNING PHASE','4.1','PLANNING PHASE',1,'DOCUMENT','REQUIRED',1,0,0,'Receipt for token amount.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241bca5-a1fd-11f1-99c8-52540021303b','PLAN_PAYMENT_SCHEDULE','Payment Schedule','04_PLANNING','bf4191fb-1601-53e1-b84f-ec7a21a56d6d','PLANNING PHASE','4.2','PLANNING PHASE',2,'DOCUMENT','REQUIRED',1,1,1,'Milestones and terms against the deliverable list.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241bdd1-a1fd-11f1-99c8-52540021303b','PLAN_SIGNED_CONTRACT','Signed Contract','04_PLANNING','bf4191fb-1601-53e1-b84f-ec7a21a56d6d','PLANNING PHASE','4.3','PLANNING PHASE',3,'DOCUMENT','CONDITIONAL',1,1,1,'Executed contract for projects where RIPPOTAI is delivering execution.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241bf02-a1fd-11f1-99c8-52540021303b','PLAN_SIGNED_AGREEMENT','Signed Agreement','04_PLANNING','bf4191fb-1601-53e1-b84f-ec7a21a56d6d','PLANNING PHASE','4.4','PLANNING PHASE',4,'DOCUMENT','CONDITIONAL',1,1,1,'Executed consultancy agreement where the scope is design consultancy.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241c02a-a1fd-11f1-99c8-52540021303b','PLAN_DRAWINGS_PLAN','Drawings Plan','04_PLANNING','bf4191fb-1601-53e1-b84f-ec7a21a56d6d','PLANNING PHASE','4.5','PLANNING PHASE',5,'DOCUMENT','REQUIRED',1,1,0,'Plan against which drawing production is scheduled.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241c14f-a1fd-11f1-99c8-52540021303b','PLAN_EXECUTION_PLAN','Execution Plan','04_PLANNING','bf4191fb-1601-53e1-b84f-ec7a21a56d6d','PLANNING PHASE','4.5','PLANNING PHASE',6,'DOCUMENT','REQUIRED',1,1,0,'Execution plan for downstream delivery.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241c3b4-a1fd-11f1-99c8-52540021303b','PLAN_PROJECT_TIMELINE','Project Timeline','04_PLANNING','bf4191fb-1601-53e1-b84f-ec7a21a56d6d','PLANNING PHASE','4.5','PLANNING PHASE',7,'DOCUMENT','REQUIRED',1,1,0,'Programme against which downstream work is scheduled.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241c4d2-a1fd-11f1-99c8-52540021303b','PLAN_INITIAL_ESTIMATE','Initial Estimate','04_PLANNING','bf4191fb-1601-53e1-b84f-ec7a21a56d6d','PLANNING PHASE','4.5','PLANNING PHASE',8,'DOCUMENT','REQUIRED',1,1,0,'Opening project estimate.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241c600-a1fd-11f1-99c8-52540021303b','PLAN_STANDARD_BOQ','Standard BOQ','04_PLANNING','bf4191fb-1601-53e1-b84f-ec7a21a56d6d','PLANNING PHASE','4.5','PLANNING PHASE',9,'DOCUMENT','REQUIRED',1,1,0,'Standard BOQ prepared as part of the opening planning package.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241c730-a1fd-11f1-99c8-52540021303b','DES_CONCEPT_DESIGN_02','Concept Design 02 — 3D with Material + Furniture Layout','05_DESIGN','cb595cbe-ba42-5fc3-af81-39e798fce957','DESIGN','5.1','DESIGN',1,'DOCUMENT','REQUIRED',1,1,1,'Concept 02 incorporating materials and furniture layout.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241c842-a1fd-11f1-99c8-52540021303b','DES_DESIGN_DEVELOPMENT_01','Design Development 01','05_DESIGN','cb595cbe-ba42-5fc3-af81-39e798fce957','DESIGN','5.3','DESIGN',2,'DOCUMENT','REQUIRED',1,1,1,'Concept resolved into a workable design.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241c959-a1fd-11f1-99c8-52540021303b','DES_DESIGN_DEVELOPMENT_02','Design Development 02 — With Material','05_DESIGN','cb595cbe-ba42-5fc3-af81-39e798fce957','DESIGN','5.4','DESIGN',3,'DOCUMENT','REQUIRED',1,1,1,'Final materials pinned against the developed design.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241cb36-a1fd-11f1-99c8-52540021303b','VENDOR_SHORTLIST','Vendor Shortlist','A_VENDOR_TRADES','f5886765-a1ea-56b4-a176-0f187c0f7205','VENDOR & TRADES','A.1','VENDOR & TRADES',1,'DOCUMENT','REQUIRED',1,0,0,'Shortlist covering the contractor teams and trades.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241cc5d-a1fd-11f1-99c8-52540021303b','VENDOR_SITE_VISIT_SCHEDULE','Site Visit Schedule','A_VENDOR_TRADES','f5886765-a1ea-56b4-a176-0f187c0f7205','VENDOR & TRADES','A.2','VENDOR & TRADES',2,'DOCUMENT','REQUIRED',1,0,0,'Vendor and contractor site visit schedule assigned and aligned by Admin.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241cd95-a1fd-11f1-99c8-52540021303b','VENDOR_SITE_MEASUREMENT_SHEET','Vendor Site Measurement Sheet','A_VENDOR_TRADES','f5886765-a1ea-56b4-a176-0f187c0f7205','VENDOR & TRADES','A.2','VENDOR & TRADES',3,'DOCUMENT','REQUIRED',1,0,0,'Site measurements collected from shortlisted vendors.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241ced3-a1fd-11f1-99c8-52540021303b','VENDOR_ESTIMATE','Estimate','A_VENDOR_TRADES','f5886765-a1ea-56b4-a176-0f187c0f7205','VENDOR & TRADES','A.5','VENDOR & TRADES',4,'DOCUMENT','REQUIRED',1,1,1,'RIPPOTAI estimate; rates and quotes remain estimates until approved.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241d002-a1fd-11f1-99c8-52540021303b','VENDOR_QUOTATION','Quotation','A_VENDOR_TRADES','f5886765-a1ea-56b4-a176-0f187c0f7205','VENDOR & TRADES','A.6','VENDOR & TRADES',5,'DOCUMENT','REQUIRED',1,1,1,'Approved, priced, contractual document per trade.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241d138-a1fd-11f1-99c8-52540021303b','VENDOR_BOQ','BOQ','A_VENDOR_TRADES','f5886765-a1ea-56b4-a176-0f187c0f7205','VENDOR & TRADES','A.7','VENDOR & TRADES',6,'DOCUMENT','REQUIRED',1,1,1,'BOQ created once tender drawings are final and quotations are approved.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241d26a-a1fd-11f1-99c8-52540021303b','VENDOR_CONTRACTOR_LINEUP','Contractor Lineup','A_VENDOR_TRADES','f5886765-a1ea-56b4-a176-0f187c0f7205','VENDOR & TRADES','A.8','VENDOR & TRADES',7,'DOCUMENT','REQUIRED',1,0,1,'Confirmed contractor teams against the trades they own on site.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241d3a0-a1fd-11f1-99c8-52540021303b','MAT_MATERIAL_REQUIREMENT','Material Requirement','B_MATERIAL','35ccb713-885f-59f6-9a8f-5aad10fe48ed','MATERIAL & PROCUREMENT','B.1','MATERIAL & PROCUREMENT',1,'DOCUMENT','REQUIRED',1,0,0,'Material selections, budget, style and requirements from the design team.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241d4bc-a1fd-11f1-99c8-52540021303b','MAT_MATERIAL_RATES_SHEET','Material Rates Sheet','B_MATERIAL','35ccb713-885f-59f6-9a8f-5aad10fe48ed','MATERIAL & PROCUREMENT','B.2','MATERIAL & PROCUREMENT',2,'DOCUMENT','REQUIRED',1,1,0,'Samples, rates and availability feeding material selection.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241d5ee-a1fd-11f1-99c8-52540021303b','MAT_MATERIAL_LAYOUT_SPECIFICATION','Material Layouts and Specification','B_MATERIAL','35ccb713-885f-59f6-9a8f-5aad10fe48ed','MATERIAL & PROCUREMENT','B.3','MATERIAL & PROCUREMENT',3,'DRAWING','REQUIRED',1,1,1,'Selected materials pinned to drawings for quantification and quotation.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241d72e-a1fd-11f1-99c8-52540021303b','MAT_MATERIAL_ESTIMATE','Material Estimate','B_MATERIAL','35ccb713-885f-59f6-9a8f-5aad10fe48ed','MATERIAL & PROCUREMENT','B.4','MATERIAL & PROCUREMENT',4,'DOCUMENT','REQUIRED',1,1,1,'Material estimate before quotation approval.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241d86f-a1fd-11f1-99c8-52540021303b','MAT_MATERIAL_QUOTATION','Material Quotation','B_MATERIAL','35ccb713-885f-59f6-9a8f-5aad10fe48ed','MATERIAL & PROCUREMENT','B.4','MATERIAL & PROCUREMENT',5,'DOCUMENT','REQUIRED',1,1,1,'Approved material quotation.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241d9bb-a1fd-11f1-99c8-52540021303b','MAT_PURCHASE_ORDERS','Purchase Orders','B_MATERIAL','35ccb713-885f-59f6-9a8f-5aad10fe48ed','MATERIAL & PROCUREMENT','B.5','MATERIAL & PROCUREMENT',6,'DOCUMENT','REQUIRED',1,1,1,'Approved materials purchased and scheduled against site stages.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241daeb-a1fd-11f1-99c8-52540021303b','MAT_DELIVERY_CHALLANS','Delivery Challans','B_MATERIAL','35ccb713-885f-59f6-9a8f-5aad10fe48ed','MATERIAL & PROCUREMENT','B.6','MATERIAL & PROCUREMENT',7,'DOCUMENT','REQUIRED',1,0,0,'Stage-wise material delivery records.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241dc1b-a1fd-11f1-99c8-52540021303b','MAT_SITE_INVENTORY_REGISTER','Site Inventory Register','B_MATERIAL','35ccb713-885f-59f6-9a8f-5aad10fe48ed','MATERIAL & PROCUREMENT','B.7','MATERIAL & PROCUREMENT',8,'DOCUMENT','REQUIRED',1,0,0,'Site material inventory register reconciled against purchase orders.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241dd50-a1fd-11f1-99c8-52540021303b','TENDER_BUILDING_LAYOUT','Tender — Building Layout','06_TENDER','2a0de81d-a43a-5fb5-96ba-94257a9bc75e','TENDER DRAWINGS','6.1','TENDER DRAWINGS',1,'DRAWING','REQUIRED',1,1,1,'Floor layout; demolition layout is included where needed.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241dea1-a1fd-11f1-99c8-52540021303b','TENDER_DEMOLITION_LAYOUT','Tender — Demolition Layout','06_TENDER','2a0de81d-a43a-5fb5-96ba-94257a9bc75e','TENDER DRAWINGS','6.1','TENDER DRAWINGS',2,'DRAWING','CONDITIONAL',1,1,1,'Demolition layout where demolition scope exists.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241e081-a1fd-11f1-99c8-52540021303b','TENDER_SECTION_ELEVATION','Tender — Section & Elevation','06_TENDER','2a0de81d-a43a-5fb5-96ba-94257a9bc75e','TENDER DRAWINGS','6.2','TENDER DRAWINGS',3,'DRAWING','REQUIRED',1,1,1,'Building sections and elevations for vendor pricing.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241e208-a1fd-11f1-99c8-52540021303b','TENDER_CIVIL_LAYOUT','Tender — Civil Layout','06_TENDER','2a0de81d-a43a-5fb5-96ba-94257a9bc75e','TENDER DRAWINGS','6.3','TENDER DRAWINGS',4,'DRAWING','REQUIRED',1,1,1,'Civil layout for tender pricing.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241e393-a1fd-11f1-99c8-52540021303b','TENDER_ELECTRICAL_LAYOUT','Tender — Electrical','06_TENDER','2a0de81d-a43a-5fb5-96ba-94257a9bc75e','TENDER DRAWINGS','6.4','TENDER DRAWINGS',5,'DRAWING','REQUIRED',1,1,1,'Electrical layout for tender pricing.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241e535-a1fd-11f1-99c8-52540021303b','TENDER_PLUMBING_LAYOUT','Tender — Plumbing','06_TENDER','2a0de81d-a43a-5fb5-96ba-94257a9bc75e','TENDER DRAWINGS','6.5','TENDER DRAWINGS',6,'DRAWING','REQUIRED',1,1,1,'Plumbing layout for tender pricing.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241e67e-a1fd-11f1-99c8-52540021303b','TENDER_HVAC_LAYOUT','Tender — HVAC','06_TENDER','2a0de81d-a43a-5fb5-96ba-94257a9bc75e','TENDER DRAWINGS','6.6','TENDER DRAWINGS',7,'DRAWING','REQUIRED',1,1,1,'AC / HVAC layout for tender pricing.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241e7c5-a1fd-11f1-99c8-52540021303b','TENDER_TYPICAL_DETAILS','Tender — Typical Details','06_TENDER','2a0de81d-a43a-5fb5-96ba-94257a9bc75e','TENDER DRAWINGS','6.7','TENDER DRAWINGS',8,'DRAWING','CONDITIONAL',1,1,1,'Metal structure or interior elements that need pricing.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241e927-a1fd-11f1-99c8-52540021303b','TENDER_LANDSCAPING','Tender — Landscaping','06_TENDER','2a0de81d-a43a-5fb5-96ba-94257a9bc75e','TENDER DRAWINGS','6.8','TENDER DRAWINGS',9,'DRAWING','CONDITIONAL',1,1,1,'Landscape drawing where the project has external scope.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241ea77-a1fd-11f1-99c8-52540021303b','WORK_DEMOLITION_DETAILS','Demolition Details','07_WORKING','3a44a34e-db2f-5793-9bbd-dde8d2365828','WORKING DRAWINGS','7.1','WORKING DRAWINGS',1,'DRAWING','CONDITIONAL',1,1,1,'Construction detailing for demolition work.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241ebac-a1fd-11f1-99c8-52540021303b','WORK_CIVIL_DETAILS','Civil Details','07_WORKING','3a44a34e-db2f-5793-9bbd-dde8d2365828','WORKING DRAWINGS','7.2','WORKING DRAWINGS',2,'DRAWING','REQUIRED',1,1,1,'Civil detailing for execution.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241ece8-a1fd-11f1-99c8-52540021303b','WORK_STRUCTURE_LAYOUT','Structure Layout','07_WORKING','3a44a34e-db2f-5793-9bbd-dde8d2365828','WORKING DRAWINGS','7.2','WORKING DRAWINGS',3,'DRAWING','REQUIRED',1,1,1,'Structure layout for execution.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241ee2b-a1fd-11f1-99c8-52540021303b','WORK_DOOR_WINDOW_SCHEDULE','Door & Window Schedule','07_WORKING','3a44a34e-db2f-5793-9bbd-dde8d2365828','WORKING DRAWINGS','7.3','WORKING DRAWINGS',4,'DRAWING','REQUIRED',1,1,1,'Door and window schedule for Glass & Window.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241ef8c-a1fd-11f1-99c8-52540021303b','WORK_STONE_JAMB_DETAILS','Stone Jamb Details','07_WORKING','3a44a34e-db2f-5793-9bbd-dde8d2365828','WORKING DRAWINGS','7.3','WORKING DRAWINGS',5,'DRAWING','CONDITIONAL',1,1,1,'Stone jamb details where applicable.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241f192-a1fd-11f1-99c8-52540021303b','WORK_FLOORING_LAYOUT','Flooring Layout','07_WORKING','3a44a34e-db2f-5793-9bbd-dde8d2365828','WORKING DRAWINGS','7.4','WORKING DRAWINGS',6,'DRAWING','REQUIRED',1,1,1,'Floor layout for execution.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241f2ef-a1fd-11f1-99c8-52540021303b','WORK_FLOORING_DETAILS','Flooring Details','07_WORKING','3a44a34e-db2f-5793-9bbd-dde8d2365828','WORKING DRAWINGS','7.4','WORKING DRAWINGS',7,'DRAWING','REQUIRED',1,1,1,'Flooring construction details.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241f42d-a1fd-11f1-99c8-52540021303b','WORK_BATHROOM_DETAILS','Bathroom Details','07_WORKING','3a44a34e-db2f-5793-9bbd-dde8d2365828','WORKING DRAWINGS','7.4','WORKING DRAWINGS',8,'DRAWING','REQUIRED',1,1,1,'Bathroom construction details.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241f562-a1fd-11f1-99c8-52540021303b','WORK_CEILING_LAYOUT','Ceiling Layout','07_WORKING','3a44a34e-db2f-5793-9bbd-dde8d2365828','WORKING DRAWINGS','7.5','WORKING DRAWINGS',9,'DRAWING','REQUIRED',1,1,1,'Ceiling layout for False Ceiling / POP.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241f6a5-a1fd-11f1-99c8-52540021303b','WORK_CEILING_DETAILS','Ceiling Details','07_WORKING','3a44a34e-db2f-5793-9bbd-dde8d2365828','WORKING DRAWINGS','7.5','WORKING DRAWINGS',10,'DRAWING','REQUIRED',1,1,1,'Ceiling detailing.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241f7c0-a1fd-11f1-99c8-52540021303b','WORK_WALL_ELEVATIONS','Wall Elevations','07_WORKING','3a44a34e-db2f-5793-9bbd-dde8d2365828','WORKING DRAWINGS','7.6','WORKING DRAWINGS',11,'DRAWING','REQUIRED',1,1,1,'Wall elevations for Mill Work and Painting.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241f8e3-a1fd-11f1-99c8-52540021303b','MOD_KITCHEN_DETAILS','Kitchen Details','07_WORKING','3a44a34e-db2f-5793-9bbd-dde8d2365828','WORKING DRAWINGS','7.7','MODULAR',12,'DRAWING','CONDITIONAL',1,1,1,'Kitchen details where kitchen is included in project scope.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241fa0f-a1fd-11f1-99c8-52540021303b','MOD_TV_UNIT_DETAILS','TV Unit Details','07_WORKING','3a44a34e-db2f-5793-9bbd-dde8d2365828','WORKING DRAWINGS','7.8','MODULAR',13,'DRAWING','CONDITIONAL',1,1,1,'TV unit details where included in scope.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241fb34-a1fd-11f1-99c8-52540021303b','MOD_WARDROBE_STORAGE_DETAILS','Wardrobe & Storage Details','07_WORKING','3a44a34e-db2f-5793-9bbd-dde8d2365828','WORKING DRAWINGS','7.9','MODULAR',14,'DRAWING','CONDITIONAL',1,1,1,'Wardrobe, storage, crockery and bar unit details as required by scope.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241fc52-a1fd-11f1-99c8-52540021303b','MOD_BED_BACK_DETAILS','Bed Back Details','07_WORKING','3a44a34e-db2f-5793-9bbd-dde8d2365828','WORKING DRAWINGS','7.10','MODULAR',15,'DRAWING','CONDITIONAL',1,1,1,'Bed back details where included in scope.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241fd85-a1fd-11f1-99c8-52540021303b','MOD_WALL_PANELING_DETAILS','Wall Panelling Details','07_WORKING','3a44a34e-db2f-5793-9bbd-dde8d2365828','WORKING DRAWINGS','7.11','MODULAR',16,'DRAWING','CONDITIONAL',1,1,1,'Additional wall panelling details where included in scope.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2241fec7-a1fd-11f1-99c8-52540021303b','WORK_LANDSCAPE_DETAILS','Landscape Details','07_WORKING','3a44a34e-db2f-5793-9bbd-dde8d2365828','WORKING DRAWINGS','7.12','WORKING DRAWINGS',17,'DRAWING','CONDITIONAL',1,1,1,'Detailed landscaping where the project carries external scope.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('22420012-a1fd-11f1-99c8-52540021303b','EXEC_FINAL_BOQ','Final BOQ','08_EXECUTION','5cec1504-2f7a-5667-832f-4a96b85e8d44','EXECUTION','8.0','EXECUTION',1,'DOCUMENT','REQUIRED',1,1,1,'Final BOQ owned by Accounts & Finance and created with the quotations.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('22420854-a1fd-11f1-99c8-52540021303b','EXEC_QC_CHECKLIST_TEMPLATE','QC Checklist Template','08_EXECUTION','5cec1504-2f7a-5667-832f-4a96b85e8d44','EXECUTION','QC','QUALITY CHECK',2,'DOCUMENT','REQUIRED',1,1,0,'Standard checklist template used throughout execution.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('224209eb-a1fd-11f1-99c8-52540021303b','EXEC_PHASE_QC_SIGNOFF','Phase QC Sign-off','08_EXECUTION','5cec1504-2f7a-5667-832f-4a96b85e8d44','EXECUTION','QC','QUALITY CHECK',3,'DOCUMENT','REQUIRED',1,0,1,'Phase-level quality sign-off before the next trade starts.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('22420b64-a1fd-11f1-99c8-52540021303b','EXEC_WATERPROOFING_WARRANTY','Waterproofing Warranty','08_EXECUTION','5cec1504-2f7a-5667-832f-4a96b85e8d44','EXECUTION','5.7','CIVIL WORK',4,'DOCUMENT','CONDITIONAL',1,0,1,'Waterproofing warranty and sign-off.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('22420ce3-a1fd-11f1-99c8-52540021303b','EXEC_TERMITE_TREATMENT_CERTIFICATE','Termite Treatment Certificate','08_EXECUTION','5cec1504-2f7a-5667-832f-4a96b85e8d44','EXECUTION','5.8','CIVIL WORK',5,'DOCUMENT','CONDITIONAL',1,0,1,'Certificate for termite treatment.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('22420e2c-a1fd-11f1-99c8-52540021303b','EXEC_ARCHITECT_SITE_VISIT_SCHEDULE','Architect Site Visit Schedule','08_EXECUTION','5cec1504-2f7a-5667-832f-4a96b85e8d44','EXECUTION','8.1','CONTINUOUS',6,'DOCUMENT','REQUIRED',1,0,0,'Fixed architect site visit schedule generated at execution start.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('22423237-a1fd-11f1-99c8-52540021303b','EXEC_SITE_VISIT_LOG','Site Visit Log','08_EXECUTION','5cec1504-2f7a-5667-832f-4a96b85e8d44','EXECUTION','8.1','CONTINUOUS',7,'DOCUMENT','REQUIRED',1,0,0,'Site visit records for Supervisor and Architect.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('22423420-a1fd-11f1-99c8-52540021303b','EXEC_DAILY_PROGRESS_REPORT','Daily Progress Report','08_EXECUTION','5cec1504-2f7a-5667-832f-4a96b85e8d44','EXECUTION','8.2','CONTINUOUS',8,'DOCUMENT','REQUIRED',1,0,0,'Daily site report issued to the whole team.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('22423583-a1fd-11f1-99c8-52540021303b','EXEC_SITE_MOCKUP_PROCESS_GUIDE','Site Mockup Process Guide','08_EXECUTION','5cec1504-2f7a-5667-832f-4a96b85e8d44','EXECUTION','8.3','CONTINUOUS',9,'DOCUMENT','CONDITIONAL',1,0,0,'Process guide for finishes and details proven at full size before volume production.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('224236ba-a1fd-11f1-99c8-52540021303b','EXEC_DESIGN_CLARIFICATION','Design Clarification','08_EXECUTION','5cec1504-2f7a-5667-832f-4a96b85e8d44','EXECUTION','8.4','CONTINUOUS',10,'DOCUMENT','CONDITIONAL',1,1,1,'Design decisions and site clarifications recorded during execution.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2242380e-a1fd-11f1-99c8-52540021303b','EXEC_CIVIL_QUALITY_CHECKLIST','Civil Quality Checklist','08_EXECUTION','5cec1504-2f7a-5667-832f-4a96b85e8d44','EXECUTION','5','CIVIL WORK',11,'DOCUMENT','REQUIRED',1,0,1,'Quality checklist covering civil work.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('2242395a-a1fd-11f1-99c8-52540021303b','EXEC_FINISHING_QUALITY_CHECKLIST','Finishing Quality Checklist','08_EXECUTION','5cec1504-2f7a-5667-832f-4a96b85e8d44','EXECUTION','14','FINISHING',12,'DOCUMENT','REQUIRED',1,0,1,'Quality checklist covering finishing work.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('22423a8c-a1fd-11f1-99c8-52540021303b','EXEC_ELECTRICAL_COMPLETION_CERTIFICATE','Electrical Completion Certificate','08_EXECUTION','5cec1504-2f7a-5667-832f-4a96b85e8d44','EXECUTION','14.6','FINISHING',13,'DOCUMENT','REQUIRED',1,0,1,'Electrical completion certificate.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('22423bb3-a1fd-11f1-99c8-52540021303b','HANDOVER_SNAG_LIST','Snag List','09_HANDOVER','46eb9f32-06c1-5d8f-b486-0730f4d7a0cb','SNAG & HANDOVER','9.1','SNAG & HANDOVER',1,'DOCUMENT','REQUIRED',1,1,1,'Trade-by-trade snag list and rectification record.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('22423cc2-a1fd-11f1-99c8-52540021303b','HANDOVER_COMPLETION_CERTIFICATE','Completion Certificate','09_HANDOVER','46eb9f32-06c1-5d8f-b486-0730f4d7a0cb','SNAG & HANDOVER','9.3','SNAG & HANDOVER',2,'DOCUMENT','REQUIRED',1,1,1,'Final client walkthrough and completion sign-off.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('22423de6-a1fd-11f1-99c8-52540021303b','HANDOVER_WARRANTY_PACK','Warranty Pack','09_HANDOVER','46eb9f32-06c1-5d8f-b486-0730f4d7a0cb','SNAG & HANDOVER','9.4','SNAG & HANDOVER',3,'DOCUMENT','REQUIRED',1,0,0,'Consolidated warranties handed over to the client.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('22424072-a1fd-11f1-99c8-52540021303b','HANDOVER_AS_BUILT_DRAWING_SET','As-Built Drawing Set','09_HANDOVER','46eb9f32-06c1-5d8f-b486-0730f4d7a0cb','SNAG & HANDOVER','9.4','SNAG & HANDOVER',4,'DRAWING','REQUIRED',1,1,1,'Final as-built drawing set.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('224241d3-a1fd-11f1-99c8-52540021303b','HANDOVER_CARE_MAINTENANCE_NOTES','Care & Maintenance Notes','09_HANDOVER','46eb9f32-06c1-5d8f-b486-0730f4d7a0cb','SNAG & HANDOVER','9.4','SNAG & HANDOVER',5,'DOCUMENT','REQUIRED',1,0,0,'Care and maintenance notes handed over to the client.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('224242ea-a1fd-11f1-99c8-52540021303b','HANDOVER_CONSOLIDATED_BILLS','Consolidated Bills','09_HANDOVER','46eb9f32-06c1-5d8f-b486-0730f4d7a0cb','SNAG & HANDOVER','9.4','SNAG & HANDOVER',6,'DOCUMENT','REQUIRED',1,0,1,'Commercial close-out document consolidating project bills.',1,'2026-08-27 15:23:19','2026-09-14 16:34:49'),
('67bb4e98-bd50-11f1-a7ce-52540021303b','CLIENT_GUIDE','Client Guide','PRE_DESIGN',NULL,'Pre Design',NULL,NULL,10,'DOCUMENT','REQUIRED',0,0,0,'Client guide containing project information, process overview, expectations and required client inputs.',1,'2026-10-01 09:57:26','2026-10-01 09:57:26'),
('67c5e546-bd50-11f1-a7ce-52540021303b','PITCH_DECK','Pitch Deck','PRE_DESIGN',NULL,'Pre Design',NULL,NULL,20,'DOCUMENT','REQUIRED',0,0,0,'Project pitch deck presenting the design approach, project vision, scope and key proposal information.',1,'2026-10-01 09:57:26','2026-10-01 09:57:26'),
('67cf7e01-bd50-11f1-a7ce-52540021303b','AGREEMENT_CONSULTANCY','Agreement - Consultancy','PRE_DESIGN',NULL,'Pre Design',NULL,NULL,30,'DOCUMENT','REQUIRED',0,1,1,'Consultancy agreement defining the services, responsibilities, commercial terms and deliverables.',1,'2026-10-01 09:57:26','2026-10-01 09:57:26'),
('67d920ab-bd50-11f1-a7ce-52540021303b','CONTRACT_EXECUTION','Contract - Execution','PRE_DESIGN',NULL,'Pre Design',NULL,NULL,40,'DOCUMENT','REQUIRED',0,1,1,'Execution contract defining the agreed scope, commercial terms, responsibilities and execution conditions.',1,'2026-10-01 09:57:26','2026-10-01 09:57:26'),
('67e2a9fc-bd50-11f1-a7ce-52540021303b','MATERIAL_PALETTE','Material Palette','PRE_DESIGN',NULL,'Pre Design',NULL,NULL,50,'DOCUMENT','REQUIRED',0,1,1,'Material palette documenting selected materials, finishes, colours, textures and related specifications.',1,'2026-10-01 09:57:26','2026-10-01 09:57:26');
/*!40000 ALTER TABLE `document_types` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `document_versions`
--

DROP TABLE IF EXISTS `document_versions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_versions` (
  `id` char(36) NOT NULL,
  `document_id` char(36) NOT NULL,
  `version` varchar(50) NOT NULL,
  `filename` varchar(255) DEFAULT NULL,
  `storage_filename` varchar(255) DEFAULT NULL,
  `url` varchar(1000) DEFAULT NULL,
  `mime` varchar(255) DEFAULT NULL,
  `size` bigint(20) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'draft',
  `remarks` text DEFAULT NULL,
  `uploaded_by` char(36) DEFAULT NULL,
  `uploaded_by_name` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uq_document_version` (`document_id`,`version`) USING BTREE,
  KEY `idx_document_versions_document` (`document_id`) USING BTREE,
  CONSTRAINT `fk_document_versions_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_versions`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `document_versions` WRITE;
/*!40000 ALTER TABLE `document_versions` DISABLE KEYS */;
/*!40000 ALTER TABLE `document_versions` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `documents` (
  `id` char(36) NOT NULL,
  `project_id` char(36) DEFAULT NULL,
  `document_type_id` char(36) DEFAULT NULL,
  `requirement_id` char(36) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `filename` varchar(255) DEFAULT NULL,
  `storage_filename` varchar(255) DEFAULT NULL,
  `url` varchar(1000) DEFAULT NULL,
  `mime` varchar(255) DEFAULT NULL,
  `size` bigint(20) DEFAULT NULL,
  `version` varchar(50) DEFAULT 'V1',
  `status` varchar(50) DEFAULT 'draft',
  `visibility` varchar(50) DEFAULT 'internal',
  `remarks` text DEFAULT NULL,
  `is_locked` tinyint(1) NOT NULL DEFAULT 0,
  `locked_by` char(36) DEFAULT NULL,
  `locked_at` datetime DEFAULT NULL,
  `uploaded_by` char(36) DEFAULT NULL,
  `uploaded_by_name` varchar(255) DEFAULT NULL,
  `document_date` date DEFAULT NULL,
  `doc_type` varchar(50) DEFAULT 'upload',
  `doc_no` varchar(255) DEFAULT NULL,
  `sections` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`sections`)),
  `source_app` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_documents_project` (`project_id`) USING BTREE,
  KEY `idx_documents_type` (`document_type_id`) USING BTREE,
  KEY `idx_documents_requirement` (`requirement_id`) USING BTREE,
  KEY `idx_documents_status` (`status`) USING BTREE,
  CONSTRAINT `fk_documents_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_documents_requirement` FOREIGN KEY (`requirement_id`) REFERENCES `document_requirements` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_documents_type` FOREIGN KEY (`document_type_id`) REFERENCES `document_types` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `drawing_revisions`
--

DROP TABLE IF EXISTS `drawing_revisions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `drawing_revisions` (
  `id` char(36) NOT NULL,
  `drawing_id` char(36) NOT NULL,
  `revision` varchar(50) NOT NULL,
  `issue_date` date DEFAULT NULL,
  `issue_purpose` varchar(255) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Draft',
  `filename` varchar(255) DEFAULT NULL,
  `storage_filename` varchar(255) DEFAULT NULL,
  `url` varchar(1000) DEFAULT NULL,
  `mime` varchar(255) DEFAULT NULL,
  `size` bigint(20) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `uploaded_by` char(36) DEFAULT NULL,
  `uploaded_by_name` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uq_drawing_revision` (`drawing_id`,`revision`) USING BTREE,
  KEY `idx_drawing_revisions_drawing` (`drawing_id`) USING BTREE,
  KEY `idx_drawing_revisions_status` (`status`) USING BTREE,
  CONSTRAINT `fk_drawing_revisions_drawing` FOREIGN KEY (`drawing_id`) REFERENCES `drawings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `drawing_revisions`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `drawing_revisions` WRITE;
/*!40000 ALTER TABLE `drawing_revisions` DISABLE KEYS */;
/*!40000 ALTER TABLE `drawing_revisions` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `drawings`
--

DROP TABLE IF EXISTS `drawings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `drawings` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `document_type_id` char(36) DEFAULT NULL,
  `requirement_id` char(36) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `drawing_number` varchar(255) NOT NULL,
  `phase_code` varchar(50) DEFAULT NULL,
  `discipline` varchar(255) DEFAULT NULL,
  `sheet_number` varchar(100) DEFAULT NULL,
  `sheet_size` varchar(20) DEFAULT NULL,
  `scale` varchar(100) DEFAULT NULL,
  `issue_purpose` varchar(255) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Draft',
  `remarks` text DEFAULT NULL,
  `sequence` int(11) DEFAULT NULL,
  `drawn_by` char(36) DEFAULT NULL,
  `checked_by` char(36) DEFAULT NULL,
  `approved_by` char(36) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uq_project_drawing_number` (`project_id`,`drawing_number`) USING BTREE,
  KEY `idx_drawings_project` (`project_id`) USING BTREE,
  KEY `idx_drawings_type` (`document_type_id`) USING BTREE,
  KEY `idx_drawings_requirement` (`requirement_id`) USING BTREE,
  KEY `idx_drawings_phase` (`phase_code`) USING BTREE,
  KEY `idx_drawings_discipline` (`discipline`) USING BTREE,
  KEY `idx_drawings_status` (`status`) USING BTREE,
  CONSTRAINT `fk_drawings_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_drawings_requirement` FOREIGN KEY (`requirement_id`) REFERENCES `document_requirements` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_drawings_type` FOREIGN KEY (`document_type_id`) REFERENCES `document_types` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `drawings`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `drawings` WRITE;
/*!40000 ALTER TABLE `drawings` DISABLE KEYS */;
/*!40000 ALTER TABLE `drawings` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `gate_conditions`
--

DROP TABLE IF EXISTS `gate_conditions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `gate_conditions` (
  `id` char(36) NOT NULL,
  `gate_definition_id` char(36) NOT NULL,
  `type` varchar(60) NOT NULL,
  `label` varchar(255) NOT NULL,
  `params` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`params`)),
  `optional` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `gate_definition_id` (`gate_definition_id`),
  CONSTRAINT `gate_conditions_ibfk_1` FOREIGN KEY (`gate_definition_id`) REFERENCES `gate_definitions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gate_conditions`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `gate_conditions` WRITE;
/*!40000 ALTER TABLE `gate_conditions` DISABLE KEYS */;
INSERT INTO `gate_conditions` VALUES
('116656ab-02f8-5af6-b922-942727fb558a','0e3a8b35-ed25-5a29-9ccf-6204c317be5e','DOCUMENT_APPROVED','Approved: PRE_PROPOSED_LAYOUT','{\"documentTypeCode\": \"PRE_PROPOSED_LAYOUT\"}',0,3,'2026-09-12 10:14:54','2026-09-12 10:14:54'),
('1b08506d-1c13-5807-b032-9919742bc98f','08a47294-c9f0-5dd7-ad84-ab8e66c20eec','DOCUMENT_APPROVED','Approved: VENDOR_ESTIMATE','{\"documentTypeCode\": \"VENDOR_ESTIMATE\"}',0,13,'2026-09-12 10:14:54','2026-09-12 10:14:54'),
('1be7431b-330e-54d9-86c0-1eaee109a98c','50c9cb7c-ea87-5ee9-abcd-c3d01730429d','DOCUMENT_TYPE_ALL_APPROVED','Required evidence: 07_WORKING','{\"phaseCode\": \"07_WORKING\"}',0,18,'2026-09-12 10:14:55','2026-09-12 10:14:55'),
('1e73a648-898b-52e9-b019-a5e9db820117','7be85e9f-1869-5cd4-b672-d5ddb4d8e80a','DOCUMENT_APPROVED','Approved: PLAN_SIGNED_AGREEMENT','{\"documentTypeCode\": \"PLAN_SIGNED_AGREEMENT\"}',1,6,'2026-09-12 10:14:54','2026-09-12 10:14:54'),
('31d7941b-8b5e-5c60-b0b7-5b8de2e138ef','08a47294-c9f0-5dd7-ad84-ab8e66c20eec','DOCUMENT_APPROVED','Approved: VENDOR_QUOTATION','{\"documentTypeCode\": \"VENDOR_QUOTATION\"}',0,14,'2026-09-12 10:14:54','2026-09-12 10:14:54'),
('36682058-bbad-5621-9813-b293a71d896f','f53ef67d-685f-539f-94b2-d6db327247d0','DOCUMENT_TYPE_ALL_APPROVED','Required evidence: 06_TENDER','{\"phaseCode\": \"06_TENDER\"}',0,12,'2026-09-12 10:14:54','2026-09-12 10:14:54'),
('530aa162-4730-5298-8968-6f7386fee492','7be85e9f-1869-5cd4-b672-d5ddb4d8e80a','DOCUMENT_APPROVED','Approved: PLAN_SIGNED_CONTRACT','{\"documentTypeCode\": \"PLAN_SIGNED_CONTRACT\"}',1,7,'2026-09-12 10:14:54','2026-09-12 10:14:54'),
('73e53e3d-b670-5b49-9bc5-2a6902da37df','b85b6507-d68c-5336-bfdf-cb085ec1ce87','MANUAL_APPROVAL','Client final walkthrough and sign-off','{}',0,22,'2026-09-12 10:14:55','2026-09-12 10:14:55'),
('74db003a-b872-5146-9ab0-66561ad77b3d','b85b6507-d68c-5336-bfdf-cb085ec1ce87','DOCUMENT_TYPE_ALL_APPROVED','Required evidence: 09_HANDOVER','{\"phaseCode\": \"09_HANDOVER\"}',0,20,'2026-09-12 10:14:55','2026-09-12 10:14:55'),
('7e53e605-3294-50b2-ab46-4edf3f4c7204','b934edeb-4f36-5826-bf19-8eb6dec21014','PAYMENT_MILESTONE_PAID','Paid milestone: TOKEN','{\"milestoneCode\": \"TOKEN\"}',0,8,'2026-09-12 10:14:54','2026-09-12 10:14:54'),
('7eef8f79-df71-5f3b-8ccc-4c6a02bdbf1e','74c20532-c9f0-57e9-bc47-85b3ed2f6d48','DOCUMENT_TYPE_ALL_APPROVED','Required evidence: 05_DESIGN','{\"phaseCode\": \"05_DESIGN\"}',0,11,'2026-09-12 10:14:54','2026-09-12 10:14:54'),
('81afde0c-189b-5fd2-aeb9-5422de440e0c','0e3a8b35-ed25-5a29-9ccf-6204c317be5e','DOCUMENT_TYPE_ALL_APPROVED','Required evidence: 02_RECCE','{\"phaseCode\": \"02_RECCE\"}',0,2,'2026-09-12 10:14:53','2026-09-12 10:14:53'),
('8c7cc877-c26a-56a8-9eb4-e211d83a8392','05fe5ae3-24f7-59a6-b561-cbb61c8425a2','DOCUMENT_APPROVED','Approved: WORK_CIVIL_DETAILS','{\"documentTypeCode\": \"WORK_CIVIL_DETAILS\"}',0,16,'2026-09-12 10:14:54','2026-09-12 10:14:54'),
('959dc2bd-b0bf-5b92-9f3c-500a7f095e02','c3bbdf55-3269-5039-98ad-1968bdbfa15a','DOCUMENT_APPROVED','Approved: DES_CONCEPT_DESIGN_02','{\"documentTypeCode\": \"DES_CONCEPT_DESIGN_02\"}',0,10,'2026-09-12 10:14:54','2026-09-12 10:14:54'),
('a54aceb6-11a9-5508-ae3e-2ccf46947711','b85b6507-d68c-5336-bfdf-cb085ec1ce87','DOCUMENT_TYPE_ALL_APPROVED','Required evidence: 08_EXECUTION','{\"phaseCode\": \"08_EXECUTION\"}',0,19,'2026-09-12 10:14:55','2026-09-12 10:14:55'),
('b8620468-0227-5bde-a8a0-bc92f3475712','6e013338-2fd4-5706-aa2a-d5e4f972405b','DOCUMENT_TYPE_ALL_APPROVED','Required evidence: 03_PRE_DESIGN','{\"phaseCode\": \"03_PRE_DESIGN\"}',0,4,'2026-09-12 10:14:54','2026-09-12 10:14:54'),
('d45aef83-bf27-5485-b96a-11ce554a3355','1916686c-758c-5edb-b543-1364cd87dc1c','PAYMENT_MILESTONE_PAID','Paid milestone: PHASE_01','{\"milestoneCode\": \"PHASE_01\"}',0,9,'2026-09-12 10:14:54','2026-09-12 10:14:54'),
('d4b7e257-d7af-54d2-a844-239d8af01cf8','7be85e9f-1869-5cd4-b672-d5ddb4d8e80a','DOCUMENT_TYPE_ALL_APPROVED','Required evidence: 04_PLANNING','{\"phaseCode\": \"04_PLANNING\"}',0,5,'2026-09-12 10:14:54','2026-09-12 10:14:54'),
('d5d6e70c-d618-5425-8062-e6a41a3c3ccc','05fe5ae3-24f7-59a6-b561-cbb61c8425a2','DOCUMENT_APPROVED','Approved: WORK_STRUCTURE_LAYOUT','{\"documentTypeCode\": \"WORK_STRUCTURE_LAYOUT\"}',0,17,'2026-09-12 10:14:55','2026-09-12 10:14:55'),
('e4a0d681-3301-516a-8ea1-fc1ed355848d','05fe5ae3-24f7-59a6-b561-cbb61c8425a2','DOCUMENT_TYPE_ALL_APPROVED','Required evidence: A_VENDOR_TRADES','{\"phaseCode\": \"A_VENDOR_TRADES\"}',0,15,'2026-09-12 10:14:54','2026-09-12 10:14:54'),
('f7b3dda4-bade-574f-988b-55444a16311e','b85b6507-d68c-5336-bfdf-cb085ec1ce87','DOCUMENT_TYPE_ALL_APPROVED','Required evidence: B_MATERIAL','{\"phaseCode\": \"B_MATERIAL\"}',0,21,'2026-09-12 10:14:55','2026-09-12 10:14:55'),
('fe555a82-ef14-5971-895f-315fcbb9d8a0','0e3a8b35-ed25-5a29-9ccf-6204c317be5e','DOCUMENT_TYPE_ALL_APPROVED','Required evidence: 01_BRIEF','{\"phaseCode\": \"01_BRIEF\"}',0,1,'2026-09-12 10:14:53','2026-09-12 10:14:53');
/*!40000 ALTER TABLE `gate_conditions` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `gate_definitions`
--

DROP TABLE IF EXISTS `gate_definitions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `gate_definitions` (
  `id` char(36) NOT NULL,
  `code` varchar(60) NOT NULL,
  `name` varchar(150) DEFAULT NULL,
  `sequence_order` int(11) NOT NULL,
  `trigger_condition` varchar(255) DEFAULT NULL,
  `handoff_between` varchar(255) DEFAULT NULL,
  `progress_threshold_pct` decimal(5,2) DEFAULT NULL,
  `opens_phase_id` char(36) DEFAULT NULL,
  `allows_override` tinyint(1) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `phase_code` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uq_gate_definitions_code` (`code`) USING BTREE,
  UNIQUE KEY `uq_gate_definitions_sequence_order` (`sequence_order`) USING BTREE,
  KEY `idx_gate_definitions_opens_phase_id` (`opens_phase_id`) USING BTREE,
  CONSTRAINT `fk_gate_definitions_opens_phase` FOREIGN KEY (`opens_phase_id`) REFERENCES `gate_phase_definitions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gate_definitions`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `gate_definitions` WRITE;
/*!40000 ALTER TABLE `gate_definitions` DISABLE KEYS */;
INSERT INTO `gate_definitions` VALUES
('05fe5ae3-24f7-59a6-b561-cbb61c8425a2','CONTRACTOR_LINEUP_HANDOFF','CONTRACTOR LINEUP HANDOFF',10,NULL,NULL,0.00,'226e8d00-7ad3-51d4-8275-6545b955b4ca',0,1,'2026-09-12 10:14:53','2026-09-12 10:14:53','A_VENDOR_TRADES'),
('08a47294-c9f0-5dd7-ad84-ab8e66c20eec','ESTIMATE_APPROVED','ESTIMATE APPROVED',9,NULL,NULL,0.00,NULL,0,1,'2026-09-12 10:14:53','2026-09-12 10:14:53','A_VENDOR_TRADES'),
('0e3a8b35-ed25-5a29-9ccf-6204c317be5e','LAYOUT_FINALISED','LAYOUT FINALISED',1,NULL,NULL,0.00,'4933e9ea-1801-5dbf-b5a2-77c130faae83',0,1,'2026-09-12 10:14:53','2026-09-12 10:14:53','03_PRE_DESIGN'),
('1916686c-758c-5edb-b543-1364cd87dc1c','PAYMENT_PHASE_01','PAYMENT PHASE 01',7,NULL,NULL,0.00,'decfc696-08b4-5d84-8a18-9ea425263cf1',0,1,'2026-09-12 10:14:53','2026-09-12 10:14:53','05_DESIGN'),
('50c9cb7c-ea87-5ee9-abcd-c3d01730429d','WORKING_DRAWINGS_GFC','WORKING DRAWINGS GFC',11,NULL,NULL,0.00,NULL,0,1,'2026-09-12 10:14:53','2026-09-12 10:14:53','07_WORKING'),
('6e013338-2fd4-5706-aa2a-d5e4f972405b','CLIENT_SIGNOFF_PITCH_CONCEPT01','CLIENT SIGNOFF PITCH CONCEPT01',2,NULL,NULL,0.00,'70dd9bc6-e4b9-5d56-8fcf-ca706e09aee3',0,1,'2026-09-12 10:14:53','2026-09-12 10:14:53','03_PRE_DESIGN'),
('74c20532-c9f0-57e9-bc47-85b3ed2f6d48','DESIGN_CLOSED','DESIGN CLOSED',6,NULL,NULL,0.00,NULL,0,1,'2026-09-12 10:14:53','2026-09-12 10:14:53','05_DESIGN'),
('7be85e9f-1869-5cd4-b672-d5ddb4d8e80a','PROJECT_MOBILISED','PROJECT MOBILISED',4,NULL,NULL,0.00,'ebfbb363-f883-5708-87bc-a8964ae3bc59',0,1,'2026-09-12 10:14:53','2026-09-12 10:14:53','04_PLANNING'),
('b85b6507-d68c-5336-bfdf-cb085ec1ce87','FINAL_CLIENT_SIGNOFF','FINAL CLIENT SIGNOFF',12,NULL,NULL,100.00,NULL,0,1,'2026-09-12 10:14:53','2026-09-12 10:14:53','09_HANDOVER'),
('b934edeb-4f36-5826-bf19-8eb6dec21014','TOKEN_RECEIVED','TOKEN RECEIVED',3,NULL,NULL,0.00,NULL,0,1,'2026-09-12 10:14:53','2026-09-12 10:14:53','04_PLANNING'),
('c3bbdf55-3269-5039-98ad-1968bdbfa15a','CONCEPT02_FINALISED','CONCEPT02 FINALISED',5,NULL,NULL,0.00,'1c066883-29e6-52dc-81a5-9e9ce9b74c41',0,1,'2026-09-12 10:14:53','2026-09-12 10:14:53','05_DESIGN'),
('f53ef67d-685f-539f-94b2-d6db327247d0','TENDER_DRAWINGS_FINALISED','TENDER DRAWINGS FINALISED',8,NULL,NULL,0.00,'2d7b2953-14e1-5086-9c8b-f8493503a00c',0,1,'2026-09-12 10:14:53','2026-09-12 10:14:53','06_TENDER');
/*!40000 ALTER TABLE `gate_definitions` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `gate_logs`
--

DROP TABLE IF EXISTS `gate_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `gate_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `step_id` int(11) NOT NULL,
  `gate_name` varchar(150) NOT NULL,
  `achieved_at` datetime NOT NULL,
  `approver_team_id` int(11) DEFAULT NULL,
  `approver_name` varchar(150) NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gate_logs`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `gate_logs` WRITE;
/*!40000 ALTER TABLE `gate_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `gate_logs` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `gate_phase_definitions`
--

DROP TABLE IF EXISTS `gate_phase_definitions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `gate_phase_definitions` (
  `id` char(36) NOT NULL,
  `code` varchar(40) NOT NULL,
  `title` varchar(120) DEFAULT NULL,
  `sort_order` int(11) DEFAULT NULL,
  `is_parallel` tinyint(1) DEFAULT NULL,
  `lead_team_code` varchar(10) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `span` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uq_gate_phase_definitions_code` (`code`) USING BTREE,
  KEY `idx_gate_phase_definitions_sort_order` (`sort_order`) USING BTREE,
  KEY `idx_gate_phase_definitions_is_parallel` (`is_parallel`) USING BTREE,
  KEY `idx_gate_phase_definitions_lead_team` (`lead_team_code`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gate_phase_definitions`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `gate_phase_definitions` WRITE;
/*!40000 ALTER TABLE `gate_phase_definitions` DISABLE KEYS */;
INSERT INTO `gate_phase_definitions` VALUES
('1c066883-29e6-52dc-81a5-9e9ce9b74c41','B_MATERIAL','B MATERIAL',11,1,NULL,NULL,NULL,'2026-09-12 10:14:53','2026-09-12 10:14:53'),
('226e8d00-7ad3-51d4-8275-6545b955b4ca','08_EXECUTION','08 EXECUTION',8,0,NULL,NULL,NULL,'2026-09-12 10:14:52','2026-09-12 10:14:52'),
('2d7b2953-14e1-5086-9c8b-f8493503a00c','07_WORKING','07 WORKING',7,0,NULL,NULL,NULL,'2026-09-12 10:14:52','2026-09-12 10:14:52'),
('33f35a10-ff72-5449-b99b-b0e7ab056c75','09_HANDOVER','09 HANDOVER',9,0,NULL,NULL,NULL,'2026-09-12 10:14:52','2026-09-12 10:14:52'),
('4933e9ea-1801-5dbf-b5a2-77c130faae83','A_VENDOR_TRADES','A VENDOR TRADES',10,1,NULL,NULL,NULL,'2026-09-12 10:14:52','2026-09-12 10:14:52'),
('5007a9b5-0a5c-55c4-ae0c-4236d9174f38','03_PRE_DESIGN','03 PRE DESIGN',3,0,NULL,NULL,NULL,'2026-09-12 10:14:51','2026-09-12 10:14:51'),
('70dd9bc6-e4b9-5d56-8fcf-ca706e09aee3','04_PLANNING','04 PLANNING',4,0,NULL,NULL,NULL,'2026-09-12 10:14:52','2026-09-12 10:14:52'),
('bea92db7-80aa-56b9-b39c-674c1f55ed4c','01_BRIEF','01 BRIEF',1,0,NULL,NULL,NULL,'2026-09-12 10:14:51','2026-09-12 10:14:51'),
('decfc696-08b4-5d84-8a18-9ea425263cf1','06_TENDER','06 TENDER',6,0,NULL,NULL,NULL,'2026-09-12 10:14:52','2026-09-12 10:14:52'),
('ebfbb363-f883-5708-87bc-a8964ae3bc59','05_DESIGN','05 DESIGN',5,0,NULL,NULL,NULL,'2026-09-12 10:14:52','2026-09-12 10:14:52'),
('f0561004-bf80-51d7-98c6-f6df94cec2ed','02_RECCE','02 RECCE',2,0,NULL,NULL,NULL,'2026-09-12 10:14:51','2026-09-12 10:14:51');
/*!40000 ALTER TABLE `gate_phase_definitions` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `gate_transition_logs`
--

DROP TABLE IF EXISTS `gate_transition_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `gate_transition_logs` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `gate_definition_id` char(36) NOT NULL,
  `action` varchar(60) NOT NULL,
  `from_status` varchar(30) DEFAULT NULL,
  `to_status` varchar(30) DEFAULT NULL,
  `performed_by` char(36) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `snapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`snapshot`)),
  `created_at` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  PRIMARY KEY (`id`),
  KEY `history_lookup` (`project_id`,`gate_definition_id`,`created_at`),
  KEY `gate_definition_id` (`gate_definition_id`),
  CONSTRAINT `gate_transition_logs_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  CONSTRAINT `gate_transition_logs_ibfk_2` FOREIGN KEY (`gate_definition_id`) REFERENCES `gate_definitions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gate_transition_logs`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `gate_transition_logs` WRITE;
/*!40000 ALTER TABLE `gate_transition_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `gate_transition_logs` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `google_tokens`
--

DROP TABLE IF EXISTS `google_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `google_tokens` (
  `id` char(36) NOT NULL,
  `userId` char(36) NOT NULL,
  `accessToken` text NOT NULL,
  `refreshToken` text DEFAULT NULL,
  `scope` text DEFAULT NULL,
  `expiresAt` datetime NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `google_tokens_userId_unique` (`userId`),
  CONSTRAINT `google_tokens_userId_fk` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `google_tokens`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `google_tokens` WRITE;
/*!40000 ALTER TABLE `google_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `google_tokens` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `handover_packages`
--

DROP TABLE IF EXISTS `handover_packages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `handover_packages` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `url` varchar(1000) DEFAULT NULL,
  `size` bigint(20) DEFAULT NULL,
  `manifest_json` longtext DEFAULT NULL,
  `link_id` char(36) DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `prepared_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `ix_handover_packages_project` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `handover_packages`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `handover_packages` WRITE;
/*!40000 ALTER TABLE `handover_packages` DISABLE KEYS */;
/*!40000 ALTER TABLE `handover_packages` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `inventory_transactions`
--

DROP TABLE IF EXISTS `inventory_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_transactions` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `site_location` varchar(255) DEFAULT NULL,
  `material_id` char(36) NOT NULL,
  `transaction_date` date NOT NULL,
  `transaction_type` enum('RECEIPT','ISSUE','RETURN_FROM_CONTRACTOR','RETURN_TO_VENDOR','TRANSFER_IN','TRANSFER_OUT','ADJUSTMENT_IN','ADJUSTMENT_OUT') NOT NULL,
  `quantity` decimal(15,3) NOT NULL,
  `unit_id` char(36) NOT NULL,
  `unit` varchar(30) NOT NULL,
  `direction` enum('IN','OUT') NOT NULL,
  `reference_type` enum('DELIVERY_CHALLAN','PURCHASE_ORDER','ISSUE','TRANSFER','ADJUSTMENT','RETURN') DEFAULT NULL,
  `reference_id` char(36) DEFAULT NULL,
  `reference_item_id` char(36) DEFAULT NULL,
  `reversal_of_id` char(36) DEFAULT NULL,
  `reversal_reason` text DEFAULT NULL,
  `vendor_id` char(36) DEFAULT NULL,
  `contractor_id` char(36) DEFAULT NULL,
  `trade` varchar(100) DEFAULT NULL,
  `work_reference` varchar(255) DEFAULT NULL,
  `storage_location` varchar(255) DEFAULT NULL,
  `condition_status` enum('GOOD','DAMAGED','SHORT','REJECTED','NOT_APPLICABLE') NOT NULL DEFAULT 'NOT_APPLICABLE',
  `condition_notes` text DEFAULT NULL,
  `issued_to` varchar(255) DEFAULT NULL,
  `issued_by` char(36) DEFAULT NULL,
  `received_by` char(36) DEFAULT NULL,
  `challan_bill_no` varchar(100) DEFAULT NULL,
  `gate_pass_received` enum('YES','NO','NA') DEFAULT NULL,
  `material_checked` enum('YES','NO','NA') DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_inventory_transactions_project_id` (`project_id`),
  KEY `idx_inventory_transactions_material_id` (`material_id`),
  KEY `idx_inventory_transactions_transaction_date` (`transaction_date`),
  KEY `idx_inventory_transactions_transaction_type` (`transaction_type`),
  KEY `idx_inventory_transactions_reference_id` (`reference_id`),
  KEY `idx_inventory_transactions_site_location` (`site_location`),
  KEY `idx_inventory_transactions_unit_id` (`unit_id`),
  KEY `idx_inventory_transactions_reversal_of_id` (`reversal_of_id`),
  KEY `idx_inventory_transactions_challan_bill_no` (`challan_bill_no`),
  CONSTRAINT `fk_inventory_transactions_material` FOREIGN KEY (`material_id`) REFERENCES `material_masters` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_transactions`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `inventory_transactions` WRITE;
/*!40000 ALTER TABLE `inventory_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_transactions` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `lead_activity`
--

DROP TABLE IF EXISTS `lead_activity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `lead_activity` (
  `id` char(36) NOT NULL,
  `lead_id` char(36) NOT NULL,
  `kind` varchar(32) NOT NULL DEFAULT 'update',
  `author` varchar(255) DEFAULT NULL,
  `text` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_lead_activity_lead` (`lead_id`),
  CONSTRAINT `fk_lead_activity_lead` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lead_activity`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `lead_activity` WRITE;
/*!40000 ALTER TABLE `lead_activity` DISABLE KEYS */;
/*!40000 ALTER TABLE `lead_activity` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `lead_notes`
--

DROP TABLE IF EXISTS `lead_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `lead_notes` (
  `id` char(36) NOT NULL,
  `lead_id` char(36) NOT NULL,
  `author` varchar(255) NOT NULL,
  `text` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_lead_notes_lead` (`lead_id`),
  CONSTRAINT `fk_lead_notes_lead` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lead_notes`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `lead_notes` WRITE;
/*!40000 ALTER TABLE `lead_notes` DISABLE KEYS */;
/*!40000 ALTER TABLE `lead_notes` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `lead_tasks`
--

DROP TABLE IF EXISTS `lead_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `lead_tasks` (
  `id` char(36) NOT NULL,
  `lead_id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `due_date` date DEFAULT NULL,
  `done` tinyint(1) NOT NULL DEFAULT 0,
  `created_by` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_lead_tasks_lead` (`lead_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lead_tasks`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `lead_tasks` WRITE;
/*!40000 ALTER TABLE `lead_tasks` DISABLE KEYS */;
/*!40000 ALTER TABLE `lead_tasks` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `leads`
--

DROP TABLE IF EXISTS `leads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `leads` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `deal_name` varchar(255) DEFAULT NULL,
  `company` varchar(255) DEFAULT NULL,
  `client_id` char(36) DEFAULT NULL,
  `project_id` char(36) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `whatsapp` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `type` enum('Residential','Commercial','Institutional') NOT NULL DEFAULT 'Residential',
  `location` varchar(255) DEFAULT NULL,
  `size` varchar(255) DEFAULT NULL,
  `budget` varchar(255) DEFAULT NULL,
  `amount` decimal(15,2) DEFAULT NULL,
  `expected_close` date DEFAULT NULL,
  `timeline` varchar(255) DEFAULT NULL,
  `source` varchar(255) DEFAULT NULL,
  `owner` varchar(255) DEFAULT NULL,
  `owner_id` char(36) DEFAULT NULL,
  `stage` enum('capture','qual','disc','prop','nego','contract','handoff','nurture','lost') NOT NULL DEFAULT 'capture',
  `days` int(11) NOT NULL DEFAULT 0,
  `stage_entered_at` datetime DEFAULT NULL,
  `tag` enum('Hot','Warm','Cold') DEFAULT NULL,
  `color` enum('Green','Red','Yellow','Blue') DEFAULT NULL,
  `stuck_mode` enum('auto','always','never') NOT NULL DEFAULT 'auto',
  `follow_up` date DEFAULT NULL,
  `proposal_amount` varchar(255) DEFAULT NULL,
  `proposal_timeline` varchar(255) DEFAULT NULL,
  `proposal_remarks` text DEFAULT NULL,
  `doc_brief` smallint(6) NOT NULL DEFAULT 0,
  `doc_proposal` smallint(6) NOT NULL DEFAULT 0,
  `doc_contract` smallint(6) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `lost_reason` varchar(500) DEFAULT NULL,
  `closed_at` datetime DEFAULT NULL,
  `zoho_id` varchar(64) DEFAULT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_leads_phone` (`phone`),
  KEY `idx_leads_stage` (`stage`),
  KEY `idx_leads_owner` (`owner`),
  KEY `idx_leads_followup` (`follow_up`),
  KEY `idx_leads_client` (`client_id`),
  KEY `idx_leads_zoho` (`zoho_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leads`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `leads` WRITE;
/*!40000 ALTER TABLE `leads` DISABLE KEYS */;
/*!40000 ALTER TABLE `leads` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `library_categories`
--

DROP TABLE IF EXISTS `library_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `library_categories` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `library_categories`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `library_categories` WRITE;
/*!40000 ALTER TABLE `library_categories` DISABLE KEYS */;
INSERT INTO `library_categories` VALUES
('13fb3036-2ea5-4b9c-9455-b5babae9afd3','EXTRA MUTILINE ZONING',0,'2026-07-23 10:45:02','2026-07-23 10:45:02',NULL),
('a5b6e3d0-7e91-11f1-b721-52540021303b','Civil Work',1,'2026-07-13 13:35:44','2026-07-13 13:35:44',NULL),
('a5b72998-7e91-11f1-b721-52540021303b','Flooring',2,'2026-07-13 13:35:44','2026-07-13 13:35:44',NULL),
('a5b72e9c-7e91-11f1-b721-52540021303b','Wall Finishes',3,'2026-07-13 13:35:44','2026-07-13 13:35:44',NULL),
('a5b72efe-7e91-11f1-b721-52540021303b','Electrical',4,'2026-07-13 13:35:44','2026-07-13 13:35:44',NULL),
('a5b72f39-7e91-11f1-b721-52540021303b','Plumbing',5,'2026-07-13 13:35:44','2026-07-13 13:35:44',NULL),
('a5b72ff0-7e91-11f1-b721-52540021303b','Sanitary Fittings',6,'2026-07-13 13:35:44','2026-07-13 13:35:44',NULL),
('a5b7302c-7e91-11f1-b721-52540021303b','Doors & Windows',7,'2026-07-13 13:35:44','2026-07-13 13:35:44',NULL),
('a5b7305d-7e91-11f1-b721-52540021303b','Painting',8,'2026-07-13 13:35:44','2026-07-13 13:35:44',NULL),
('a5b73094-7e91-11f1-b721-52540021303b','False Ceiling',9,'2026-07-13 13:35:44','2026-07-13 13:35:44',NULL),
('a5b730c7-7e91-11f1-b721-52540021303b','Kitchen Work',10,'2026-07-13 13:35:44','2026-07-13 13:35:44',NULL),
('a5b730f8-7e91-11f1-b721-52540021303b','Waterproofing',11,'2026-07-13 13:35:44','2026-07-13 13:35:44',NULL),
('a5b73128-7e91-11f1-b721-52540021303b','External Development',12,'2026-07-13 13:35:44','2026-07-13 13:35:44',NULL),
('a6eb61a9-09e1-4a50-93d0-44d8901fffe4','NEW INLINEW',0,'2026-07-23 10:49:15','2026-07-23 10:49:15',NULL),
('def4dc69-9245-4961-adec-76ad2cfaf9cd','new category',0,'2026-07-22 04:05:43','2026-07-22 04:05:43',NULL);
/*!40000 ALTER TABLE `library_categories` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `library_items`
--

DROP TABLE IF EXISTS `library_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `library_items` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category_id` char(36) DEFAULT NULL,
  `category_name` varchar(255) DEFAULT NULL,
  `unit_id` char(36) DEFAULT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `default_rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `notes` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_library_item_category` (`category_id`),
  CONSTRAINT `fk_library_item_category` FOREIGN KEY (`category_id`) REFERENCES `library_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `library_items`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `library_items` WRITE;
/*!40000 ALTER TABLE `library_items` DISABLE KEYS */;
INSERT INTO `library_items` VALUES
('131ad9be-7e92-11f1-b721-52540021303b','RCC Concrete M25 Grade','a5b6e3d0-7e91-11f1-b721-52540021303b','Civil Work',NULL,'Cum',8500.00,'Ready mix concrete work',1,'2026-07-13 13:38:47','2026-07-21 13:36:14','2026-07-21 13:36:14'),
('1ae0f458-764f-4718-9047-0968fbe162b6','RCC WORK','a5b6e3d0-7e91-11f1-b721-52540021303b','Civil Work','1a520798-e982-463d-a969-6646c24d2be0','CFT.',195.15,'RCC Grade M25 in lintels/beams, excluding reinforcement steel.',1,'2026-07-23 11:37:32','2026-07-23 11:37:32',NULL),
('24e11a37-7f46-11f1-b721-52540021303b','Cement 43 Grade','a5b6e3d0-7e91-11f1-b721-52540021303b','Civil Work',NULL,'Bag',420.00,'Premium quality cement',1,'2026-07-14 11:07:46','2026-07-21 13:36:01','2026-07-21 13:36:01'),
('24e17766-7f46-11f1-b721-52540021303b','TMT Steel Bar 12mm','a5b7302c-7e91-11f1-b721-52540021303b','Doors & Windows',NULL,'Kg',75.50,'High strength reinforcement steel',1,'2026-07-14 11:07:46','2026-07-21 13:36:10','2026-07-21 13:36:10'),
('24e17bad-7f46-11f1-b721-52540021303b','River Sand','a5b6e3d0-7e91-11f1-b721-52540021303b','Civil Work',NULL,'Ton',1800.00,'Construction grade river sand',1,'2026-07-14 11:07:46','2026-07-21 13:36:13','2026-07-21 13:36:13'),
('24e17dac-7f46-11f1-b721-52540021303b','Floor Tiles 600x600mm','a5b72998-7e91-11f1-b721-52540021303b','Flooring',NULL,'Sqft',85.00,'Premium ceramic floor tiles',1,'2026-07-14 11:07:46','2026-07-21 13:36:38','2026-07-21 13:36:38'),
('24e17ea8-7f46-11f1-b721-52540021303b','Granite Flooring','a5b72998-7e91-11f1-b721-52540021303b','Flooring',NULL,'Sqft',180.00,'Natural granite flooring material',1,'2026-07-14 11:07:46','2026-07-21 13:36:41','2026-07-21 13:36:41'),
('24e19e5d-7f46-11f1-b721-52540021303b','Wall Putty','a5b72e9c-7e91-11f1-b721-52540021303b','Wall Finishes',NULL,'Kg',40.00,'Smooth wall finishing material',1,'2026-07-14 11:07:46','2026-07-21 13:36:07','2026-07-21 13:36:07'),
('24e19fe5-7f46-11f1-b721-52540021303b','Interior Wall Paint','a5b72e9c-7e91-11f1-b721-52540021303b','Wall Finishes',NULL,'Liter',350.00,'Premium interior paint',1,'2026-07-14 11:07:46','2026-07-21 13:36:28','2026-07-21 13:36:28'),
('24e1a092-7f46-11f1-b721-52540021303b','Copper Wire 2.5mm','a5b72efe-7e91-11f1-b721-52540021303b','Electrical',NULL,'Meter',85.00,'ISI certified copper wire',1,'2026-07-14 11:07:46','2026-07-21 13:36:31','2026-07-21 13:36:31'),
('24e1a127-7f46-11f1-b721-52540021303b','Modular Switch 6A','a5b72efe-7e91-11f1-b721-52540021303b','Electrical',NULL,'Nos',120.00,'Electrical switch fitting',1,'2026-07-14 11:07:46','2026-07-21 13:36:20','2026-07-21 13:36:20'),
('24e1a1b3-7f46-11f1-b721-52540021303b','PVC Pipe 4 Inch','a5b72f39-7e91-11f1-b721-52540021303b','Plumbing',NULL,'Meter',320.00,'Heavy duty drainage pipe',1,'2026-07-14 11:07:46','2026-07-21 13:36:16','2026-07-21 13:36:16'),
('24e1a23b-7f46-11f1-b721-52540021303b','CPVC Pipe 1 Inch','a5b72f39-7e91-11f1-b721-52540021303b','Plumbing',NULL,'Meter',150.00,'Water supply piping',1,'2026-07-14 11:07:46','2026-07-21 13:36:33','2026-07-21 13:36:33'),
('24e1a2c9-7f46-11f1-b721-52540021303b','Wash Basin Ceramic','a5b72ff0-7e91-11f1-b721-52540021303b','Sanitary Fittings',NULL,'Nos',4500.00,'Premium ceramic wash basin',1,'2026-07-14 11:07:46','2026-07-21 13:36:06','2026-07-21 13:36:06'),
('24e1a344-7f46-11f1-b721-52540021303b','Western Toilet Seat','a5b72ff0-7e91-11f1-b721-52540021303b','Sanitary Fittings',NULL,'Nos',8500.00,'Bathroom sanitary fitting',1,'2026-07-14 11:07:46','2026-07-14 09:03:23','2026-07-14 09:03:23'),
('24e1a3cb-7f46-11f1-b721-52540021303b','Flush Door','a5b7302c-7e91-11f1-b721-52540021303b','Doors & Windows',NULL,'Nos',7500.00,'Engineered wooden flush door',1,'2026-07-14 11:07:46','2026-07-21 13:36:39','2026-07-21 13:36:39'),
('24e1a44d-7f46-11f1-b721-52540021303b','Aluminium Window Frame','a5b7302c-7e91-11f1-b721-52540021303b','Doors & Windows',NULL,'Sqft',650.00,'Aluminium sliding window',1,'2026-07-14 11:07:46','2026-07-21 13:35:49','2026-07-21 13:35:49'),
('24e1a4d1-7f46-11f1-b721-52540021303b','Exterior Paint','a5b7305d-7e91-11f1-b721-52540021303b','Painting',NULL,'Liter',420.00,'Weather resistant exterior paint',1,'2026-07-14 11:07:46','2026-07-21 13:36:36','2026-07-21 13:36:36'),
('24e1a587-7f46-11f1-b721-52540021303b','Gypsum Board Ceiling','a5b73094-7e91-11f1-b721-52540021303b','False Ceiling',NULL,'Sqft',120.00,'Gypsum false ceiling work',1,'2026-07-14 11:07:46','2026-07-21 13:36:42','2026-07-21 13:36:42'),
('24e1a608-7f46-11f1-b721-52540021303b','Kitchen Platform Granite','a5b730c7-7e91-11f1-b721-52540021303b','Kitchen Work',NULL,'Sqft',250.00,'Granite kitchen countertop',1,'2026-07-14 11:07:46','2026-07-21 13:36:26','2026-07-21 13:36:26'),
('24e1a6ef-7f46-11f1-b721-52540021303b','Waterproofing Chemical','a5b730f8-7e91-11f1-b721-52540021303b','Waterproofing',NULL,'Kg',220.00,'Waterproofing treatment chemical',1,'2026-07-14 11:07:46','2026-07-21 13:36:04','2026-07-21 13:36:04'),
('24e1a77b-7f46-11f1-b721-52540021303b','Boundary Wall Work','a5b73128-7e91-11f1-b721-52540021303b','External Development',NULL,'Sqft',950.00,'External civil development work',1,'2026-07-14 11:07:46','2026-07-21 13:35:53','2026-07-21 13:35:53'),
('2971f71a-52b6-4236-b8bd-79199b535f21','New item adding','a5b7305d-7e91-11f1-b721-52540021303b','Painting','c740a76c-746e-11f1-8bb6-52540021303b','Bdl',120.78,'New item addingNew item addingNew item addingNew item addingNew item addingNew item addingNew item addingNew item addingNew item addingNew item addingNew item addingNew item adding',1,'2026-07-23 11:01:53','2026-07-23 11:27:58','2026-07-23 11:27:58'),
('2a3bdad6-b757-483a-81f5-6c64eb277fc2','Main passenger gate (MS)',NULL,'METAL WORK',NULL,'Nos.',0.00,'',1,'2026-08-25 15:47:49','2026-08-25 15:47:49',NULL),
('2ba4db2f-d592-499a-bd22-70c9483ee0ce','Front railing',NULL,'METAL WORK',NULL,'Nos.',0.00,'Providing and fixing MS railing at front elevation using fabricated sections, welded joints ground smooth, fixed to line and level with anchor fasteners, finished with primer and enamel paint.',1,'2026-08-25 15:45:20','2026-08-25 15:45:20',NULL),
('3368d28a-7f46-11f1-b721-52540021303b','PCC Concrete 1:4:8','a5b6e3d0-7e91-11f1-b721-52540021303b','Civil Work',NULL,'Cubic Meter',5500.00,'Plain cement concrete foundation work',1,'2026-07-14 11:08:11','2026-07-21 13:36:19','2026-07-21 13:36:19'),
('3368d8e5-7f46-11f1-b721-52540021303b','RCC Concrete M25','a5b72ff0-7e91-11f1-b721-52540021303b','Sanitary Fittings',NULL,'Cubic Meter',7000.00,'Reinforced concrete work',1,'2026-07-14 11:08:11','2026-07-21 13:36:15','2026-07-21 13:36:15'),
('3368dc7c-7f46-11f1-b721-52540021303b','Brick Masonry Work','a5b6e3d0-7e91-11f1-b721-52540021303b','Civil Work',NULL,'Cubic Meter',8500.00,'First class brick masonry',1,'2026-07-14 11:08:11','2026-07-21 13:35:57','2026-07-21 13:35:57'),
('3368de71-7f46-11f1-b721-52540021303b','AAC Block 6 Inch','a5b72e9c-7e91-11f1-b721-52540021303b','Wall Finishes',NULL,'Nos',85.00,'Lightweight AAC construction block',1,'2026-07-14 11:08:11','2026-07-21 13:35:46','2026-07-21 13:35:46'),
('3368dfcb-7f46-11f1-b721-52540021303b','Marble Flooring','a5b72998-7e91-11f1-b721-52540021303b','Flooring',NULL,'Sqft',250.00,'Premium marble flooring',1,'2026-07-14 11:08:11','2026-07-21 13:36:22','2026-07-21 13:36:22'),
('3368e07e-7f46-11f1-b721-52540021303b','Vitrified Tiles','a5b72998-7e91-11f1-b721-52540021303b','Flooring',NULL,'Sqft',95.00,'Polished vitrified floor tiles',1,'2026-07-14 11:08:11','2026-07-21 13:36:08','2026-07-21 13:36:08'),
('3368e132-7f46-11f1-b721-52540021303b','Tile Adhesive','a5b72998-7e91-11f1-b721-52540021303b','Flooring',NULL,'Bag',450.00,'Tile fixing adhesive',1,'2026-07-14 11:08:11','2026-07-21 13:36:11','2026-07-21 13:36:11'),
('3368e1e5-7f46-11f1-b721-52540021303b','Floor Skirting','a5b72998-7e91-11f1-b721-52540021303b','Flooring',NULL,'Rft',55.00,'Floor edge finishing work',1,'2026-07-14 11:08:11','2026-07-21 13:36:38','2026-07-21 13:36:38'),
('3368e29d-7f46-11f1-b721-52540021303b','Wall Texture Finish','a5b72e9c-7e91-11f1-b721-52540021303b','Wall Finishes',NULL,'Sqft',90.00,'Decorative wall texture coating',1,'2026-07-14 11:08:11','2026-07-21 13:36:07','2026-07-21 13:36:07'),
('3368e337-7f46-11f1-b721-52540021303b','Gypsum Wall Plaster','a5b72e9c-7e91-11f1-b721-52540021303b','Wall Finishes',NULL,'Sqft',45.00,'Smooth gypsum plaster finish',1,'2026-07-14 11:08:11','2026-07-21 13:36:42','2026-07-21 13:36:42'),
('336921f8-7f46-11f1-b721-52540021303b','POP Wall Finish','a5b72e9c-7e91-11f1-b721-52540021303b','Wall Finishes',NULL,'Sqft',60.00,'POP finishing work',1,'2026-07-14 11:08:11','2026-07-21 13:36:17','2026-07-21 13:36:17'),
('3369249a-7f46-11f1-b721-52540021303b','LED Ceiling Light','a5b72efe-7e91-11f1-b721-52540021303b','Electrical',NULL,'Nos',850.00,'Energy efficient LED light',1,'2026-07-14 11:08:11','2026-07-21 13:36:24','2026-07-21 13:36:24'),
('33692618-7f46-11f1-b721-52540021303b','Distribution Board 8 Way','a5b72efe-7e91-11f1-b721-52540021303b','Electrical',NULL,'Nos',4500.00,'Electrical distribution panel',1,'2026-07-14 11:08:11','2026-07-21 13:36:34','2026-07-21 13:36:34'),
('336927df-7f46-11f1-b721-52540021303b','MCB 32 Amp','a5b72efe-7e91-11f1-b721-52540021303b','Electrical',NULL,'Nos',450.00,'Safety circuit breaker',1,'2026-07-14 11:08:11','2026-07-21 13:36:21','2026-07-21 13:36:21'),
('33692978-7f46-11f1-b721-52540021303b','Electrical Conduit Pipe','a5b72efe-7e91-11f1-b721-52540021303b','Electrical',NULL,'Meter',35.00,'PVC electrical conduit pipe',1,'2026-07-14 11:08:11','2026-07-21 13:36:35','2026-07-21 13:36:35'),
('33692aab-7f46-11f1-b721-52540021303b','UPVC Water Pipe','a5b72f39-7e91-11f1-b721-52540021303b','Plumbing',NULL,'Meter',180.00,'UPVC water supply pipe',1,'2026-07-14 11:08:11','2026-07-21 13:36:09','2026-07-21 13:36:09'),
('33692b48-7f46-11f1-b721-52540021303b','Brass Angle Valve','a5b72f39-7e91-11f1-b721-52540021303b','Plumbing',NULL,'Nos',350.00,'Brass plumbing valve',1,'2026-07-14 11:08:11','2026-07-21 13:35:55','2026-07-21 13:35:55'),
('33692be3-7f46-11f1-b721-52540021303b','Floor Drain','a5b72f39-7e91-11f1-b721-52540021303b','Plumbing',NULL,'Nos',750.00,'Bathroom floor drain fitting',1,'2026-07-14 11:08:11','2026-07-21 13:36:37','2026-07-21 13:36:37'),
('33692c91-7f46-11f1-b721-52540021303b','Bathroom Mixer Tap','a5b72ff0-7e91-11f1-b721-52540021303b','Sanitary Fittings',NULL,'Nos',4500.00,'Premium bathroom mixer',1,'2026-07-14 11:08:11','2026-07-21 13:35:50','2026-07-21 13:35:50'),
('33692d2c-7f46-11f1-b721-52540021303b','Kitchen Sink Stainless Steel','a5b72ff0-7e91-11f1-b721-52540021303b','Sanitary Fittings',NULL,'Nos',3500.00,'SS kitchen sink',1,'2026-07-14 11:08:11','2026-07-21 13:36:25','2026-07-21 13:36:25'),
('33692de0-7f46-11f1-b721-52540021303b','Main Entrance Door','a5b7302c-7e91-11f1-b721-52540021303b','Doors & Windows',NULL,'Nos',25000.00,'Decorative wooden entrance door',1,'2026-07-14 11:08:11','2026-07-21 13:36:23','2026-07-21 13:36:23'),
('33692e79-7f46-11f1-b721-52540021303b','Sliding Glass Window','a5b7302c-7e91-11f1-b721-52540021303b','Doors & Windows',NULL,'Sqft',950.00,'Aluminium sliding glass window',1,'2026-07-14 11:08:11','2026-07-21 13:36:12','2026-07-21 13:36:12'),
('33692f22-7f46-11f1-b721-52540021303b','Primer Coat','a5b7305d-7e91-11f1-b721-52540021303b','Painting',NULL,'Liter',180.00,'Wall primer application',1,'2026-07-14 11:08:11','2026-07-21 13:36:17','2026-07-21 13:36:17'),
('33692fab-7f46-11f1-b721-52540021303b','Enamel Paint','a5b7305d-7e91-11f1-b721-52540021303b','Painting',NULL,'Liter',450.00,'Metal and wood enamel paint',1,'2026-07-14 11:08:11','2026-07-21 13:36:35','2026-07-21 13:36:35'),
('33693043-7f46-11f1-b721-52540021303b','POP False Ceiling Design','a5b73094-7e91-11f1-b721-52540021303b','False Ceiling',NULL,'Sqft',180.00,'Designer POP ceiling work',1,'2026-07-14 11:08:11','2026-07-21 13:36:18','2026-07-21 13:36:18'),
('336930d6-7f46-11f1-b721-52540021303b','Cove Lighting Work','a5b73094-7e91-11f1-b721-52540021303b','False Ceiling',NULL,'Rft',120.00,'Decorative ceiling lighting',1,'2026-07-14 11:08:11','2026-07-21 13:36:32','2026-07-21 13:36:32'),
('33693179-7f46-11f1-b721-52540021303b','Modular Kitchen Cabinet','a5b730c7-7e91-11f1-b721-52540021303b','Kitchen Work',NULL,'Sqft',1800.00,'Modular kitchen storage cabinet',1,'2026-07-14 11:08:11','2026-07-21 13:36:20','2026-07-21 13:36:20'),
('33693213-7f46-11f1-b721-52540021303b','Kitchen Chimney','a5b730c7-7e91-11f1-b721-52540021303b','Kitchen Work',NULL,'Nos',18000.00,'Kitchen exhaust chimney',1,'2026-07-14 11:08:11','2026-07-21 13:36:27','2026-07-21 13:36:27'),
('336932b2-7f46-11f1-b721-52540021303b','Terrace Waterproofing','a5b730f8-7e91-11f1-b721-52540021303b','Waterproofing',NULL,'Sqft',90.00,'Terrace leakage prevention work',1,'2026-07-14 11:08:11','2026-07-21 13:36:12','2026-07-21 13:36:12'),
('3369334f-7f46-11f1-b721-52540021303b','Bathroom Waterproofing','a5b72f39-7e91-11f1-b721-52540021303b','Plumbing',NULL,'Sqft',120.00,'Bathroom waterproofing treatment',1,'2026-07-14 11:08:11','2026-07-21 13:35:52','2026-07-21 13:35:52'),
('336933f6-7f46-11f1-b721-52540021303b','Compound Wall Construction','a5b73128-7e91-11f1-b721-52540021303b','External Development',NULL,'Rft',1800.00,'Boundary wall construction work',1,'2026-07-14 11:08:11','2026-07-21 13:36:30','2026-07-21 13:36:30'),
('33693492-7f46-11f1-b721-52540021303b','Garden Landscaping','a5b73128-7e91-11f1-b721-52540021303b','External Development',NULL,'Sqft',150.00,'Landscape development work',1,'2026-07-14 11:08:11','2026-07-21 13:36:40','2026-07-21 13:36:40'),
('37505e4b-54dc-4335-a7c4-2a93d4f427e7','Terrace metal shed with lifting',NULL,'METAL WORK',NULL,'Sqft',0.00,'Providing and fixing MS tubular truss framework with profiled roofing sheet and glass-wool insulation layer. Includes hoisting and lifting of all fabricated members to terrace level, alignment to line and level, welding, grinding of joints, one coat red-oxide primer and two coats synthetic enamel finish.',1,'2026-08-25 15:44:09','2026-08-25 15:44:09',NULL),
('3b41f865-3df9-4427-962d-be6be9f50022','dhruv',NULL,'EXTRA MUTILINE ZONING',NULL,'Nos.',1.00,'',1,'2026-10-08 11:48:35','2026-10-08 11:48:35',NULL),
('3fbf5b8e-6e61-4d49-a474-7726ec089d22','VRF stand',NULL,'METAL WORK',NULL,'Nos.',0.00,'',1,'2026-08-25 15:48:37','2026-08-25 15:48:37',NULL),
('40634593-363b-4238-87ff-3c4987b8bdff','Cartage',NULL,'METAL WORK',NULL,'Nos.',0.00,'',1,'2026-08-25 15:48:58','2026-08-25 15:48:58',NULL),
('4a712ec1-a44a-46c2-be8e-1fbc635c6516','Strengthening work at metal pillar junctions',NULL,'CIVIL WORKS EXTENSION-WITH METAL WORK',NULL,'Nos.',0.00,'',1,'2026-08-25 17:10:55','2026-08-25 17:10:55',NULL),
('7b3361c9-147f-4f51-b81d-95fc46b55405','Temporary access staircase (front facade)',NULL,'METAL WORK',NULL,'Nos.',0.00,'Fabrication and erection of temporary MS access staircase at front elevation, including stringers, treads, intermediate bracing and base anchoring, for safe access during execution period.',1,'2026-08-25 15:45:00','2026-08-25 15:45:00',NULL),
('7beabc84-ac04-4d38-99ef-05e470c7bcac','Dismantling of temporary staircase',NULL,'METAL WORK',NULL,'Nos.',0.00,'',1,'2026-08-25 15:50:13','2026-08-25 15:50:13',NULL),
('85f8a334-75d6-45c2-acbc-fbd2f2e367d9','NE WITEM 123','a5b7305d-7e91-11f1-b721-52540021303b','Painting','c740a6a9-746e-11f1-8bb6-52540021303b','Day',120.00,'',1,'2026-07-22 04:28:58','2026-07-23 10:14:22','2026-07-23 10:14:22'),
('8b9276d7-f90a-43eb-8352-022643fb08e7','SDFSDFSDF','a6eb61a9-09e1-4a50-93d0-44d8901fffe4','NEW INLINEW','328f54cc-e46f-4c9f-a8ea-04a4376bd563','CBM',18.09,'SDFSDFSDFSDFSDFSDFSDFSDFSDFSDFSDFSDFSDFSDFSDFSDFSDFSDFSDFSDFSDFSDFSDFSDFSDFSDFSDFSDFSDFSDFSDFSDFSDFSDFSDFSDFSDFSDFSDFSDFSDFSDFSDFSDFSDF',1,'2026-07-23 10:49:33','2026-07-23 11:28:00','2026-07-23 11:28:00'),
('9bcd8164-14dd-431a-9b96-c950c4abdbf5','Centering & Shuttering','a5b6e3d0-7e91-11f1-b721-52540021303b','Civil Work','cf4d3bfc-fdaa-4a30-934b-1654b1bcbaad','SQFT',76.32,'Centering and shuttering for lintels/beams.',1,'2026-07-23 11:39:31','2026-07-23 11:39:31',NULL),
('9f5922bb-65dc-43c9-8c6a-205765ce3325','Main gate (MS)',NULL,'METAL WORK',NULL,'Nos.',0.00,'',1,'2026-08-25 15:47:20','2026-08-25 15:47:20',NULL),
('b27cb57d-31a3-4ebe-95aa-8bcdb36e5b11','Demolition & Dismantling','a5b6e3d0-7e91-11f1-b721-52540021303b','Civil Work','1a520798-e982-463d-a969-6646c24d2be0','CFT.',71.28,'Demolition & Dismantling',1,'2026-07-23 11:34:45','2026-07-23 11:34:45',NULL),
('b616fc81-acb6-4b1c-ae24-f5c133710937','AC platform',NULL,'METAL WORK',NULL,'Nos.',0.00,'',1,'2026-08-25 15:48:25','2026-08-25 15:48:25',NULL),
('bad7f03b-dd9b-44e3-bcf1-557202fb9c7d','Miscellaneous / Site Support','a5b6e3d0-7e91-11f1-b721-52540021303b','Civil Work','bb27df14-910d-4f81-a663-006a2d254c0f','L.S',253300.00,'Debris disposal, repair work, and site support allowance.',1,'2026-07-23 11:42:06','2026-07-23 11:42:06',NULL),
('ce25613f-c6a1-4d36-a09a-f0d9719d6901','Mumty wall extension and boundary masonry',NULL,'CIVIL WORKS EXTENSION-WITH METAL WORK',NULL,'Nos.',0.00,'',1,'2026-08-25 17:11:10','2026-08-25 17:11:10',NULL),
('d27147bc-bb7f-49c2-b1f0-48e91ca1a1b2','Waterproofing','a5b6e3d0-7e91-11f1-b721-52540021303b','Civil Work','cf4d3bfc-fdaa-4a30-934b-1654b1bcbaad','SQFT',100.00,'Waterproofing membrane (Pidilite) to terrace slab.',1,'2026-07-23 11:40:30','2026-07-23 13:07:52',NULL),
('da159274-1462-4d1f-aa26-1767e61b12f3','Staircase railing (MS)',NULL,'METAL WORK',NULL,'Nos.',0.00,'Providing and fixing MS staircase railing including balusters, continuous handrail, newel post fixing and end returns, aligned to stair pitch, finished with primer and enamel paint.',1,'2026-08-25 15:45:41','2026-08-25 15:45:41',NULL),
('df08d7aa-7b41-4874-ba51-42df8ee92e29','Brick Masonry','a5b6e3d0-7e91-11f1-b721-52540021303b','Civil Work','cf4d3bfc-fdaa-4a30-934b-1654b1bcbaad','SQFT',286.20,'Brick masonry in cement mortar 1:6 (1 cement: 6 coarse sand), first-class burnt clay bricks.',1,'2026-07-23 11:35:44','2026-07-23 11:35:44',NULL),
('e030c8c0-b125-4a5f-9592-c37ef9ec63b8','Cement Plaster','a5b6e3d0-7e91-11f1-b721-52540021303b','Civil Work','cf4d3bfc-fdaa-4a30-934b-1654b1bcbaad','SQFT',40.57,'12mm thick cement plaster in cement mortar 1:4 (1 cement: 4 fine sand).',1,'2026-07-23 11:36:29','2026-07-23 11:36:29',NULL),
('e5f7e8c1-1dd7-472c-af7c-6c72b78839ca','Reinforcement Steel','13fb3036-2ea5-4b9c-9455-b5babae9afd3','EXTRA MUTILINE ZONING','bd2e16ef-6e09-40b3-b9cc-d304d9ac4f1a','MT',65000.00,'Reinforcement steel, Grade Fe 500D.',1,'2026-07-23 11:38:43','2026-07-23 11:38:43',NULL),
('e72afd98-f165-442a-a605-6293cb56f1d2','Brick Masonry','a5b6e3d0-7e91-11f1-b721-52540021303b','Civil Work','c740a76c-746e-11f1-8bb6-52540021303b','Bdl',286.20,'Providing and laying Brick Masonry with First-class burnt clay bricks of approved quality in\ncement mortar 1:6 (1 cement : 6 coarse sand), including soaking of bricks, raking out joints,\nscaffolding, curing, and all labour, materials, tools and tackles complete in all respects as per\nCPWD Specifications and as directed by the Engineer-in-Charge.',1,'2026-07-23 10:25:52','2026-07-23 11:27:53','2026-07-23 11:27:53'),
('e8380a7a-3947-4cbf-b07b-a1083bcdd969','Slider fittings',NULL,'METAL WORK',NULL,'Nos.',0.00,'',1,'2026-08-25 15:48:48','2026-08-25 15:48:48',NULL),
('f78a4ba2-587f-415d-9f97-1f945c83d2ac','Demolition/dismantling','a5b6e3d0-7e91-11f1-b721-52540021303b','Civil Work','c740a643-746e-11f1-8bb6-52540021303b','Hr',71.28,'Demolition/ Dismantling of existing brick masonry, cement plaster and reinforced cement\nconcrete (RCC) work, including cutting where required, stacking of reusable materials as\ndirected, loading, carriage and disposal of unserviceable debris/malba outside the municipal\nlimits or at an approved dumping ground, complete in all respects as per CPWD\nSpecifications and as directed by the Engineer-in-Charge.',1,'2026-07-23 10:23:48','2026-07-23 11:27:55','2026-07-23 11:27:55'),
('fafc08e4-7e91-11f1-b721-52540021303b','Brick Masonry Work','a5b6e3d0-7e91-11f1-b721-52540021303b','Civil Work',NULL,'Cum',9500.00,'Red brick masonry including mortar',1,'2026-07-13 13:38:07','2026-07-21 13:35:59','2026-07-21 13:35:59'),
('fec4fed8-b699-43d8-a21b-b7756845de19','new item ','a5b7302c-7e91-11f1-b721-52540021303b','Doors & Windows','c740a5d1-746e-11f1-8bb6-52540021303b',NULL,123.00,'',1,'2026-07-22 04:05:20','2026-07-23 10:14:24','2026-07-23 10:14:24'),
('ffa6ec78-a026-4969-ad92-ce7385011f90','Perimeter railing above metal shed',NULL,'METAL WORK',NULL,'Nos.',0.00,'',1,'2026-08-25 15:48:09','2026-08-25 15:48:09',NULL);
/*!40000 ALTER TABLE `library_items` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `manpower_entries`
--

DROP TABLE IF EXISTS `manpower_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `manpower_entries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `daily_site_report_id` char(36) NOT NULL,
  `team_id` char(36) DEFAULT NULL,
  `trade` varchar(40) NOT NULL,
  `contractor_name` varchar(150) DEFAULT NULL,
  `headcount` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_manpower_entries_daily_site_report_id` (`daily_site_report_id`),
  KEY `idx_manpower_entries_team_id` (`team_id`),
  CONSTRAINT `fk_manpower_entries_daily_site_report` FOREIGN KEY (`daily_site_report_id`) REFERENCES `daily_site_reports` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `manpower_entries`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `manpower_entries` WRITE;
/*!40000 ALTER TABLE `manpower_entries` DISABLE KEYS */;
/*!40000 ALTER TABLE `manpower_entries` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `material_estimates`
--

DROP TABLE IF EXISTS `material_estimates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_estimates` (
  `id` char(36) NOT NULL,
  `material_requirement_id` char(36) DEFAULT NULL,
  `rate_sheet_id` char(36) DEFAULT NULL,
  `quantity` decimal(12,3) DEFAULT NULL,
  `unit` varchar(255) DEFAULT NULL,
  `unit_rate` decimal(12,2) DEFAULT NULL,
  `total_amount` decimal(14,2) DEFAULT NULL,
  `approval_status` enum('pending','approved','rejected','revision_requested') DEFAULT 'pending',
  `approved_by` varchar(255) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `converted_to_quotation` tinyint(1) DEFAULT 0,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `material_requirement_id` (`material_requirement_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_estimates`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `material_estimates` WRITE;
/*!40000 ALTER TABLE `material_estimates` DISABLE KEYS */;
/*!40000 ALTER TABLE `material_estimates` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `material_masters`
--

DROP TABLE IF EXISTS `material_masters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_masters` (
  `id` char(36) NOT NULL,
  `material_code` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `sub_category` varchar(100) DEFAULT NULL,
  `brand` varchar(150) DEFAULT NULL,
  `unit_id` char(36) DEFAULT NULL,
  `model` varchar(150) DEFAULT NULL,
  `specification` text DEFAULT NULL,
  `hsn_code` varchar(30) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_material_masters_material_code` (`material_code`),
  KEY `idx_material_masters_material_code` (`material_code`),
  KEY `idx_material_masters_name` (`name`),
  KEY `idx_material_masters_category` (`category`),
  KEY `idx_material_masters_brand` (`brand`),
  KEY `idx_material_masters_unit_id` (`unit_id`),
  CONSTRAINT `fk_material_masters_unit_id` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_masters`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `material_masters` WRITE;
/*!40000 ALTER TABLE `material_masters` DISABLE KEYS */;
/*!40000 ALTER TABLE `material_masters` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `material_procurement_items`
--

DROP TABLE IF EXISTS `material_procurement_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_procurement_items` (
  `id` char(36) NOT NULL,
  `procurement_id` char(36) NOT NULL,
  `material_id` char(36) NOT NULL,
  `serial_no` int(11) NOT NULL,
  `area` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `wall_area` decimal(12,2) DEFAULT NULL,
  `floor_area` decimal(12,2) DEFAULT NULL,
  `ceiling_area` decimal(12,2) DEFAULT NULL,
  `total_area` decimal(12,2) DEFAULT NULL,
  `quantity` decimal(14,3) NOT NULL DEFAULT 0.000,
  `price` decimal(14,2) NOT NULL DEFAULT 0.00,
  `amount` decimal(16,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_material_procurement_items_serial` (`procurement_id`,`serial_no`) USING BTREE,
  KEY `idx_material_procurement_items_procurement_id` (`procurement_id`) USING BTREE,
  KEY `idx_material_procurement_items_material_id` (`material_id`) USING BTREE,
  CONSTRAINT `fk_material_procurement_items_material` FOREIGN KEY (`material_id`) REFERENCES `material_masters` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_material_procurement_items_procurement` FOREIGN KEY (`procurement_id`) REFERENCES `material_procurements` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_procurement_items`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `material_procurement_items` WRITE;
/*!40000 ALTER TABLE `material_procurement_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `material_procurement_items` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `material_procurements`
--

DROP TABLE IF EXISTS `material_procurements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_procurements` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `procurement_no` varchar(100) NOT NULL,
  `status` enum('DRAFT','SUBMITTED','IN_PROGRESS','PARTIALLY_PROCURED','PROCURED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `remarks` text DEFAULT NULL,
  `created_by_id` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_material_procurements_procurement_no` (`procurement_no`) USING BTREE,
  KEY `idx_material_procurements_project_id` (`project_id`) USING BTREE,
  KEY `idx_material_procurements_created_by_id` (`created_by_id`) USING BTREE,
  CONSTRAINT `fk_material_procurements_created_by` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_material_procurements_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_procurements`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `material_procurements` WRITE;
/*!40000 ALTER TABLE `material_procurements` DISABLE KEYS */;
/*!40000 ALTER TABLE `material_procurements` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `material_quotations`
--

DROP TABLE IF EXISTS `material_quotations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_quotations` (
  `id` char(36) NOT NULL,
  `estimate_id` char(36) DEFAULT NULL,
  `quotation_number` varchar(255) DEFAULT NULL,
  `quotation_date` date DEFAULT NULL,
  `total_amount` decimal(14,2) DEFAULT NULL,
  `terms` text DEFAULT NULL,
  `status` enum('draft','sent','accepted','rejected') DEFAULT 'draft',
  `accepted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `estimate_id` (`estimate_id`),
  UNIQUE KEY `quotation_number` (`quotation_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_quotations`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `material_quotations` WRITE;
/*!40000 ALTER TABLE `material_quotations` DISABLE KEYS */;
/*!40000 ALTER TABLE `material_quotations` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `material_rate_sheets`
--

DROP TABLE IF EXISTS `material_rate_sheets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_rate_sheets` (
  `id` char(36) NOT NULL,
  `material_requirement_id` char(36) DEFAULT NULL,
  `vendor_name` varchar(255) DEFAULT NULL,
  `unit` varchar(255) DEFAULT NULL,
  `unit_rate` decimal(12,2) DEFAULT NULL,
  `currency` varchar(255) DEFAULT 'INR',
  `valid_till` date DEFAULT NULL,
  `approval_status` enum('pending','approved','rejected','revision_requested') DEFAULT 'pending',
  `approved_by` varchar(255) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_rate_sheets`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `material_rate_sheets` WRITE;
/*!40000 ALTER TABLE `material_rate_sheets` DISABLE KEYS */;
/*!40000 ALTER TABLE `material_rate_sheets` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `material_requirements`
--

DROP TABLE IF EXISTS `material_requirements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_requirements` (
  `id` char(36) NOT NULL,
  `projectId` varchar(255) NOT NULL,
  `designerId` varchar(255) NOT NULL,
  `itemName` varchar(255) NOT NULL,
  `materialMasterId` char(36) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `selection` text NOT NULL,
  `style` varchar(255) DEFAULT NULL,
  `functionalNeeds` text DEFAULT NULL,
  `requirementDate` date DEFAULT NULL,
  `status` enum('DRAFT','READY','IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_material_requirements_project` (`projectId`),
  KEY `idx_material_requirements_designer` (`designerId`),
  KEY `idx_material_requirements_status` (`status`),
  KEY `idx_material_requirements_created_at` (`createdAt`),
  KEY `idx_material_requirements_material_master` (`materialMasterId`),
  KEY `idx_material_requirements_requirement_date` (`requirementDate`),
  CONSTRAINT `fk_material_requirements_material_master` FOREIGN KEY (`materialMasterId`) REFERENCES `material_masters` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_requirements`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `material_requirements` WRITE;
/*!40000 ALTER TABLE `material_requirements` DISABLE KEYS */;
/*!40000 ALTER TABLE `material_requirements` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `material_vendors`
--

DROP TABLE IF EXISTS `material_vendors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_vendors` (
  `id` char(36) NOT NULL,
  `material_id` char(36) NOT NULL,
  `vendor_id` char(36) NOT NULL,
  `vendor_material_code` varchar(100) DEFAULT NULL,
  `price` decimal(15,2) DEFAULT NULL,
  `discount_percent` decimal(5,2) DEFAULT NULL,
  `lead_time_days` int(11) DEFAULT NULL,
  `is_preferred` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uq_material_vendor` (`material_id`,`vendor_id`) USING BTREE,
  KEY `idx_material_vendors_material_id` (`material_id`) USING BTREE,
  KEY `idx_material_vendors_vendor_id` (`vendor_id`) USING BTREE,
  KEY `idx_material_vendors_is_preferred` (`material_id`,`is_preferred`) USING BTREE,
  KEY `idx_material_vendors_is_active` (`material_id`,`is_active`) USING BTREE,
  CONSTRAINT `fk_material_vendors_material_id` FOREIGN KEY (`material_id`) REFERENCES `material_masters` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_material_vendors_vendor_id` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_vendors`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `material_vendors` WRITE;
/*!40000 ALTER TABLE `material_vendors` DISABLE KEYS */;
/*!40000 ALTER TABLE `material_vendors` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `microsoft_tokens`
--

DROP TABLE IF EXISTS `microsoft_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `microsoft_tokens` (
  `id` char(36) NOT NULL,
  `userId` char(36) NOT NULL,
  `accessToken` text NOT NULL,
  `refreshToken` text DEFAULT NULL,
  `scope` text DEFAULT NULL,
  `expiresAt` datetime NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `microsoft_tokens_userId_unique` (`userId`),
  CONSTRAINT `microsoft_tokens_userId_fk` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `microsoft_tokens`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `microsoft_tokens` WRITE;
/*!40000 ALTER TABLE `microsoft_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `microsoft_tokens` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `milestones`
--

DROP TABLE IF EXISTS `milestones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `milestones` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `due_date` date NOT NULL,
  `planned_start` date DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `status` enum('PENDING','IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `order` int(11) NOT NULL DEFAULT 0,
  `weight` decimal(5,2) DEFAULT NULL,
  `assignee_id` char(36) DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `milestones`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `milestones` WRITE;
/*!40000 ALTER TABLE `milestones` DISABLE KEYS */;
/*!40000 ALTER TABLE `milestones` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `mockups`
--

DROP TABLE IF EXISTS `mockups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `mockups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` char(36) NOT NULL,
  `step_id` int(11) DEFAULT NULL,
  `name` varchar(200) NOT NULL,
  `finish_type` varchar(150) DEFAULT NULL,
  `location` varchar(200) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `reference_image_urls` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`reference_image_urls`)),
  `proposed_by` varchar(150) NOT NULL,
  `proposed_at` datetime NOT NULL,
  `status` enum('PROPOSED','UNDER_REVIEW','APPROVED','REJECTED') NOT NULL DEFAULT 'PROPOSED',
  `reviewed_by` varchar(150) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `review_notes` text DEFAULT NULL,
  `cleared_for_rollout` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_mockups_project_id` (`project_id`),
  KEY `idx_mockups_step_id` (`step_id`),
  KEY `idx_mockups_status` (`status`),
  KEY `mockups_project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mockups`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `mockups` WRITE;
/*!40000 ALTER TABLE `mockups` DISABLE KEYS */;
/*!40000 ALTER TABLE `mockups` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `notes`
--

DROP TABLE IF EXISTS `notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `notes` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `body` text DEFAULT NULL,
  `project_id` char(36) DEFAULT NULL,
  `client_id` char(36) DEFAULT NULL,
  `category` varchar(40) NOT NULL DEFAULT 'general',
  `tone` varchar(20) NOT NULL DEFAULT 'mute',
  `pinned` tinyint(1) NOT NULL DEFAULT 0,
  `is_shared` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_notes_project` (`project_id`),
  KEY `idx_notes_client` (`client_id`),
  KEY `idx_notes_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notes`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `notes` WRITE;
/*!40000 ALTER TABLE `notes` DISABLE KEYS */;
/*!40000 ALTER TABLE `notes` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `type` enum('project_created','project_updated','project_archived','project_restored','project_deleted','brief_created','brief_updated','brief_deleted','calendar_event_created','calendar_event_updated','calendar_event_deleted','client_created','client_updated','client_deleted','client_restored','drawing_uploaded','drawing_superseded','lead_created','lead_updated','lead_stage_changed','lead_note_added','lead_proposal_sent','lead_deleted','quotation_created','quotation_updated','quotation_submitted','quotation_approved','quotation_returned_for_editing','quotation_declined','quotation_cancelled','quotation_deleted','quotation_restored','vendor_created','vendor_updated','vendor_status_changed','vendor_deleted','user_created','user_updated','user_profile_updated','user_avatar_updated','user_deactivated','user_deleted','task_created','task_updated','task_status_changed','task_completed','task_deleted','site_recce_created','site_recce_updated','site_recce_status_changed','site_recce_deleted','purchase_order_created','purchase_order_updated','purchase_order_approved','purchase_order_rejected','purchase_order_cancelled','system','reminder','announcement') NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` char(36) DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user` (`user_id`,`is_read`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `token_hash` varchar(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_password_reset_tokens_token_hash` (`token_hash`),
  KEY `idx_password_reset_tokens_user_id` (`user_id`),
  KEY `idx_password_reset_tokens_expires_at` (`expires_at`),
  CONSTRAINT `fk_password_reset_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `payment_schedule_milestones`
--

DROP TABLE IF EXISTS `payment_schedule_milestones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_schedule_milestones` (
  `id` char(36) NOT NULL,
  `payment_schedule_id` char(36) NOT NULL,
  `milestone_number` int(11) NOT NULL,
  `milestone_code` varchar(20) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `release_trigger` text DEFAULT NULL,
  `percentage` decimal(5,2) NOT NULL DEFAULT 0.00,
  `amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `status` enum('PENDING','DUE','INVOICED','PARTIALLY_PAID','PAID','OVERDUE','WAIVED') NOT NULL DEFAULT 'PENDING',
  `due_date` date DEFAULT NULL,
  `invoice_date` date DEFAULT NULL,
  `paid_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `paid_at` datetime DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_payment_schedule_milestones_schedule_id` (`payment_schedule_id`),
  KEY `idx_payment_schedule_milestones_status` (`status`),
  KEY `idx_payment_schedule_milestones_due_date` (`due_date`),
  CONSTRAINT `fk_payment_schedule_milestones_schedule` FOREIGN KEY (`payment_schedule_id`) REFERENCES `payment_schedules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_schedule_milestones`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `payment_schedule_milestones` WRITE;
/*!40000 ALTER TABLE `payment_schedule_milestones` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_schedule_milestones` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `payment_schedules`
--

DROP TABLE IF EXISTS `payment_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_schedules` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL DEFAULT 'Payment Schedule',
  `terms_template_id` char(36) DEFAULT NULL,
  `terms_version` int(11) DEFAULT NULL,
  `total_contract_value` decimal(15,2) NOT NULL DEFAULT 0.00,
  `gst_rate` decimal(5,2) DEFAULT NULL,
  `gst_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_payable` decimal(15,2) NOT NULL DEFAULT 0.00,
  `status` enum('DRAFT','ACTIVE','COMPLETED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `accepted_by_client` tinyint(1) NOT NULL DEFAULT 0,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_schedules`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `payment_schedules` WRITE;
/*!40000 ALTER TABLE `payment_schedules` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_schedules` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` char(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `resource` varchar(50) NOT NULL,
  `action` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `uk_permissions_resource_action` (`resource`,`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES
('4cf46ab4-c49b-11f1-a0d7-52540021303b','activity-logs:create','activity-logs','create','Staff API capability: activity-logs:create','2026-10-10 16:41:11'),
('4d0546b3-c49b-11f1-a0d7-52540021303b','activity-logs:read','activity-logs','read','Staff API capability: activity-logs:read','2026-10-10 16:41:11'),
('4d155bef-c49b-11f1-a0d7-52540021303b','apps:create','apps','create','Staff API capability: apps:create','2026-10-10 16:41:11'),
('4d264b12-c49b-11f1-a0d7-52540021303b','apps:delete','apps','delete','Staff API capability: apps:delete','2026-10-10 16:41:11'),
('4d35154f-c49b-11f1-a0d7-52540021303b','apps:read','apps','read','Staff API capability: apps:read','2026-10-10 16:41:11'),
('4d438359-c49b-11f1-a0d7-52540021303b','apps:update','apps','update','Staff API capability: apps:update','2026-10-10 16:41:12'),
('4d530b5b-c49b-11f1-a0d7-52540021303b','architect-quality:create','architect-quality','create','Staff API capability: architect-quality:create','2026-10-10 16:41:12'),
('4d61e954-c49b-11f1-a0d7-52540021303b','architect-quality:delete','architect-quality','delete','Staff API capability: architect-quality:delete','2026-10-10 16:41:12'),
('4d7031eb-c49b-11f1-a0d7-52540021303b','architect-quality:read','architect-quality','read','Staff API capability: architect-quality:read','2026-10-10 16:41:12'),
('4d7efa0e-c49b-11f1-a0d7-52540021303b','architect-quality:update','architect-quality','update','Staff API capability: architect-quality:update','2026-10-10 16:41:12'),
('4d8d6867-c49b-11f1-a0d7-52540021303b','architect-snags:create','architect-snags','create','Staff API capability: architect-snags:create','2026-10-10 16:41:12'),
('4d9bd089-c49b-11f1-a0d7-52540021303b','architect-snags:delete','architect-snags','delete','Staff API capability: architect-snags:delete','2026-10-10 16:41:12'),
('4daa3dc0-c49b-11f1-a0d7-52540021303b','architect-snags:read','architect-snags','read','Staff API capability: architect-snags:read','2026-10-10 16:41:12'),
('4db89857-c49b-11f1-a0d7-52540021303b','architect-snags:update','architect-snags','update','Staff API capability: architect-snags:update','2026-10-10 16:41:12'),
('4dc7052d-c49b-11f1-a0d7-52540021303b','architect-visit-stages:create','architect-visit-stages','create','Staff API capability: architect-visit-stages:create','2026-10-10 16:41:12'),
('4dd55a46-c49b-11f1-a0d7-52540021303b','architect-visit-stages:delete','architect-visit-stages','delete','Staff API capability: architect-visit-stages:delete','2026-10-10 16:41:12'),
('4de3b2b1-c49b-11f1-a0d7-52540021303b','architect-visit-stages:read','architect-visit-stages','read','Staff API capability: architect-visit-stages:read','2026-10-10 16:41:13'),
('4df257ca-c49b-11f1-a0d7-52540021303b','architect-visit-stages:update','architect-visit-stages','update','Staff API capability: architect-visit-stages:update','2026-10-10 16:41:13'),
('4e00c40a-c49b-11f1-a0d7-52540021303b','auth-google:connect','auth-google','connect','Staff API capability: auth-google:connect','2026-10-10 16:41:13'),
('4e0f4082-c49b-11f1-a0d7-52540021303b','auth-google:delete','auth-google','delete','Staff API capability: auth-google:delete','2026-10-10 16:41:13'),
('4e1e10ac-c49b-11f1-a0d7-52540021303b','auth-google:read','auth-google','read','Staff API capability: auth-google:read','2026-10-10 16:41:13'),
('4e2ca429-c49b-11f1-a0d7-52540021303b','auth-microsoft:connect','auth-microsoft','connect','Staff API capability: auth-microsoft:connect','2026-10-10 16:41:13'),
('4e3b0d5f-c49b-11f1-a0d7-52540021303b','auth-microsoft:delete','auth-microsoft','delete','Staff API capability: auth-microsoft:delete','2026-10-10 16:41:13'),
('4e4963d5-c49b-11f1-a0d7-52540021303b','auth-microsoft:read','auth-microsoft','read','Staff API capability: auth-microsoft:read','2026-10-10 16:41:13'),
('4e57e65b-c49b-11f1-a0d7-52540021303b','auth-tokens:delete','auth-tokens','delete','Staff API capability: auth-tokens:delete','2026-10-10 16:41:13'),
('4e665014-c49b-11f1-a0d7-52540021303b','auth-zoho:connect','auth-zoho','connect','Staff API capability: auth-zoho:connect','2026-10-10 16:41:13'),
('4e751183-c49b-11f1-a0d7-52540021303b','auth-zoho:delete','auth-zoho','delete','Staff API capability: auth-zoho:delete','2026-10-10 16:41:14'),
('4e8476a9-c49b-11f1-a0d7-52540021303b','auth-zoho:read','auth-zoho','read','Staff API capability: auth-zoho:read','2026-10-10 16:41:14'),
('4e9315a8-c49b-11f1-a0d7-52540021303b','automation:create','automation','create','Staff API capability: automation:create','2026-10-10 16:41:14'),
('4ea2489e-c49b-11f1-a0d7-52540021303b','automation:delete','automation','delete','Staff API capability: automation:delete','2026-10-10 16:41:14'),
('4eb0b24c-c49b-11f1-a0d7-52540021303b','automation:execute','automation','execute','Staff API capability: automation:execute','2026-10-10 16:41:14'),
('4ebf4baa-c49b-11f1-a0d7-52540021303b','automation:read','automation','read','Staff API capability: automation:read','2026-10-10 16:41:14'),
('4ecefc38-c49b-11f1-a0d7-52540021303b','automation:update','automation','update','Staff API capability: automation:update','2026-10-10 16:41:14'),
('4eddcde5-c49b-11f1-a0d7-52540021303b','boq-activity:read','boq-activity','read','Staff API capability: boq-activity:read','2026-10-10 16:41:14'),
('4eeccf6c-c49b-11f1-a0d7-52540021303b','boq-catalog:read','boq-catalog','read','Staff API capability: boq-catalog:read','2026-10-10 16:41:14'),
('4efb7700-c49b-11f1-a0d7-52540021303b','boq-templates:create','boq-templates','create','Staff API capability: boq-templates:create','2026-10-10 16:41:14'),
('4f09e196-c49b-11f1-a0d7-52540021303b','boq-templates:delete','boq-templates','delete','Staff API capability: boq-templates:delete','2026-10-10 16:41:15'),
('4f18902f-c49b-11f1-a0d7-52540021303b','boq-templates:read','boq-templates','read','Staff API capability: boq-templates:read','2026-10-10 16:41:15'),
('4f277b07-c49b-11f1-a0d7-52540021303b','boq-templates:update','boq-templates','update','Staff API capability: boq-templates:update','2026-10-10 16:41:15'),
('4fadb488-c49b-11f1-a0d7-52540021303b','boq:read','boq','read','Staff API capability: boq:read','2026-10-10 16:41:16'),
('4fbc5eaf-c49b-11f1-a0d7-52540021303b','boq:submit','boq','submit','Staff API capability: boq:submit','2026-10-10 16:41:16'),
('4fe94691-c49b-11f1-a0d7-52540021303b','budget-estimates:create','budget-estimates','create','Staff API capability: budget-estimates:create','2026-10-10 16:41:16'),
('4ff8113e-c49b-11f1-a0d7-52540021303b','budget-estimates:delete','budget-estimates','delete','Staff API capability: budget-estimates:delete','2026-10-10 16:41:16'),
('5006da71-c49b-11f1-a0d7-52540021303b','budget-estimates:lock','budget-estimates','lock','Staff API capability: budget-estimates:lock','2026-10-10 16:41:16'),
('50165352-c49b-11f1-a0d7-52540021303b','budget-estimates:read','budget-estimates','read','Staff API capability: budget-estimates:read','2026-10-10 16:41:16'),
('5024ee69-c49b-11f1-a0d7-52540021303b','budget-estimates:recalculate','budget-estimates','recalculate','Staff API capability: budget-estimates:recalculate','2026-10-10 16:41:16'),
('5033a409-c49b-11f1-a0d7-52540021303b','budget-estimates:update','budget-estimates','update','Staff API capability: budget-estimates:update','2026-10-10 16:41:16'),
('504215d3-c49b-11f1-a0d7-52540021303b','business-proposals:create','business-proposals','create','Staff API capability: business-proposals:create','2026-10-10 16:41:17'),
('5050c3d3-c49b-11f1-a0d7-52540021303b','business-proposals:read','business-proposals','read','Staff API capability: business-proposals:read','2026-10-10 16:41:17'),
('5086523e-c49b-11f1-a0d7-52540021303b','business-proposals:update','business-proposals','update','Staff API capability: business-proposals:update','2026-10-10 16:41:17'),
('509580c5-c49b-11f1-a0d7-52540021303b','calendar-events:create','calendar-events','create','Staff API capability: calendar-events:create','2026-10-10 16:41:17'),
('50a4007b-c49b-11f1-a0d7-52540021303b','calendar-events:delete','calendar-events','delete','Staff API capability: calendar-events:delete','2026-10-10 16:41:17'),
('50b2e1fc-c49b-11f1-a0d7-52540021303b','calendar-events:read','calendar-events','read','Staff API capability: calendar-events:read','2026-10-10 16:41:17'),
('50c1762b-c49b-11f1-a0d7-52540021303b','calendar-events:update','calendar-events','update','Staff API capability: calendar-events:update','2026-10-10 16:41:17'),
('50d02aaa-c49b-11f1-a0d7-52540021303b','cdn:upload','cdn','upload','Staff API capability: cdn:upload','2026-10-10 16:41:17'),
('50dfc90d-c49b-11f1-a0d7-52540021303b','client-portal:create','client-portal','create','Staff API capability: client-portal:create','2026-10-10 16:41:18'),
('50ee7d9c-c49b-11f1-a0d7-52540021303b','client-portal:deliver','client-portal','deliver','Staff API capability: client-portal:deliver','2026-10-10 16:41:18'),
('50fd9170-c49b-11f1-a0d7-52540021303b','client-portal:prepare','client-portal','prepare','Staff API capability: client-portal:prepare','2026-10-10 16:41:18'),
('510bf933-c49b-11f1-a0d7-52540021303b','client-portal:read','client-portal','read','Staff API capability: client-portal:read','2026-10-10 16:41:18'),
('511aa4bf-c49b-11f1-a0d7-52540021303b','client-portal:revoke','client-portal','revoke','Staff API capability: client-portal:revoke','2026-10-10 16:41:18'),
('5129c322-c49b-11f1-a0d7-52540021303b','clients:create','clients','create','Staff API capability: clients:create','2026-10-10 16:41:18'),
('51386622-c49b-11f1-a0d7-52540021303b','clients:delete','clients','delete','Staff API capability: clients:delete','2026-10-10 16:41:18'),
('5146e96b-c49b-11f1-a0d7-52540021303b','clients:read','clients','read','Staff API capability: clients:read','2026-10-10 16:41:18'),
('51559ffa-c49b-11f1-a0d7-52540021303b','clients:restore','clients','restore','Staff API capability: clients:restore','2026-10-10 16:41:18'),
('5164b941-c49b-11f1-a0d7-52540021303b','clients:update','clients','update','Staff API capability: clients:update','2026-10-10 16:41:18'),
('51734d55-c49b-11f1-a0d7-52540021303b','command-center:approve','command-center','approve','Staff API capability: command-center:approve','2026-10-10 16:41:19'),
('51821c11-c49b-11f1-a0d7-52540021303b','command-center:complete','command-center','complete','Staff API capability: command-center:complete','2026-10-10 16:41:19'),
('5190aea7-c49b-11f1-a0d7-52540021303b','command-center:read','command-center','read','Staff API capability: command-center:read','2026-10-10 16:41:19'),
('519f49c6-c49b-11f1-a0d7-52540021303b','command-center:refresh','command-center','refresh','Staff API capability: command-center:refresh','2026-10-10 16:41:19'),
('51adc839-c49b-11f1-a0d7-52540021303b','command-center:review','command-center','review','Staff API capability: command-center:review','2026-10-10 16:41:19'),
('51bc7d35-c49b-11f1-a0d7-52540021303b','command-center:upload','command-center','upload','Staff API capability: command-center:upload','2026-10-10 16:41:19'),
('51cbdf08-c49b-11f1-a0d7-52540021303b','dashboard:read','dashboard','read','Staff API capability: dashboard:read','2026-10-10 16:41:19'),
('51dada48-c49b-11f1-a0d7-52540021303b','dashboards:read','dashboards','read','Staff API capability: dashboards:read','2026-10-10 16:41:19'),
('51e93b83-c49b-11f1-a0d7-52540021303b','dashboards:reset','dashboards','reset','Staff API capability: dashboards:reset','2026-10-10 16:41:19'),
('51f7a177-c49b-11f1-a0d7-52540021303b','dashboards:update','dashboards','update','Staff API capability: dashboards:update','2026-10-10 16:41:19'),
('520648cc-c49b-11f1-a0d7-52540021303b','delivery-challans:create','delivery-challans','create','Staff API capability: delivery-challans:create','2026-10-10 16:41:20'),
('5214b3c7-c49b-11f1-a0d7-52540021303b','delivery-challans:delete','delivery-challans','delete','Staff API capability: delivery-challans:delete','2026-10-10 16:41:20'),
('522369fb-c49b-11f1-a0d7-52540021303b','delivery-challans:read','delivery-challans','read','Staff API capability: delivery-challans:read','2026-10-10 16:41:20'),
('523300b5-c49b-11f1-a0d7-52540021303b','delivery-challans:receive','delivery-challans','receive','Staff API capability: delivery-challans:receive','2026-10-10 16:41:20'),
('5242a558-c49b-11f1-a0d7-52540021303b','delivery-challans:update','delivery-challans','update','Staff API capability: delivery-challans:update','2026-10-10 16:41:20'),
('52512ba5-c49b-11f1-a0d7-52540021303b','document-requirements:create','document-requirements','create','Staff API capability: document-requirements:create','2026-10-10 16:41:20'),
('5260be8f-c49b-11f1-a0d7-52540021303b','document-requirements:delete','document-requirements','delete','Staff API capability: document-requirements:delete','2026-10-10 16:41:20'),
('526f4ace-c49b-11f1-a0d7-52540021303b','document-requirements:read','document-requirements','read','Staff API capability: document-requirements:read','2026-10-10 16:41:20'),
('527ea369-c49b-11f1-a0d7-52540021303b','document-requirements:update','document-requirements','update','Staff API capability: document-requirements:update','2026-10-10 16:41:20'),
('528eb6ab-c49b-11f1-a0d7-52540021303b','document-types:create','document-types','create','Staff API capability: document-types:create','2026-10-10 16:41:20'),
('529e49fa-c49b-11f1-a0d7-52540021303b','document-types:delete','document-types','delete','Staff API capability: document-types:delete','2026-10-10 16:41:21'),
('52ace725-c49b-11f1-a0d7-52540021303b','document-types:read','document-types','read','Staff API capability: document-types:read','2026-10-10 16:41:21'),
('52bc10c0-c49b-11f1-a0d7-52540021303b','document-types:update','document-types','update','Staff API capability: document-types:update','2026-10-10 16:41:21'),
('52ca8d7f-c49b-11f1-a0d7-52540021303b','documents:create','documents','create','Staff API capability: documents:create','2026-10-10 16:41:21'),
('52d8da53-c49b-11f1-a0d7-52540021303b','documents:delete','documents','delete','Staff API capability: documents:delete','2026-10-10 16:41:21'),
('52e83f8b-c49b-11f1-a0d7-52540021303b','documents:deliver','documents','deliver','Staff API capability: documents:deliver','2026-10-10 16:41:21'),
('52f6eb78-c49b-11f1-a0d7-52540021303b','documents:read','documents','read','Staff API capability: documents:read','2026-10-10 16:41:21'),
('5305c669-c49b-11f1-a0d7-52540021303b','documents:update','documents','update','Staff API capability: documents:update','2026-10-10 16:41:21'),
('53148b7c-c49b-11f1-a0d7-52540021303b','dpr-admin-documents:create','dpr-admin-documents','create','Staff API capability: dpr-admin-documents:create','2026-10-10 16:41:21'),
('532308e1-c49b-11f1-a0d7-52540021303b','dpr-admin-documents:export','dpr-admin-documents','export','Staff API capability: dpr-admin-documents:export','2026-10-10 16:41:21'),
('53316ae2-c49b-11f1-a0d7-52540021303b','dpr-admin-documents:read','dpr-admin-documents','read','Staff API capability: dpr-admin-documents:read','2026-10-10 16:41:21'),
('533fcc5f-c49b-11f1-a0d7-52540021303b','dpr-admin-logs:create','dpr-admin-logs','create','Staff API capability: dpr-admin-logs:create','2026-10-10 16:41:22'),
('534e4f34-c49b-11f1-a0d7-52540021303b','dpr-admin-logs:delete','dpr-admin-logs','delete','Staff API capability: dpr-admin-logs:delete','2026-10-10 16:41:22'),
('535c91c2-c49b-11f1-a0d7-52540021303b','dpr-admin-logs:read','dpr-admin-logs','read','Staff API capability: dpr-admin-logs:read','2026-10-10 16:41:22'),
('536b249c-c49b-11f1-a0d7-52540021303b','dpr-admin-logs:update','dpr-admin-logs','update','Staff API capability: dpr-admin-logs:update','2026-10-10 16:41:22'),
('53797c42-c49b-11f1-a0d7-52540021303b','dpr-admin-reports:create','dpr-admin-reports','create','Staff API capability: dpr-admin-reports:create','2026-10-10 16:41:22'),
('5387fdbe-c49b-11f1-a0d7-52540021303b','dpr-admin-reports:delete','dpr-admin-reports','delete','Staff API capability: dpr-admin-reports:delete','2026-10-10 16:41:22'),
('5397c547-c49b-11f1-a0d7-52540021303b','dpr-admin-reports:export','dpr-admin-reports','export','Staff API capability: dpr-admin-reports:export','2026-10-10 16:41:22'),
('53aa9247-c49b-11f1-a0d7-52540021303b','dpr-admin-reports:read','dpr-admin-reports','read','Staff API capability: dpr-admin-reports:read','2026-10-10 16:41:22'),
('53bb6743-c49b-11f1-a0d7-52540021303b','dpr-admin-reports:update','dpr-admin-reports','update','Staff API capability: dpr-admin-reports:update','2026-10-10 16:41:22'),
('53cc1d17-c49b-11f1-a0d7-52540021303b','drawings:create','drawings','create','Staff API capability: drawings:create','2026-10-10 16:41:23'),
('53db3153-c49b-11f1-a0d7-52540021303b','drawings:delete','drawings','delete','Staff API capability: drawings:delete','2026-10-10 16:41:23'),
('53e9beba-c49b-11f1-a0d7-52540021303b','drawings:read','drawings','read','Staff API capability: drawings:read','2026-10-10 16:41:23'),
('53f8815a-c49b-11f1-a0d7-52540021303b','drawings:update','drawings','update','Staff API capability: drawings:update','2026-10-10 16:41:23'),
('54259b2f-c49b-11f1-a0d7-52540021303b','gates:create','gates','create','Staff API capability: gates:create','2026-10-10 16:41:23'),
('5476712e-c49b-11f1-a0d7-52540021303b','google-calendar:create','google-calendar','create','Staff API capability: google-calendar:create','2026-10-10 16:41:24'),
('548567df-c49b-11f1-a0d7-52540021303b','google-calendar:delete','google-calendar','delete','Staff API capability: google-calendar:delete','2026-10-10 16:41:24'),
('54942346-c49b-11f1-a0d7-52540021303b','google-calendar:read','google-calendar','read','Staff API capability: google-calendar:read','2026-10-10 16:41:24'),
('54a2b8ad-c49b-11f1-a0d7-52540021303b','google-calendar:update','google-calendar','update','Staff API capability: google-calendar:update','2026-10-10 16:41:24'),
('54b16376-c49b-11f1-a0d7-52540021303b','google-tasks:complete','google-tasks','complete','Staff API capability: google-tasks:complete','2026-10-10 16:41:24'),
('54c28e0a-c49b-11f1-a0d7-52540021303b','google-tasks:create','google-tasks','create','Staff API capability: google-tasks:create','2026-10-10 16:41:24'),
('54d10a15-c49b-11f1-a0d7-52540021303b','google-tasks:delete','google-tasks','delete','Staff API capability: google-tasks:delete','2026-10-10 16:41:24'),
('54df63e0-c49b-11f1-a0d7-52540021303b','google-tasks:read','google-tasks','read','Staff API capability: google-tasks:read','2026-10-10 16:41:24'),
('54edca99-c49b-11f1-a0d7-52540021303b','google-tasks:update','google-tasks','update','Staff API capability: google-tasks:update','2026-10-10 16:41:24'),
('54fc2afd-c49b-11f1-a0d7-52540021303b','inventory:adjust','inventory','adjust','Staff API capability: inventory:adjust','2026-10-10 16:41:24'),
('550b324c-c49b-11f1-a0d7-52540021303b','inventory:create','inventory','create','Staff API capability: inventory:create','2026-10-10 16:41:25'),
('5519eeab-c49b-11f1-a0d7-52540021303b','inventory:deliver','inventory','deliver','Staff API capability: inventory:deliver','2026-10-10 16:41:25'),
('552890af-c49b-11f1-a0d7-52540021303b','inventory:issue','inventory','issue','Staff API capability: inventory:issue','2026-10-10 16:41:25'),
('553732d5-c49b-11f1-a0d7-52540021303b','inventory:read','inventory','read','Staff API capability: inventory:read','2026-10-10 16:41:25'),
('55464e21-c49b-11f1-a0d7-52540021303b','inventory:return','inventory','return','Staff API capability: inventory:return','2026-10-10 16:41:25'),
('5554defc-c49b-11f1-a0d7-52540021303b','inventory:transfer','inventory','transfer','Staff API capability: inventory:transfer','2026-10-10 16:41:25'),
('5563ecca-c49b-11f1-a0d7-52540021303b','leads:create','leads','create','Staff API capability: leads:create','2026-10-10 16:41:25'),
('5572a06f-c49b-11f1-a0d7-52540021303b','leads:delete','leads','delete','Staff API capability: leads:delete','2026-10-10 16:41:25'),
('558146f9-c49b-11f1-a0d7-52540021303b','leads:read','leads','read','Staff API capability: leads:read','2026-10-10 16:41:25'),
('558fb34b-c49b-11f1-a0d7-52540021303b','leads:sync','leads','sync','Staff API capability: leads:sync','2026-10-10 16:41:25'),
('559e1d4f-c49b-11f1-a0d7-52540021303b','leads:update','leads','update','Staff API capability: leads:update','2026-10-10 16:41:26'),
('55e8931b-c49b-11f1-a0d7-52540021303b','library:read','library','read','Staff API capability: library:read','2026-10-10 16:41:26'),
('56147708-c49b-11f1-a0d7-52540021303b','material-procurement:create','material-procurement','create','Staff API capability: material-procurement:create','2026-10-10 16:41:26'),
('5622de0e-c49b-11f1-a0d7-52540021303b','material-procurement:delete','material-procurement','delete','Staff API capability: material-procurement:delete','2026-10-10 16:41:26'),
('56319fe4-c49b-11f1-a0d7-52540021303b','material-procurement:read','material-procurement','read','Staff API capability: material-procurement:read','2026-10-10 16:41:27'),
('564059d4-c49b-11f1-a0d7-52540021303b','material-procurement:submit','material-procurement','submit','Staff API capability: material-procurement:submit','2026-10-10 16:41:27'),
('564eb2ec-c49b-11f1-a0d7-52540021303b','material-procurement:update','material-procurement','update','Staff API capability: material-procurement:update','2026-10-10 16:41:27'),
('565cf5fd-c49b-11f1-a0d7-52540021303b','materials:create','materials','create','Staff API capability: materials:create','2026-10-10 16:41:27'),
('566b3b4f-c49b-11f1-a0d7-52540021303b','materials:delete','materials','delete','Staff API capability: materials:delete','2026-10-10 16:41:27'),
('56797f6d-c49b-11f1-a0d7-52540021303b','materials:read','materials','read','Staff API capability: materials:read','2026-10-10 16:41:27'),
('5687d86d-c49b-11f1-a0d7-52540021303b','materials:update','materials','update','Staff API capability: materials:update','2026-10-10 16:41:27'),
('56964305-c49b-11f1-a0d7-52540021303b','notes:create','notes','create','Staff API capability: notes:create','2026-10-10 16:41:27'),
('56a55a2f-c49b-11f1-a0d7-52540021303b','notes:delete','notes','delete','Staff API capability: notes:delete','2026-10-10 16:41:27'),
('56b40667-c49b-11f1-a0d7-52540021303b','notes:read','notes','read','Staff API capability: notes:read','2026-10-10 16:41:27'),
('56c28d25-c49b-11f1-a0d7-52540021303b','notes:update','notes','update','Staff API capability: notes:update','2026-10-10 16:41:27'),
('56d11615-c49b-11f1-a0d7-52540021303b','notifications:delete','notifications','delete','Staff API capability: notifications:delete','2026-10-10 16:41:28'),
('56df964d-c49b-11f1-a0d7-52540021303b','notifications:read','notifications','read','Staff API capability: notifications:read','2026-10-10 16:41:28'),
('56ee50c9-c49b-11f1-a0d7-52540021303b','notifications:update','notifications','update','Staff API capability: notifications:update','2026-10-10 16:41:28'),
('56fcb6aa-c49b-11f1-a0d7-52540021303b','onedrive:create','onedrive','create','Staff API capability: onedrive:create','2026-10-10 16:41:28'),
('570b4dcf-c49b-11f1-a0d7-52540021303b','onedrive:delete','onedrive','delete','Staff API capability: onedrive:delete','2026-10-10 16:41:28'),
('5719f0f4-c49b-11f1-a0d7-52540021303b','onedrive:read','onedrive','read','Staff API capability: onedrive:read','2026-10-10 16:41:28'),
('57285b16-c49b-11f1-a0d7-52540021303b','onedrive:update','onedrive','update','Staff API capability: onedrive:update','2026-10-10 16:41:28'),
('5736b56a-c49b-11f1-a0d7-52540021303b','onedrive:upload','onedrive','upload','Staff API capability: onedrive:upload','2026-10-10 16:41:28'),
('57451ff9-c49b-11f1-a0d7-52540021303b','payment-schedules:create','payment-schedules','create','Staff API capability: payment-schedules:create','2026-10-10 16:41:28'),
('5753660f-c49b-11f1-a0d7-52540021303b','payment-schedules:delete','payment-schedules','delete','Staff API capability: payment-schedules:delete','2026-10-10 16:41:28'),
('5761aa24-c49b-11f1-a0d7-52540021303b','payment-schedules:read','payment-schedules','read','Staff API capability: payment-schedules:read','2026-10-10 16:41:29'),
('5770604a-c49b-11f1-a0d7-52540021303b','payment-schedules:update','payment-schedules','update','Staff API capability: payment-schedules:update','2026-10-10 16:41:29'),
('577ee35a-c49b-11f1-a0d7-52540021303b','permissions:create','permissions','create','Staff API capability: permissions:create','2026-10-10 16:41:29'),
('578d51b4-c49b-11f1-a0d7-52540021303b','permissions:delete','permissions','delete','Staff API capability: permissions:delete','2026-10-10 16:41:29'),
('579bb41f-c49b-11f1-a0d7-52540021303b','permissions:read','permissions','read','Staff API capability: permissions:read','2026-10-10 16:41:29'),
('57aa22fd-c49b-11f1-a0d7-52540021303b','permissions:update','permissions','update','Staff API capability: permissions:update','2026-10-10 16:41:29'),
('57b8cbde-c49b-11f1-a0d7-52540021303b','phase-definitions:read','phase-definitions','read','Staff API capability: phase-definitions:read','2026-10-10 16:41:29'),
('57c7541b-c49b-11f1-a0d7-52540021303b','plan-of-actions:create','plan-of-actions','create','Staff API capability: plan-of-actions:create','2026-10-10 16:41:29'),
('57d5bf9f-c49b-11f1-a0d7-52540021303b','plan-of-actions:delete','plan-of-actions','delete','Staff API capability: plan-of-actions:delete','2026-10-10 16:41:29'),
('57e41824-c49b-11f1-a0d7-52540021303b','plan-of-actions:publish','plan-of-actions','publish','Staff API capability: plan-of-actions:publish','2026-10-10 16:41:29'),
('57f2817e-c49b-11f1-a0d7-52540021303b','plan-of-actions:read','plan-of-actions','read','Staff API capability: plan-of-actions:read','2026-10-10 16:41:29'),
('58010369-c49b-11f1-a0d7-52540021303b','plan-of-actions:update','plan-of-actions','update','Staff API capability: plan-of-actions:update','2026-10-10 16:41:30'),
('58104408-c49b-11f1-a0d7-52540021303b','procurement-estimates:approve','procurement-estimates','approve','Staff API capability: procurement-estimates:approve','2026-10-10 16:41:30'),
('581eff93-c49b-11f1-a0d7-52540021303b','procurement-estimates:create','procurement-estimates','create','Staff API capability: procurement-estimates:create','2026-10-10 16:41:30'),
('582d7c54-c49b-11f1-a0d7-52540021303b','procurement-estimates:read','procurement-estimates','read','Staff API capability: procurement-estimates:read','2026-10-10 16:41:30'),
('583c0cc1-c49b-11f1-a0d7-52540021303b','procurement-estimates:reject','procurement-estimates','reject','Staff API capability: procurement-estimates:reject','2026-10-10 16:41:30'),
('584b6596-c49b-11f1-a0d7-52540021303b','procurement-quotations:accept','procurement-quotations','accept','Staff API capability: procurement-quotations:accept','2026-10-10 16:41:30'),
('5859e46c-c49b-11f1-a0d7-52540021303b','procurement-quotations:create','procurement-quotations','create','Staff API capability: procurement-quotations:create','2026-10-10 16:41:30'),
('586863e4-c49b-11f1-a0d7-52540021303b','procurement-quotations:read','procurement-quotations','read','Staff API capability: procurement-quotations:read','2026-10-10 16:41:30'),
('5876d227-c49b-11f1-a0d7-52540021303b','procurement-quotations:reject','procurement-quotations','reject','Staff API capability: procurement-quotations:reject','2026-10-10 16:41:30'),
('588538af-c49b-11f1-a0d7-52540021303b','procurement-quotations:send','procurement-quotations','send','Staff API capability: procurement-quotations:send','2026-10-10 16:41:30'),
('58938cd5-c49b-11f1-a0d7-52540021303b','procurement-rate-sheets:approve','procurement-rate-sheets','approve','Staff API capability: procurement-rate-sheets:approve','2026-10-10 16:41:31'),
('58a1e92f-c49b-11f1-a0d7-52540021303b','procurement-rate-sheets:create','procurement-rate-sheets','create','Staff API capability: procurement-rate-sheets:create','2026-10-10 16:41:31'),
('58b08e74-c49b-11f1-a0d7-52540021303b','procurement-rate-sheets:delete','procurement-rate-sheets','delete','Staff API capability: procurement-rate-sheets:delete','2026-10-10 16:41:31'),
('58bf2127-c49b-11f1-a0d7-52540021303b','procurement-rate-sheets:read','procurement-rate-sheets','read','Staff API capability: procurement-rate-sheets:read','2026-10-10 16:41:31'),
('58cd8d8d-c49b-11f1-a0d7-52540021303b','procurement-rate-sheets:reject','procurement-rate-sheets','reject','Staff API capability: procurement-rate-sheets:reject','2026-10-10 16:41:31'),
('58dbe38a-c49b-11f1-a0d7-52540021303b','procurement-requirements:create','procurement-requirements','create','Staff API capability: procurement-requirements:create','2026-10-10 16:41:31'),
('58ea774b-c49b-11f1-a0d7-52540021303b','procurement-requirements:delete','procurement-requirements','delete','Staff API capability: procurement-requirements:delete','2026-10-10 16:41:31'),
('58f8e16b-c49b-11f1-a0d7-52540021303b','procurement-requirements:read','procurement-requirements','read','Staff API capability: procurement-requirements:read','2026-10-10 16:41:31'),
('59075fdb-c49b-11f1-a0d7-52540021303b','procurement-requirements:update','procurement-requirements','update','Staff API capability: procurement-requirements:update','2026-10-10 16:41:31'),
('5915bbf9-c49b-11f1-a0d7-52540021303b','procurement-sample-boards:approve','procurement-sample-boards','approve','Staff API capability: procurement-sample-boards:approve','2026-10-10 16:41:31'),
('592424b2-c49b-11f1-a0d7-52540021303b','procurement-sample-boards:create','procurement-sample-boards','create','Staff API capability: procurement-sample-boards:create','2026-10-10 16:41:31'),
('5933042e-c49b-11f1-a0d7-52540021303b','procurement-sample-boards:delete','procurement-sample-boards','delete','Staff API capability: procurement-sample-boards:delete','2026-10-10 16:41:32'),
('594146f4-c49b-11f1-a0d7-52540021303b','procurement-sample-boards:read','procurement-sample-boards','read','Staff API capability: procurement-sample-boards:read','2026-10-10 16:41:32'),
('594fbc68-c49b-11f1-a0d7-52540021303b','procurement-sample-boards:reject','procurement-sample-boards','reject','Staff API capability: procurement-sample-boards:reject','2026-10-10 16:41:32'),
('595e3be5-c49b-11f1-a0d7-52540021303b','project-briefs:create','project-briefs','create','Staff API capability: project-briefs:create','2026-10-10 16:41:32'),
('596ce265-c49b-11f1-a0d7-52540021303b','project-briefs:delete','project-briefs','delete','Staff API capability: project-briefs:delete','2026-10-10 16:41:32'),
('597b650b-c49b-11f1-a0d7-52540021303b','project-briefs:read','project-briefs','read','Staff API capability: project-briefs:read','2026-10-10 16:41:32'),
('5989ddee-c49b-11f1-a0d7-52540021303b','project-briefs:update','project-briefs','update','Staff API capability: project-briefs:update','2026-10-10 16:41:32'),
('59984a70-c49b-11f1-a0d7-52540021303b','project-briefs:upload','project-briefs','upload','Staff API capability: project-briefs:upload','2026-10-10 16:41:32'),
('59a6a5a3-c49b-11f1-a0d7-52540021303b','project-dashboard:read','project-dashboard','read','Staff API capability: project-dashboard:read','2026-10-10 16:41:32'),
('59b53ae4-c49b-11f1-a0d7-52540021303b','project-planners:create','project-planners','create','Staff API capability: project-planners:create','2026-10-10 16:41:32'),
('59c3b65d-c49b-11f1-a0d7-52540021303b','project-planners:delete','project-planners','delete','Staff API capability: project-planners:delete','2026-10-10 16:41:33'),
('59d21256-c49b-11f1-a0d7-52540021303b','project-planners:generate','project-planners','generate','Staff API capability: project-planners:generate','2026-10-10 16:41:33'),
('59e0b334-c49b-11f1-a0d7-52540021303b','project-planners:read','project-planners','read','Staff API capability: project-planners:read','2026-10-10 16:41:33'),
('59ef5616-c49b-11f1-a0d7-52540021303b','project-planners:update','project-planners','update','Staff API capability: project-planners:update','2026-10-10 16:41:33'),
('59fdd97d-c49b-11f1-a0d7-52540021303b','project-shortlists:create','project-shortlists','create','Staff API capability: project-shortlists:create','2026-10-10 16:41:33'),
('5a0c5b79-c49b-11f1-a0d7-52540021303b','project-shortlists:delete','project-shortlists','delete','Staff API capability: project-shortlists:delete','2026-10-10 16:41:33'),
('5a1ab464-c49b-11f1-a0d7-52540021303b','project-shortlists:export','project-shortlists','export','Staff API capability: project-shortlists:export','2026-10-10 16:41:33'),
('5a29a360-c49b-11f1-a0d7-52540021303b','project-shortlists:read','project-shortlists','read','Staff API capability: project-shortlists:read','2026-10-10 16:41:33'),
('5a385bab-c49b-11f1-a0d7-52540021303b','project-shortlists:update','project-shortlists','update','Staff API capability: project-shortlists:update','2026-10-10 16:41:33'),
('5a471219-c49b-11f1-a0d7-52540021303b','project-types:create','project-types','create','Staff API capability: project-types:create','2026-10-10 16:41:33'),
('5a55beab-c49b-11f1-a0d7-52540021303b','project-types:delete','project-types','delete','Staff API capability: project-types:delete','2026-10-10 16:41:33'),
('5a6489c0-c49b-11f1-a0d7-52540021303b','project-types:read','project-types','read','Staff API capability: project-types:read','2026-10-10 16:41:34'),
('5a731f49-c49b-11f1-a0d7-52540021303b','project-types:update','project-types','update','Staff API capability: project-types:update','2026-10-10 16:41:34'),
('5a81f550-c49b-11f1-a0d7-52540021303b','projects-phases:create','projects-phases','create','Staff API capability: projects-phases:create','2026-10-10 16:41:34'),
('5a919ab9-c49b-11f1-a0d7-52540021303b','projects-phases:delete','projects-phases','delete','Staff API capability: projects-phases:delete','2026-10-10 16:41:34'),
('5aa0a6cd-c49b-11f1-a0d7-52540021303b','projects-phases:read','projects-phases','read','Staff API capability: projects-phases:read','2026-10-10 16:41:34'),
('5aaf43b4-c49b-11f1-a0d7-52540021303b','projects-phases:update','projects-phases','update','Staff API capability: projects-phases:update','2026-10-10 16:41:34'),
('5abdc5d4-c49b-11f1-a0d7-52540021303b','projects:create','projects','create','Staff API capability: projects:create','2026-10-10 16:41:34'),
('5acc5728-c49b-11f1-a0d7-52540021303b','projects:delete','projects','delete','Staff API capability: projects:delete','2026-10-10 16:41:34'),
('5adaa343-c49b-11f1-a0d7-52540021303b','projects:read','projects','read','Staff API capability: projects:read','2026-10-10 16:41:34'),
('5ae9d41e-c49b-11f1-a0d7-52540021303b','projects:restore','projects','restore','Staff API capability: projects:restore','2026-10-10 16:41:34'),
('5af854bc-c49b-11f1-a0d7-52540021303b','projects:update','projects','update','Staff API capability: projects:update','2026-10-10 16:41:35'),
('5b06d225-c49b-11f1-a0d7-52540021303b','purchase-orders:approve','purchase-orders','approve','Staff API capability: purchase-orders:approve','2026-10-10 16:41:35'),
('5b1517c8-c49b-11f1-a0d7-52540021303b','purchase-orders:cancel','purchase-orders','cancel','Staff API capability: purchase-orders:cancel','2026-10-10 16:41:35'),
('5b23819f-c49b-11f1-a0d7-52540021303b','purchase-orders:create','purchase-orders','create','Staff API capability: purchase-orders:create','2026-10-10 16:41:35'),
('5b31fecd-c49b-11f1-a0d7-52540021303b','purchase-orders:delete','purchase-orders','delete','Staff API capability: purchase-orders:delete','2026-10-10 16:41:35'),
('5b4095a8-c49b-11f1-a0d7-52540021303b','purchase-orders:read','purchase-orders','read','Staff API capability: purchase-orders:read','2026-10-10 16:41:35'),
('5b4effc1-c49b-11f1-a0d7-52540021303b','purchase-orders:update','purchase-orders','update','Staff API capability: purchase-orders:update','2026-10-10 16:41:35'),
('5b5d5298-c49b-11f1-a0d7-52540021303b','quality-checklists:create','quality-checklists','create','Staff API capability: quality-checklists:create','2026-10-10 16:41:35'),
('5b6bea58-c49b-11f1-a0d7-52540021303b','quality-checklists:delete','quality-checklists','delete','Staff API capability: quality-checklists:delete','2026-10-10 16:41:35'),
('5b7a4148-c49b-11f1-a0d7-52540021303b','quality-checklists:export','quality-checklists','export','Staff API capability: quality-checklists:export','2026-10-10 16:41:35'),
('5b88bc3b-c49b-11f1-a0d7-52540021303b','quality-checklists:read','quality-checklists','read','Staff API capability: quality-checklists:read','2026-10-10 16:41:35'),
('5b97184b-c49b-11f1-a0d7-52540021303b','quality-checklists:update','quality-checklists','update','Staff API capability: quality-checklists:update','2026-10-10 16:41:36'),
('5ba5a989-c49b-11f1-a0d7-52540021303b','quotation-items:create','quotation-items','create','Staff API capability: quotation-items:create','2026-10-10 16:41:36'),
('5bb426fb-c49b-11f1-a0d7-52540021303b','quotation-items:delete','quotation-items','delete','Staff API capability: quotation-items:delete','2026-10-10 16:41:36'),
('5bc2b77a-c49b-11f1-a0d7-52540021303b','quotation-items:read','quotation-items','read','Staff API capability: quotation-items:read','2026-10-10 16:41:36'),
('5bd12466-c49b-11f1-a0d7-52540021303b','quotation-items:update','quotation-items','update','Staff API capability: quotation-items:update','2026-10-10 16:41:36'),
('5bdfa8ea-c49b-11f1-a0d7-52540021303b','quotations:approve','quotations','approve','Staff API capability: quotations:approve','2026-10-10 16:41:36'),
('5bee4a75-c49b-11f1-a0d7-52540021303b','quotations:create','quotations','create','Staff API capability: quotations:create','2026-10-10 16:41:36'),
('5bfcca39-c49b-11f1-a0d7-52540021303b','quotations:delete','quotations','delete','Staff API capability: quotations:delete','2026-10-10 16:41:36'),
('5c0b47c4-c49b-11f1-a0d7-52540021303b','quotations:export','quotations','export','Staff API capability: quotations:export','2026-10-10 16:41:36'),
('5c19f0c4-c49b-11f1-a0d7-52540021303b','quotations:read','quotations','read','Staff API capability: quotations:read','2026-10-10 16:41:36'),
('5c2871ff-c49b-11f1-a0d7-52540021303b','quotations:restore','quotations','restore','Staff API capability: quotations:restore','2026-10-10 16:41:37'),
('5c3726ea-c49b-11f1-a0d7-52540021303b','quotations:select','quotations','select','Staff API capability: quotations:select','2026-10-10 16:41:37'),
('5c45b806-c49b-11f1-a0d7-52540021303b','quotations:submit','quotations','submit','Staff API capability: quotations:submit','2026-10-10 16:41:37'),
('5c542675-c49b-11f1-a0d7-52540021303b','quotations:update','quotations','update','Staff API capability: quotations:update','2026-10-10 16:41:37'),
('5c627ea1-c49b-11f1-a0d7-52540021303b','rbac:create','rbac','create','Staff API capability: rbac:create','2026-10-10 16:41:37'),
('5c710828-c49b-11f1-a0d7-52540021303b','rbac:delete','rbac','delete','Staff API capability: rbac:delete','2026-10-10 16:41:37'),
('5c7f98e0-c49b-11f1-a0d7-52540021303b','rbac:read','rbac','read','Staff API capability: rbac:read','2026-10-10 16:41:37'),
('5c8e17a6-c49b-11f1-a0d7-52540021303b','rbac:update','rbac','update','Staff API capability: rbac:update','2026-10-10 16:41:37'),
('5c9cbc63-c49b-11f1-a0d7-52540021303b','reports:read','reports','read','Staff API capability: reports:read','2026-10-10 16:41:37'),
('5cab4fa8-c49b-11f1-a0d7-52540021303b','role-apps:assign','role-apps','assign','Staff API capability: role-apps:assign','2026-10-10 16:41:37'),
('5cb9f2a8-c49b-11f1-a0d7-52540021303b','role-apps:grant','role-apps','grant','Staff API capability: role-apps:grant','2026-10-10 16:41:37'),
('5cc89f0d-c49b-11f1-a0d7-52540021303b','role-apps:read','role-apps','read','Staff API capability: role-apps:read','2026-10-10 16:41:38'),
('5cd71f7c-c49b-11f1-a0d7-52540021303b','role-apps:revoke','role-apps','revoke','Staff API capability: role-apps:revoke','2026-10-10 16:41:38'),
('5ce58567-c49b-11f1-a0d7-52540021303b','role-apps:update','role-apps','update','Staff API capability: role-apps:update','2026-10-10 16:41:38'),
('5cf42b2e-c49b-11f1-a0d7-52540021303b','role-permissions:assign','role-permissions','assign','Staff API capability: role-permissions:assign','2026-10-10 16:41:38'),
('5d02b2de-c49b-11f1-a0d7-52540021303b','role-permissions:grant','role-permissions','grant','Staff API capability: role-permissions:grant','2026-10-10 16:41:38'),
('5d113ea1-c49b-11f1-a0d7-52540021303b','role-permissions:read','role-permissions','read','Staff API capability: role-permissions:read','2026-10-10 16:41:38'),
('5d1fbc43-c49b-11f1-a0d7-52540021303b','role-permissions:revoke','role-permissions','revoke','Staff API capability: role-permissions:revoke','2026-10-10 16:41:38'),
('5d2e5a5f-c49b-11f1-a0d7-52540021303b','scope-of-work:create','scope-of-work','create','Staff API capability: scope-of-work:create','2026-10-10 16:41:38'),
('5d3ccd94-c49b-11f1-a0d7-52540021303b','scope-of-work:delete','scope-of-work','delete','Staff API capability: scope-of-work:delete','2026-10-10 16:41:38'),
('5d4b608c-c49b-11f1-a0d7-52540021303b','scope-of-work:read','scope-of-work','read','Staff API capability: scope-of-work:read','2026-10-10 16:41:38'),
('5d59f16a-c49b-11f1-a0d7-52540021303b','scope-of-work:update','scope-of-work','update','Staff API capability: scope-of-work:update','2026-10-10 16:41:39'),
('5d688a94-c49b-11f1-a0d7-52540021303b','search:read','search','read','Staff API capability: search:read','2026-10-10 16:41:39'),
('5d772fe0-c49b-11f1-a0d7-52540021303b','search:reindex','search','reindex','Staff API capability: search:reindex','2026-10-10 16:41:39'),
('5d8598bd-c49b-11f1-a0d7-52540021303b','sessions:read-any','sessions','read-any','Staff API capability: sessions:read-any','2026-10-10 16:41:39'),
('5d9414f1-c49b-11f1-a0d7-52540021303b','sessions:revoke-any','sessions','revoke-any','Staff API capability: sessions:revoke-any','2026-10-10 16:41:39'),
('5da28049-c49b-11f1-a0d7-52540021303b','settings:create','settings','create','Staff API capability: settings:create','2026-10-10 16:41:39'),
('5db1146d-c49b-11f1-a0d7-52540021303b','settings:delete','settings','delete','Staff API capability: settings:delete','2026-10-10 16:41:39'),
('5dbff710-c49b-11f1-a0d7-52540021303b','settings:read','settings','read','Staff API capability: settings:read','2026-10-10 16:41:39'),
('5dce4c4b-c49b-11f1-a0d7-52540021303b','settings:update','settings','update','Staff API capability: settings:update','2026-10-10 16:41:39'),
('5ddccb4e-c49b-11f1-a0d7-52540021303b','shortlist-entries:create','shortlist-entries','create','Staff API capability: shortlist-entries:create','2026-10-10 16:41:39'),
('5deb217f-c49b-11f1-a0d7-52540021303b','shortlist-entries:delete','shortlist-entries','delete','Staff API capability: shortlist-entries:delete','2026-10-10 16:41:39'),
('5df9846c-c49b-11f1-a0d7-52540021303b','shortlist-entries:read','shortlist-entries','read','Staff API capability: shortlist-entries:read','2026-10-10 16:41:40'),
('5e082afa-c49b-11f1-a0d7-52540021303b','shortlist-entries:select','shortlist-entries','select','Staff API capability: shortlist-entries:select','2026-10-10 16:41:40'),
('5e16ba11-c49b-11f1-a0d7-52540021303b','shortlist-entries:update','shortlist-entries','update','Staff API capability: shortlist-entries:update','2026-10-10 16:41:40'),
('5e252683-c49b-11f1-a0d7-52540021303b','shortlist-packages:apply','shortlist-packages','apply','Staff API capability: shortlist-packages:apply','2026-10-10 16:41:40'),
('5e33a709-c49b-11f1-a0d7-52540021303b','shortlist-packages:create','shortlist-packages','create','Staff API capability: shortlist-packages:create','2026-10-10 16:41:40'),
('5e42fd1a-c49b-11f1-a0d7-52540021303b','shortlist-packages:delete','shortlist-packages','delete','Staff API capability: shortlist-packages:delete','2026-10-10 16:41:40'),
('5e516817-c49b-11f1-a0d7-52540021303b','shortlist-packages:read','shortlist-packages','read','Staff API capability: shortlist-packages:read','2026-10-10 16:41:40'),
('5e604a46-c49b-11f1-a0d7-52540021303b','site-ops-checklists:create','site-ops-checklists','create','Staff API capability: site-ops-checklists:create','2026-10-10 16:41:40'),
('5e6ea27b-c49b-11f1-a0d7-52540021303b','site-ops-checklists:read','site-ops-checklists','read','Staff API capability: site-ops-checklists:read','2026-10-10 16:41:40'),
('5e7d32ef-c49b-11f1-a0d7-52540021303b','site-ops-daily-reports:create','site-ops-daily-reports','create','Staff API capability: site-ops-daily-reports:create','2026-10-10 16:41:40'),
('5e8b76ad-c49b-11f1-a0d7-52540021303b','site-ops-daily-reports:delete','site-ops-daily-reports','delete','Staff API capability: site-ops-daily-reports:delete','2026-10-10 16:41:41'),
('5e99e19c-c49b-11f1-a0d7-52540021303b','site-ops-daily-reports:read','site-ops-daily-reports','read','Staff API capability: site-ops-daily-reports:read','2026-10-10 16:41:41'),
('5ea89d33-c49b-11f1-a0d7-52540021303b','site-ops-daily-reports:share','site-ops-daily-reports','share','Staff API capability: site-ops-daily-reports:share','2026-10-10 16:41:41'),
('5eb74719-c49b-11f1-a0d7-52540021303b','site-ops-daily-reports:update','site-ops-daily-reports','update','Staff API capability: site-ops-daily-reports:update','2026-10-10 16:41:41'),
('5ec5c8f6-c49b-11f1-a0d7-52540021303b','site-ops-daily-reports:upload','site-ops-daily-reports','upload','Staff API capability: site-ops-daily-reports:upload','2026-10-10 16:41:41'),
('5ed4415b-c49b-11f1-a0d7-52540021303b','site-ops-mockups:create','site-ops-mockups','create','Staff API capability: site-ops-mockups:create','2026-10-10 16:41:41'),
('5ee2f707-c49b-11f1-a0d7-52540021303b','site-ops-mockups:read','site-ops-mockups','read','Staff API capability: site-ops-mockups:read','2026-10-10 16:41:41'),
('5ef1cbaa-c49b-11f1-a0d7-52540021303b','site-ops-mockups:update','site-ops-mockups','update','Staff API capability: site-ops-mockups:update','2026-10-10 16:41:41'),
('5f004673-c49b-11f1-a0d7-52540021303b','site-ops-qc:read','site-ops-qc','read','Staff API capability: site-ops-qc:read','2026-10-10 16:41:41'),
('5f0eb0f3-c49b-11f1-a0d7-52540021303b','site-ops-qc:sign-off','site-ops-qc','sign-off','Staff API capability: site-ops-qc:sign-off','2026-10-10 16:41:41'),
('5f1d0c50-c49b-11f1-a0d7-52540021303b','site-ops-rfis:create','site-ops-rfis','create','Staff API capability: site-ops-rfis:create','2026-10-10 16:41:41'),
('5f2b7254-c49b-11f1-a0d7-52540021303b','site-ops-rfis:read','site-ops-rfis','read','Staff API capability: site-ops-rfis:read','2026-10-10 16:41:42'),
('5f3a1e82-c49b-11f1-a0d7-52540021303b','site-ops-rfis:update','site-ops-rfis','update','Staff API capability: site-ops-rfis:update','2026-10-10 16:41:42'),
('5f48e95f-c49b-11f1-a0d7-52540021303b','site-ops-snag-lists:create','site-ops-snag-lists','create','Staff API capability: site-ops-snag-lists:create','2026-10-10 16:41:42'),
('5f577c43-c49b-11f1-a0d7-52540021303b','site-ops-snag-lists:export','site-ops-snag-lists','export','Staff API capability: site-ops-snag-lists:export','2026-10-10 16:41:42'),
('5f65d1bd-c49b-11f1-a0d7-52540021303b','site-ops-snag-lists:read','site-ops-snag-lists','read','Staff API capability: site-ops-snag-lists:read','2026-10-10 16:41:42'),
('5f748888-c49b-11f1-a0d7-52540021303b','site-ops-snag-lists:update','site-ops-snag-lists','update','Staff API capability: site-ops-snag-lists:update','2026-10-10 16:41:42'),
('5f83631e-c49b-11f1-a0d7-52540021303b','site-ops-snag-lists:upload','site-ops-snag-lists','upload','Staff API capability: site-ops-snag-lists:upload','2026-10-10 16:41:42'),
('5f91d093-c49b-11f1-a0d7-52540021303b','site-ops-visits:assign','site-ops-visits','assign','Staff API capability: site-ops-visits:assign','2026-10-10 16:41:42'),
('5fa0373d-c49b-11f1-a0d7-52540021303b','site-ops-visits:check-in','site-ops-visits','check-in','Staff API capability: site-ops-visits:check-in','2026-10-10 16:41:42'),
('5faf1f62-c49b-11f1-a0d7-52540021303b','site-ops-visits:create','site-ops-visits','create','Staff API capability: site-ops-visits:create','2026-10-10 16:41:42'),
('5fbd866a-c49b-11f1-a0d7-52540021303b','site-ops-visits:read','site-ops-visits','read','Staff API capability: site-ops-visits:read','2026-10-10 16:41:43'),
('5fcbf941-c49b-11f1-a0d7-52540021303b','site-ops-visits:update','site-ops-visits','update','Staff API capability: site-ops-visits:update','2026-10-10 16:41:43'),
('5fda86e3-c49b-11f1-a0d7-52540021303b','site-ops:read','site-ops','read','Staff API capability: site-ops:read','2026-10-10 16:41:43'),
('5fe8f2e8-c49b-11f1-a0d7-52540021303b','site-recces:create','site-recces','create','Staff API capability: site-recces:create','2026-10-10 16:41:43'),
('5ff7f38d-c49b-11f1-a0d7-52540021303b','site-recces:delete','site-recces','delete','Staff API capability: site-recces:delete','2026-10-10 16:41:43'),
('6006a4d8-c49b-11f1-a0d7-52540021303b','site-recces:read','site-recces','read','Staff API capability: site-recces:read','2026-10-10 16:41:43'),
('6015674a-c49b-11f1-a0d7-52540021303b','site-recces:restore','site-recces','restore','Staff API capability: site-recces:restore','2026-10-10 16:41:43'),
('6024d73f-c49b-11f1-a0d7-52540021303b','site-recces:update','site-recces','update','Staff API capability: site-recces:update','2026-10-10 16:41:43'),
('6033fcd3-c49b-11f1-a0d7-52540021303b','site-recces:upload','site-recces','upload','Staff API capability: site-recces:upload','2026-10-10 16:41:43'),
('6043a44d-c49b-11f1-a0d7-52540021303b','sync:read','sync','read','Staff API capability: sync:read','2026-10-10 16:41:43'),
('6052c190-c49b-11f1-a0d7-52540021303b','sync:sync','sync','sync','Staff API capability: sync:sync','2026-10-10 16:41:44'),
('60619298-c49b-11f1-a0d7-52540021303b','sync:update','sync','update','Staff API capability: sync:update','2026-10-10 16:41:44'),
('607016f6-c49b-11f1-a0d7-52540021303b','system:read','system','read','Staff API capability: system:read','2026-10-10 16:41:44'),
('6080e969-c49b-11f1-a0d7-52540021303b','tasks:create','tasks','create','Staff API capability: tasks:create','2026-10-10 16:41:44'),
('608f9bdd-c49b-11f1-a0d7-52540021303b','tasks:delete','tasks','delete','Staff API capability: tasks:delete','2026-10-10 16:41:44'),
('609f1a6a-c49b-11f1-a0d7-52540021303b','tasks:read','tasks','read','Staff API capability: tasks:read','2026-10-10 16:41:44'),
('60ae6b68-c49b-11f1-a0d7-52540021303b','tasks:update','tasks','update','Staff API capability: tasks:update','2026-10-10 16:41:44'),
('60bd0fd1-c49b-11f1-a0d7-52540021303b','team:create','team','create','Staff API capability: team:create','2026-10-10 16:41:44'),
('60cdd65a-c49b-11f1-a0d7-52540021303b','team:delete','team','delete','Staff API capability: team:delete','2026-10-10 16:41:44'),
('60dd1e99-c49b-11f1-a0d7-52540021303b','team:read','team','read','Staff API capability: team:read','2026-10-10 16:41:44'),
('60edc2fe-c49b-11f1-a0d7-52540021303b','team:update','team','update','Staff API capability: team:update','2026-10-10 16:41:45'),
('60fd957b-c49b-11f1-a0d7-52540021303b','terms-templates:create','terms-templates','create','Staff API capability: terms-templates:create','2026-10-10 16:41:45'),
('610c19bb-c49b-11f1-a0d7-52540021303b','terms-templates:delete','terms-templates','delete','Staff API capability: terms-templates:delete','2026-10-10 16:41:45'),
('611a9259-c49b-11f1-a0d7-52540021303b','terms-templates:read','terms-templates','read','Staff API capability: terms-templates:read','2026-10-10 16:41:45'),
('61296f24-c49b-11f1-a0d7-52540021303b','terms-templates:update','terms-templates','update','Staff API capability: terms-templates:update','2026-10-10 16:41:45'),
('61386d5d-c49b-11f1-a0d7-52540021303b','units:create','units','create','Staff API capability: units:create','2026-10-10 16:41:45'),
('6146f62a-c49b-11f1-a0d7-52540021303b','units:delete','units','delete','Staff API capability: units:delete','2026-10-10 16:41:45'),
('61583b0c-c49b-11f1-a0d7-52540021303b','units:read','units','read','Staff API capability: units:read','2026-10-10 16:41:45'),
('6166b707-c49b-11f1-a0d7-52540021303b','units:update','units','update','Staff API capability: units:update','2026-10-10 16:41:45'),
('6175e6e3-c49b-11f1-a0d7-52540021303b','user-signatures:delete','user-signatures','delete','Staff API capability: user-signatures:delete','2026-10-10 16:41:45'),
('6185bf97-c49b-11f1-a0d7-52540021303b','user-signatures:read','user-signatures','read','Staff API capability: user-signatures:read','2026-10-10 16:41:46'),
('6195539a-c49b-11f1-a0d7-52540021303b','user-signatures:upload','user-signatures','upload','Staff API capability: user-signatures:upload','2026-10-10 16:41:46'),
('61a5340d-c49b-11f1-a0d7-52540021303b','users:create','users','create','Staff API capability: users:create','2026-10-10 16:41:46'),
('61b632a7-c49b-11f1-a0d7-52540021303b','users:delete','users','delete','Staff API capability: users:delete','2026-10-10 16:41:46'),
('61c4b500-c49b-11f1-a0d7-52540021303b','users:read','users','read','Staff API capability: users:read','2026-10-10 16:41:46'),
('61d460d3-c49b-11f1-a0d7-52540021303b','users:update','users','update','Staff API capability: users:update','2026-10-10 16:41:46'),
('61e3ab6f-c49b-11f1-a0d7-52540021303b','vendor-business-types:create','vendor-business-types','create','Staff API capability: vendor-business-types:create','2026-10-10 16:41:46'),
('61f2d9f0-c49b-11f1-a0d7-52540021303b','vendor-business-types:read','vendor-business-types','read','Staff API capability: vendor-business-types:read','2026-10-10 16:41:46'),
('62029204-c49b-11f1-a0d7-52540021303b','vendor-categories:read','vendor-categories','read','Staff API capability: vendor-categories:read','2026-10-10 16:41:46'),
('6211d4b2-c49b-11f1-a0d7-52540021303b','vendor-rate-comparisons:create','vendor-rate-comparisons','create','Staff API capability: vendor-rate-comparisons:create','2026-10-10 16:41:46'),
('622215c8-c49b-11f1-a0d7-52540021303b','vendor-rate-comparisons:read','vendor-rate-comparisons','read','Staff API capability: vendor-rate-comparisons:read','2026-10-10 16:41:47'),
('6230f197-c49b-11f1-a0d7-52540021303b','vendor-rate-comparisons:update','vendor-rate-comparisons','update','Staff API capability: vendor-rate-comparisons:update','2026-10-10 16:41:47'),
('623f9a58-c49b-11f1-a0d7-52540021303b','vendors-saved-searches:create','vendors-saved-searches','create','Staff API capability: vendors-saved-searches:create','2026-10-10 16:41:47'),
('624f4296-c49b-11f1-a0d7-52540021303b','vendors-saved-searches:delete','vendors-saved-searches','delete','Staff API capability: vendors-saved-searches:delete','2026-10-10 16:41:47'),
('625f3b1f-c49b-11f1-a0d7-52540021303b','vendors-saved-searches:read','vendors-saved-searches','read','Staff API capability: vendors-saved-searches:read','2026-10-10 16:41:47'),
('626df8e3-c49b-11f1-a0d7-52540021303b','vendors:create','vendors','create','Staff API capability: vendors:create','2026-10-10 16:41:47'),
('627f3791-c49b-11f1-a0d7-52540021303b','vendors:delete','vendors','delete','Staff API capability: vendors:delete','2026-10-10 16:41:47'),
('628f9135-c49b-11f1-a0d7-52540021303b','vendors:read','vendors','read','Staff API capability: vendors:read','2026-10-10 16:41:47'),
('62a2bb30-c49b-11f1-a0d7-52540021303b','vendors:update','vendors','update','Staff API capability: vendors:update','2026-10-10 16:41:47'),
('62b3b9be-c49b-11f1-a0d7-52540021303b','work-orders:approve','work-orders','approve','Staff API capability: work-orders:approve','2026-10-10 16:41:48'),
('62c3b50c-c49b-11f1-a0d7-52540021303b','work-orders:create','work-orders','create','Staff API capability: work-orders:create','2026-10-10 16:41:48'),
('62d41259-c49b-11f1-a0d7-52540021303b','work-orders:delete','work-orders','delete','Staff API capability: work-orders:delete','2026-10-10 16:41:48'),
('62e29c26-c49b-11f1-a0d7-52540021303b','work-orders:read','work-orders','read','Staff API capability: work-orders:read','2026-10-10 16:41:48'),
('62f2d94c-c49b-11f1-a0d7-52540021303b','work-orders:reject','work-orders','reject','Staff API capability: work-orders:reject','2026-10-10 16:41:48'),
('63050d85-c49b-11f1-a0d7-52540021303b','work-orders:update','work-orders','update','Staff API capability: work-orders:update','2026-10-10 16:41:48'),
('63143898-c49b-11f1-a0d7-52540021303b','workflow-library:assign','workflow-library','assign','Staff API capability: workflow-library:assign','2026-10-10 16:41:48'),
('63251050-c49b-11f1-a0d7-52540021303b','workflow-library:create','workflow-library','create','Staff API capability: workflow-library:create','2026-10-10 16:41:48'),
('6333f1a1-c49b-11f1-a0d7-52540021303b','workflow-library:delete','workflow-library','delete','Staff API capability: workflow-library:delete','2026-10-10 16:41:48'),
('63437742-c49b-11f1-a0d7-52540021303b','workflow-library:deliver','workflow-library','deliver','Staff API capability: workflow-library:deliver','2026-10-10 16:41:48'),
('63541820-c49b-11f1-a0d7-52540021303b','workflow-library:read','workflow-library','read','Staff API capability: workflow-library:read','2026-10-10 16:41:49'),
('636594c1-c49b-11f1-a0d7-52540021303b','workflow-library:update','workflow-library','update','Staff API capability: workflow-library:update','2026-10-10 16:41:49'),
('6375132e-c49b-11f1-a0d7-52540021303b','workflow-progress:create','workflow-progress','create','Staff API capability: workflow-progress:create','2026-10-10 16:41:49'),
('6383edce-c49b-11f1-a0d7-52540021303b','workflow-progress:read','workflow-progress','read','Staff API capability: workflow-progress:read','2026-10-10 16:41:49'),
('63969997-c49b-11f1-a0d7-52540021303b','workflow-progress:sign-off','workflow-progress','sign-off','Staff API capability: workflow-progress:sign-off','2026-10-10 16:41:49'),
('63a58b5f-c49b-11f1-a0d7-52540021303b','workflow-progress:update','workflow-progress','update','Staff API capability: workflow-progress:update','2026-10-10 16:41:49'),
('63b451b2-c49b-11f1-a0d7-52540021303b','workflow-timeline:read','workflow-timeline','read','Staff API capability: workflow-timeline:read','2026-10-10 16:41:49'),
('63c354d6-c49b-11f1-a0d7-52540021303b','workflow:create','workflow','create','Staff API capability: workflow:create','2026-10-10 16:41:49'),
('63d1f675-c49b-11f1-a0d7-52540021303b','workflow:read','workflow','read','Staff API capability: workflow:read','2026-10-10 16:41:49'),
('63e1b363-c49b-11f1-a0d7-52540021303b','workflow:update','workflow','update','Staff API capability: workflow:update','2026-10-10 16:41:49'),
('63f17b64-c49b-11f1-a0d7-52540021303b','workspace:read','workspace','read','Staff API capability: workspace:read','2026-10-10 16:41:50'),
('6400ce34-c49b-11f1-a0d7-52540021303b','zoho-bigin:create','zoho-bigin','create','Staff API capability: zoho-bigin:create','2026-10-10 16:41:50'),
('640fc58a-c49b-11f1-a0d7-52540021303b','zoho-bigin:delete','zoho-bigin','delete','Staff API capability: zoho-bigin:delete','2026-10-10 16:41:50'),
('641e6ece-c49b-11f1-a0d7-52540021303b','zoho-bigin:read','zoho-bigin','read','Staff API capability: zoho-bigin:read','2026-10-10 16:41:50'),
('643101f1-c49b-11f1-a0d7-52540021303b','zoho-bigin:update','zoho-bigin','update','Staff API capability: zoho-bigin:update','2026-10-10 16:41:50'),
('644190ca-c49b-11f1-a0d7-52540021303b','zoho-calendar:create','zoho-calendar','create','Staff API capability: zoho-calendar:create','2026-10-10 16:41:50'),
('6451d9df-c49b-11f1-a0d7-52540021303b','zoho-calendar:delete','zoho-calendar','delete','Staff API capability: zoho-calendar:delete','2026-10-10 16:41:50'),
('6460d23f-c49b-11f1-a0d7-52540021303b','zoho-calendar:read','zoho-calendar','read','Staff API capability: zoho-calendar:read','2026-10-10 16:41:50'),
('64705df5-c49b-11f1-a0d7-52540021303b','zoho-calendar:update','zoho-calendar','update','Staff API capability: zoho-calendar:update','2026-10-10 16:41:50'),
('64811c13-c49b-11f1-a0d7-52540021303b','zoho-cliq:read','zoho-cliq','read','Staff API capability: zoho-cliq:read','2026-10-10 16:41:51'),
('64905415-c49b-11f1-a0d7-52540021303b','zoho-cliq:send','zoho-cliq','send','Staff API capability: zoho-cliq:send','2026-10-10 16:41:51'),
('64a0a23a-c49b-11f1-a0d7-52540021303b','zoho-cliq:upload','zoho-cliq','upload','Staff API capability: zoho-cliq:upload','2026-10-10 16:41:51'),
('64b16003-c49b-11f1-a0d7-52540021303b','zoho-projects:create','zoho-projects','create','Staff API capability: zoho-projects:create','2026-10-10 16:41:51'),
('64c1b2ea-c49b-11f1-a0d7-52540021303b','zoho-projects:delete','zoho-projects','delete','Staff API capability: zoho-projects:delete','2026-10-10 16:41:51'),
('64d14267-c49b-11f1-a0d7-52540021303b','zoho-projects:read','zoho-projects','read','Staff API capability: zoho-projects:read','2026-10-10 16:41:51'),
('64e2387e-c49b-11f1-a0d7-52540021303b','zoho-projects:update','zoho-projects','update','Staff API capability: zoho-projects:update','2026-10-10 16:41:51'),
('64f1d0a0-c49b-11f1-a0d7-52540021303b','zoho-workdrive:create','zoho-workdrive','create','Staff API capability: zoho-workdrive:create','2026-10-10 16:41:51'),
('650179d9-c49b-11f1-a0d7-52540021303b','zoho-workdrive:read','zoho-workdrive','read','Staff API capability: zoho-workdrive:read','2026-10-10 16:41:51'),
('6510e36a-c49b-11f1-a0d7-52540021303b','zoho-workdrive:upload','zoho-workdrive','upload','Staff API capability: zoho-workdrive:upload','2026-10-10 16:41:51'),
('65dae9af-84d2-11f1-b721-52540021303b','LOGIN','AUTH','LOGIN','Login to the system','2026-07-21 12:34:21'),
('65de61f5-84d2-11f1-b721-52540021303b','LOGOUT','AUTH','LOGOUT','Logout from the system','2026-07-21 12:34:21'),
('65de653c-84d2-11f1-b721-52540021303b','VIEW_DASHBOARD','DASHBOARD','VIEW','View dashboard','2026-07-21 12:34:21'),
('65de66f6-84d2-11f1-b721-52540021303b','CREATE_USER','USER','CREATE','Create users','2026-07-21 12:34:21'),
('65de67af-84d2-11f1-b721-52540021303b','VIEW_USER','USER','VIEW','View users','2026-07-21 12:34:21'),
('65de6865-84d2-11f1-b721-52540021303b','UPDATE_USER','USER','UPDATE','Update users','2026-07-21 12:34:21'),
('65de6921-84d2-11f1-b721-52540021303b','DELETE_USER','USER','DELETE','Delete users','2026-07-21 12:34:21'),
('65de69ce-84d2-11f1-b721-52540021303b','MANAGE_USER_STATUS','USER','STATUS','Activate or deactivate users','2026-07-21 12:34:21'),
('65de6ac2-84d2-11f1-b721-52540021303b','CREATE_ROLE','ROLE','CREATE','Create roles','2026-07-21 12:34:21'),
('65de6b6e-84d2-11f1-b721-52540021303b','VIEW_ROLE','ROLE','VIEW','View roles','2026-07-21 12:34:21'),
('65de6c31-84d2-11f1-b721-52540021303b','UPDATE_ROLE','ROLE','UPDATE','Update roles','2026-07-21 12:34:21'),
('65de6d00-84d2-11f1-b721-52540021303b','DELETE_ROLE','ROLE','DELETE','Delete roles','2026-07-21 12:34:21'),
('65de6dc7-84d2-11f1-b721-52540021303b','ASSIGN_ROLE','ROLE','ASSIGN','Assign roles to users','2026-07-21 12:34:21'),
('65de6e76-84d2-11f1-b721-52540021303b','CREATE_PERMISSION','PERMISSION','CREATE','Create permissions','2026-07-21 12:34:21'),
('65de6f34-84d2-11f1-b721-52540021303b','VIEW_PERMISSION','PERMISSION','VIEW','View permissions','2026-07-21 12:34:21'),
('65de6fef-84d2-11f1-b721-52540021303b','UPDATE_PERMISSION','PERMISSION','UPDATE','Update permissions','2026-07-21 12:34:21'),
('65de70aa-84d2-11f1-b721-52540021303b','DELETE_PERMISSION','PERMISSION','DELETE','Delete permissions','2026-07-21 12:34:21'),
('65de7179-84d2-11f1-b721-52540021303b','ASSIGN_PERMISSION','PERMISSION','ASSIGN','Assign permissions','2026-07-21 12:34:21'),
('65de7231-84d2-11f1-b721-52540021303b','CREATE_PROJECT','PROJECT','CREATE','Create projects','2026-07-21 12:34:21'),
('65de72e7-84d2-11f1-b721-52540021303b','VIEW_PROJECT','PROJECT','VIEW','View projects','2026-07-21 12:34:21'),
('65de739d-84d2-11f1-b721-52540021303b','UPDATE_PROJECT','PROJECT','UPDATE','Update projects','2026-07-21 12:34:21'),
('65de745a-84d2-11f1-b721-52540021303b','DELETE_PROJECT','PROJECT','DELETE','Delete projects','2026-07-21 12:34:21'),
('65de7520-84d2-11f1-b721-52540021303b','ARCHIVE_PROJECT','PROJECT','ARCHIVE','Archive projects','2026-07-21 12:34:21'),
('65de75cd-84d2-11f1-b721-52540021303b','RESTORE_PROJECT','PROJECT','RESTORE','Restore archived projects','2026-07-21 12:34:21'),
('65de767f-84d2-11f1-b721-52540021303b','CREATE_CLIENT','CLIENT','CREATE','Create clients','2026-07-21 12:34:21'),
('65de773a-84d2-11f1-b721-52540021303b','VIEW_CLIENT','CLIENT','VIEW','View clients','2026-07-21 12:34:21'),
('65de77e1-84d2-11f1-b721-52540021303b','UPDATE_CLIENT','CLIENT','UPDATE','Update clients','2026-07-21 12:34:21'),
('65de78a1-84d2-11f1-b721-52540021303b','DELETE_CLIENT','CLIENT','DELETE','Delete clients','2026-07-21 12:34:21'),
('65de7953-84d2-11f1-b721-52540021303b','CREATE_LEAD','LEAD','CREATE','Create leads','2026-07-21 12:34:21'),
('65de7a20-84d2-11f1-b721-52540021303b','VIEW_LEAD','LEAD','VIEW','View leads','2026-07-21 12:34:21'),
('65de7ade-84d2-11f1-b721-52540021303b','UPDATE_LEAD','LEAD','UPDATE','Update leads','2026-07-21 12:34:21'),
('65de7ba1-84d2-11f1-b721-52540021303b','DELETE_LEAD','LEAD','DELETE','Delete leads','2026-07-21 12:34:21'),
('65de7c5b-84d2-11f1-b721-52540021303b','CHANGE_LEAD_STAGE','LEAD','CHANGE_STAGE','Move lead between stages','2026-07-21 12:34:21'),
('65de7d11-84d2-11f1-b721-52540021303b','MARK_LEAD_LOST','LEAD','MARK_LOST','Mark lead as lost','2026-07-21 12:34:21'),
('65de7df8-84d2-11f1-b721-52540021303b','ADD_LEAD_NOTE','LEAD','ADD_NOTE','Add lead notes','2026-07-21 12:34:21'),
('65de7eac-84d2-11f1-b721-52540021303b','boq:create','boq','create','Permission to create BOQ records','2026-07-21 12:34:21'),
('65de8012-84d2-11f1-b721-52540021303b','VIEW_BOQ','BOQ','VIEW','View BOQ','2026-07-21 12:34:21'),
('65de80d9-84d2-11f1-b721-52540021303b','UPDATE_BOQ','BOQ','UPDATE','Update BOQ','2026-07-21 12:34:21'),
('65de81ae-84d2-11f1-b721-52540021303b','boq:delete','boq','delete','Delete BOQ','2026-07-21 12:34:21'),
('65de8274-84d2-11f1-b721-52540021303b','APPROVE_BOQ','BOQ','APPROVE','Approve BOQ','2026-07-21 12:34:21'),
('65de8327-84d2-11f1-b721-52540021303b','EXPORT_BOQ','BOQ','EXPORT','Export BOQ','2026-07-21 12:34:21'),
('65de83db-84d2-11f1-b721-52540021303b','CREATE_BOQ_VERSION','BOQ','VERSION','Create BOQ version','2026-07-21 12:34:21'),
('65de84c3-84d2-11f1-b721-52540021303b','CREATE_BOQ_TEMPLATE','BOQ_TEMPLATE','CREATE','Create BOQ Template','2026-07-21 12:34:21'),
('65de859e-84d2-11f1-b721-52540021303b','VIEW_BOQ_TEMPLATE','BOQ_TEMPLATE','VIEW','View BOQ Template','2026-07-21 12:34:21'),
('65de867b-84d2-11f1-b721-52540021303b','UPDATE_BOQ_TEMPLATE','BOQ_TEMPLATE','UPDATE','Update BOQ Template','2026-07-21 12:34:21'),
('65de875b-84d2-11f1-b721-52540021303b','DELETE_BOQ_TEMPLATE','BOQ_TEMPLATE','DELETE','Delete BOQ Template','2026-07-21 12:34:21'),
('65de8824-84d2-11f1-b721-52540021303b','UPLOAD_DOCUMENT','DOCUMENT','CREATE','Upload document','2026-07-21 12:34:21'),
('65de88dc-84d2-11f1-b721-52540021303b','VIEW_DOCUMENT','DOCUMENT','VIEW','View document','2026-07-21 12:34:21'),
('65de89b1-84d2-11f1-b721-52540021303b','UPDATE_DOCUMENT','DOCUMENT','UPDATE','Update document','2026-07-21 12:34:21'),
('65de8a87-84d2-11f1-b721-52540021303b','DELETE_DOCUMENT','DOCUMENT','DELETE','Delete document','2026-07-21 12:34:21'),
('65de8b74-84d2-11f1-b721-52540021303b','DOWNLOAD_DOCUMENT','DOCUMENT','DOWNLOAD','Download document','2026-07-21 12:34:21'),
('65de8c4d-84d2-11f1-b721-52540021303b','LOCK_DOCUMENT','DOCUMENT','LOCK','Lock document','2026-07-21 12:34:21'),
('65de8eb6-84d2-11f1-b721-52540021303b','CREATE_DRAWING','DRAWING','CREATE','Upload drawing','2026-07-21 12:34:21'),
('65de8f82-84d2-11f1-b721-52540021303b','VIEW_DRAWING','DRAWING','VIEW','View drawings','2026-07-21 12:34:21'),
('65de9059-84d2-11f1-b721-52540021303b','UPDATE_DRAWING','DRAWING','UPDATE','Update drawings','2026-07-21 12:34:21'),
('65de9121-84d2-11f1-b721-52540021303b','DELETE_DRAWING','DRAWING','DELETE','Delete drawings','2026-07-21 12:34:21'),
('65de91fa-84d2-11f1-b721-52540021303b','CREATE_SITE_RECCE','SITE_RECCE','CREATE','Create site recce','2026-07-21 12:34:21'),
('65de92d1-84d2-11f1-b721-52540021303b','VIEW_SITE_RECCE','SITE_RECCE','VIEW','View site recce','2026-07-21 12:34:21'),
('65de939e-84d2-11f1-b721-52540021303b','UPDATE_SITE_RECCE','SITE_RECCE','UPDATE','Update site recce','2026-07-21 12:34:21'),
('65de9485-84d2-11f1-b721-52540021303b','DELETE_SITE_RECCE','SITE_RECCE','DELETE','Delete site recce','2026-07-21 12:34:21'),
('65de956a-84d2-11f1-b721-52540021303b','CREATE_VENDOR','VENDOR','CREATE','Create vendor','2026-07-21 12:34:21'),
('65de9645-84d2-11f1-b721-52540021303b','VIEW_VENDOR','VENDOR','VIEW','View vendors','2026-07-21 12:34:21'),
('65de976b-84d2-11f1-b721-52540021303b','UPDATE_VENDOR','VENDOR','UPDATE','Update vendors','2026-07-21 12:34:21'),
('65de9845-84d2-11f1-b721-52540021303b','DELETE_VENDOR','VENDOR','DELETE','Delete vendors','2026-07-21 12:34:21'),
('65de9910-84d2-11f1-b721-52540021303b','APPROVE_VENDOR','VENDOR','APPROVE','Approve vendors','2026-07-21 12:34:21'),
('65de99c9-84d2-11f1-b721-52540021303b','CREATE_QUOTATION','QUOTATION','CREATE','Create quotation','2026-07-21 12:34:21'),
('65de9a95-84d2-11f1-b721-52540021303b','VIEW_QUOTATION','QUOTATION','VIEW','View quotations','2026-07-21 12:34:21'),
('65de9b5b-84d2-11f1-b721-52540021303b','UPDATE_QUOTATION','QUOTATION','UPDATE','Update quotations','2026-07-21 12:34:21'),
('65de9c36-84d2-11f1-b721-52540021303b','DELETE_QUOTATION','QUOTATION','DELETE','Delete quotations','2026-07-21 12:34:21'),
('65de9cfd-84d2-11f1-b721-52540021303b','APPROVE_QUOTATION','QUOTATION','APPROVE','Approve quotations','2026-07-21 12:34:21'),
('65de9dbb-84d2-11f1-b721-52540021303b','COMPARE_QUOTATION','QUOTATION','COMPARE','Compare quotations','2026-07-21 12:34:21'),
('65de9e7f-84d2-11f1-b721-52540021303b','CREATE_TASK','TASK','CREATE','Create task','2026-07-21 12:34:21'),
('65de9f5e-84d2-11f1-b721-52540021303b','VIEW_TASK','TASK','VIEW','View task','2026-07-21 12:34:21'),
('65dea046-84d2-11f1-b721-52540021303b','UPDATE_TASK','TASK','UPDATE','Update task','2026-07-21 12:34:21'),
('65dea117-84d2-11f1-b721-52540021303b','DELETE_TASK','TASK','DELETE','Delete task','2026-07-21 12:34:21'),
('65dea1e8-84d2-11f1-b721-52540021303b','ASSIGN_TASK','TASK','ASSIGN','Assign task','2026-07-21 12:34:21'),
('65dea2a4-84d2-11f1-b721-52540021303b','CREATE_EVENT','CALENDAR','CREATE','Create calendar event','2026-07-21 12:34:21'),
('65dea373-84d2-11f1-b721-52540021303b','VIEW_EVENT','CALENDAR','VIEW','View calendar events','2026-07-21 12:34:21'),
('65dea44f-84d2-11f1-b721-52540021303b','UPDATE_EVENT','CALENDAR','UPDATE','Update calendar events','2026-07-21 12:34:21'),
('65dea53c-84d2-11f1-b721-52540021303b','DELETE_EVENT','CALENDAR','DELETE','Delete calendar events','2026-07-21 12:34:21'),
('65dea6a7-84d2-11f1-b721-52540021303b','CREATE_LIBRARY_ITEM','LIBRARY','CREATE','Create library item','2026-07-21 12:34:21'),
('65dea7ae-84d2-11f1-b721-52540021303b','VIEW_LIBRARY_ITEM','LIBRARY','VIEW','View library','2026-07-21 12:34:21'),
('65dea874-84d2-11f1-b721-52540021303b','UPDATE_LIBRARY_ITEM','LIBRARY','UPDATE','Update library','2026-07-21 12:34:21'),
('65dea953-84d2-11f1-b721-52540021303b','DELETE_LIBRARY_ITEM','LIBRARY','DELETE','Delete library','2026-07-21 12:34:21'),
('65deaa1f-84d2-11f1-b721-52540021303b','VIEW_REPORT','REPORT','VIEW','View reports','2026-07-21 12:34:21'),
('65deaada-84d2-11f1-b721-52540021303b','EXPORT_REPORT','REPORT','EXPORT','Export reports','2026-07-21 12:34:21'),
('65deab97-84d2-11f1-b721-52540021303b','VIEW_SETTING','SETTING','VIEW','View settings','2026-07-21 12:34:21'),
('65deac52-84d2-11f1-b721-52540021303b','UPDATE_SETTING','SETTING','UPDATE','Update settings','2026-07-21 12:34:21'),
('65dead0c-84d2-11f1-b721-52540021303b','VIEW_NOTIFICATION','NOTIFICATION','VIEW','View notifications','2026-07-21 12:34:21'),
('65deadb9-84d2-11f1-b721-52540021303b','SEND_NOTIFICATION','NOTIFICATION','SEND','Send notifications','2026-07-21 12:34:21'),
('65deae96-84d2-11f1-b721-52540021303b','VIEW_ACTIVITY_LOG','ACTIVITY_LOG','VIEW','View activity logs','2026-07-21 12:34:21'),
('65deaf4b-84d2-11f1-b721-52540021303b','UPLOAD_FILE','FILE','UPLOAD','Upload files','2026-07-21 12:34:21'),
('65deb006-84d2-11f1-b721-52540021303b','DELETE_FILE','FILE','DELETE','Delete files','2026-07-21 12:34:21'),
('65deb0d1-84d2-11f1-b721-52540021303b','MANAGE_DASHBOARD','DASHBOARD','MANAGE','Customize dashboard','2026-07-21 12:34:21'),
('65deb18f-84d2-11f1-b721-52540021303b','SYSTEM_BACKUP','SYSTEM','BACKUP','Create system backup','2026-07-21 12:34:21'),
('65deb241-84d2-11f1-b721-52540021303b','SYSTEM_RESTORE','SYSTEM','RESTORE','Restore system backup','2026-07-21 12:34:21'),
('65deb2f0-84d2-11f1-b721-52540021303b','SYSTEM_ADMIN','SYSTEM','ADMIN','Full system administration','2026-07-21 12:34:21'),
('751997ec-d1bf-11f1-924f-52540021303b','vendor-rate-comparisons:delete','vendor-rate-comparisons','delete','Staff API capability: vendor-rate-comparisons:delete','2026-10-27 10:02:45'),
('a19c96ec-d1c0-11f1-924f-52540021303b','dpr-admin-documents:delete','dpr-admin-documents','delete','Delete saved Admin DPR documents','2026-10-27 10:11:10'),
('b3675e12-ae64-11f1-b327-52540021303b','gates:read','gates','read',NULL,'2026-09-12 10:14:55'),
('b3722c58-ae64-11f1-b327-52540021303b','gates:clear','gates','clear',NULL,'2026-09-12 10:14:55'),
('b37b7a9e-ae64-11f1-b327-52540021303b','gates:reopen','gates','reopen',NULL,'2026-09-12 10:14:55'),
('b386592c-ae64-11f1-b327-52540021303b','gates:override','gates','override',NULL,'2026-09-12 10:14:55'),
('b392f9c2-ae64-11f1-b327-52540021303b','documents:approve','documents','approve',NULL,'2026-09-12 10:14:55'),
('c0f57007-c604-11f1-924f-52540021303b','budget-guides:create','budget-guides','create','Staff API capability: budget-guides:create','2026-10-12 11:48:34'),
('c103a0ec-c604-11f1-924f-52540021303b','budget-guides:delete','budget-guides','delete','Staff API capability: budget-guides:delete','2026-10-12 11:48:34'),
('c1120aa3-c604-11f1-924f-52540021303b','budget-guides:read','budget-guides','read','Staff API capability: budget-guides:read','2026-10-12 11:48:34'),
('c1203b6a-c604-11f1-924f-52540021303b','budget-guides:update','budget-guides','update','Staff API capability: budget-guides:update','2026-10-12 11:48:34'),
('d3dfe714-d398-11f1-8d3e-020000000000','command-center:authority','command-center','authority','View the super-authority dashboard: approvals waiting on the owner, margins, access and audit trail','2026-10-29 13:01:16'),
('e86d8a17-d1c0-11f1-924f-52540021303b','site-ops-snag-lists:delete','site-ops-snag-lists','delete','Delete snag lists and their saved revisions','2026-10-27 10:13:08');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `phases`
--

DROP TABLE IF EXISTS `phases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `phases` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `code` varchar(40) NOT NULL,
  `track_type` enum('MAIN','VENDOR_TRADES','MATERIAL_PROCUREMENT') NOT NULL DEFAULT 'MAIN',
  `order` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `phases_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phases`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `phases` WRITE;
/*!40000 ALTER TABLE `phases` DISABLE KEYS */;
/*!40000 ALTER TABLE `phases` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `plan_of_action_phases`
--

DROP TABLE IF EXISTS `plan_of_action_phases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `plan_of_action_phases` (
  `id` char(36) NOT NULL,
  `plan_of_action_id` char(36) NOT NULL,
  `project_phase_id` char(36) NOT NULL,
  `duration_min_days` int(11) DEFAULT NULL,
  `duration_max_days` int(11) DEFAULT NULL,
  `parallel_work_note` varchar(255) DEFAULT NULL,
  `inclusion_note` varchar(255) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `gantt_start_offset_days` int(11) NOT NULL DEFAULT 0,
  `gantt_duration_days` int(11) NOT NULL DEFAULT 0,
  `sort_order` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uq_plan_of_action_phase` (`plan_of_action_id`,`project_phase_id`) USING BTREE,
  KEY `idx_plan_of_action_phases_plan` (`plan_of_action_id`) USING BTREE,
  KEY `idx_plan_of_action_phases_phase` (`project_phase_id`) USING BTREE,
  KEY `idx_plan_of_action_phases_sort` (`plan_of_action_id`,`sort_order`) USING BTREE,
  KEY `idx_plan_of_action_phases_deleted_at` (`deleted_at`) USING BTREE,
  CONSTRAINT `fk_plan_of_action_phases_phase` FOREIGN KEY (`project_phase_id`) REFERENCES `project_phases` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_plan_of_action_phases_plan` FOREIGN KEY (`plan_of_action_id`) REFERENCES `plan_of_actions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plan_of_action_phases`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `plan_of_action_phases` WRITE;
/*!40000 ALTER TABLE `plan_of_action_phases` DISABLE KEYS */;
/*!40000 ALTER TABLE `plan_of_action_phases` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `plan_of_actions`
--

DROP TABLE IF EXISTS `plan_of_actions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `plan_of_actions` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL DEFAULT 'Plan of Action',
  `execution_description` text DEFAULT NULL,
  `total_phases` int(11) NOT NULL DEFAULT 0,
  `total_duration_min_days` int(11) DEFAULT NULL,
  `total_duration_max_days` int(11) DEFAULT NULL,
  `total_duration_label` varchar(100) DEFAULT NULL,
  `terms_template_id` char(36) DEFAULT NULL,
  `terms_template_version_id` char(36) DEFAULT NULL,
  `terms_content_snapshot` text DEFAULT NULL,
  `status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
  `published_at` datetime DEFAULT NULL,
  `version` int(11) NOT NULL DEFAULT 1,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plan_of_actions`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `plan_of_actions` WRITE;
/*!40000 ALTER TABLE `plan_of_actions` DISABLE KEYS */;
/*!40000 ALTER TABLE `plan_of_actions` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `planner_task_templates`
--

DROP TABLE IF EXISTS `planner_task_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `planner_task_templates` (
  `id` char(36) NOT NULL,
  `phase_id` char(36) NOT NULL,
  `work_name` varchar(255) NOT NULL,
  `details` text DEFAULT NULL,
  `document_type_id` char(36) DEFAULT NULL,
  `applies_to_locations` tinyint(1) NOT NULL DEFAULT 0,
  `is_required` tinyint(1) NOT NULL DEFAULT 1,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `default_remarks` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_planner_task_templates_phase` (`phase_id`),
  KEY `idx_planner_task_templates_document_type` (`document_type_id`),
  KEY `idx_planner_task_templates_phase_sort` (`phase_id`,`sort_order`),
  CONSTRAINT `fk_planner_task_templates_document_type` FOREIGN KEY (`document_type_id`) REFERENCES `document_types` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_planner_task_templates_phase` FOREIGN KEY (`phase_id`) REFERENCES `project_phases` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `planner_task_templates`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `planner_task_templates` WRITE;
/*!40000 ALTER TABLE `planner_task_templates` DISABLE KEYS */;
/*!40000 ALTER TABLE `planner_task_templates` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `project_brief_attachments`
--

DROP TABLE IF EXISTS `project_brief_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_brief_attachments` (
  `id` char(36) NOT NULL,
  `project_brief_id` char(36) NOT NULL,
  `category` enum('DRAWING','DOCUMENT','REFERENCE','PHOTO','OTHER') NOT NULL DEFAULT 'OTHER',
  `name` varchar(255) NOT NULL,
  `file_url` text NOT NULL,
  `mime_type` varchar(150) DEFAULT NULL,
  `uploaded_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_project_brief_attachments_brief` (`project_brief_id`) USING BTREE,
  KEY `idx_project_brief_attachments_uploaded_by` (`uploaded_by`) USING BTREE,
  CONSTRAINT `fk_project_brief_attachments_brief` FOREIGN KEY (`project_brief_id`) REFERENCES `project_briefs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_project_brief_attachments_uploaded_by` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_brief_attachments`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `project_brief_attachments` WRITE;
/*!40000 ALTER TABLE `project_brief_attachments` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_brief_attachments` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `project_brief_documents`
--

DROP TABLE IF EXISTS `project_brief_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_brief_documents` (
  `id` char(36) NOT NULL,
  `project_brief_id` char(36) NOT NULL,
  `document_type` enum('SANCTIONED_PLAN','ARCHITECTURAL_DRAWINGS','STRUCTURAL_DRAWINGS','MEP_LAYOUT','COMPLETION_CERTIFICATE','SOCIETY_NOC','PREVIOUS_DESIGNER_FILES','NOTHING_AVAILABLE','OTHER') NOT NULL,
  `document_name` varchar(255) DEFAULT NULL,
  `document_url` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_project_brief_documents_brief` (`project_brief_id`) USING BTREE,
  CONSTRAINT `fk_project_brief_documents_brief` FOREIGN KEY (`project_brief_id`) REFERENCES `project_briefs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_brief_documents`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `project_brief_documents` WRITE;
/*!40000 ALTER TABLE `project_brief_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_brief_documents` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `project_brief_occupants`
--

DROP TABLE IF EXISTS `project_brief_occupants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_brief_occupants` (
  `id` char(36) NOT NULL,
  `project_brief_id` char(36) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `name` varchar(255) NOT NULL,
  `relationship` varchar(255) DEFAULT NULL,
  `specific_needs_preferences` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_project_brief_occupants_brief` (`project_brief_id`) USING BTREE,
  CONSTRAINT `fk_project_brief_occupants_brief` FOREIGN KEY (`project_brief_id`) REFERENCES `project_briefs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_brief_occupants`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `project_brief_occupants` WRITE;
/*!40000 ALTER TABLE `project_brief_occupants` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_brief_occupants` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `project_brief_phases`
--

DROP TABLE IF EXISTS `project_brief_phases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_brief_phases` (
  `id` char(36) NOT NULL,
  `project_brief_id` char(36) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `phase_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `expected_time` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_project_brief_phases_brief` (`project_brief_id`) USING BTREE,
  KEY `idx_project_brief_phases_dates` (`start_date`,`end_date`) USING BTREE,
  CONSTRAINT `fk_project_brief_phases_brief` FOREIGN KEY (`project_brief_id`) REFERENCES `project_briefs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_brief_phases`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `project_brief_phases` WRITE;
/*!40000 ALTER TABLE `project_brief_phases` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_brief_phases` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `project_brief_procurement_categories`
--

DROP TABLE IF EXISTS `project_brief_procurement_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_brief_procurement_categories` (
  `id` char(36) NOT NULL,
  `project_brief_id` char(36) NOT NULL,
  `category` enum('CIVIL_BUILDING_MATERIAL','METAL_WORK','AC_PIPING_DRAINAGE','ELECTRICAL','PLUMBING','NETWORKING','TILES','SANITARY','CP_FITTINGS','CHEMICALS_ADHESIVES','STONE','MARBLE','GRANITE','DOORS','CHAUKHATS','HARDWARE','PLY_WOOD','PAINTS_POLISHES','FACADE_WORK','FRP','MICRO_CONCRETE','OTHER') NOT NULL,
  `other_description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_project_brief_procurement_category` (`project_brief_id`,`category`) USING BTREE,
  CONSTRAINT `fk_project_brief_procurement_categories_brief` FOREIGN KEY (`project_brief_id`) REFERENCES `project_briefs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_brief_procurement_categories`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `project_brief_procurement_categories` WRITE;
/*!40000 ALTER TABLE `project_brief_procurement_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_brief_procurement_categories` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `project_brief_references`
--

DROP TABLE IF EXISTS `project_brief_references`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_brief_references` (
  `id` char(36) NOT NULL,
  `project_brief_id` char(36) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `reference_url` text DEFAULT NULL,
  `file_url` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_project_brief_references_brief` (`project_brief_id`) USING BTREE,
  CONSTRAINT `fk_project_brief_references_brief` FOREIGN KEY (`project_brief_id`) REFERENCES `project_briefs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_brief_references`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `project_brief_references` WRITE;
/*!40000 ALTER TABLE `project_brief_references` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_brief_references` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `project_brief_services`
--

DROP TABLE IF EXISTS `project_brief_services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_brief_services` (
  `id` char(36) NOT NULL,
  `project_brief_id` char(36) NOT NULL,
  `service_type` enum('ARCHITECTURE_DESIGN','INTERIOR_DESIGN','EXECUTION','LABOUR_WORK','LANDSCAPE_DESIGN','MATERIAL_PROCUREMENT','OTHER') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_project_brief_service` (`project_brief_id`,`service_type`) USING BTREE,
  CONSTRAINT `fk_project_brief_services_brief` FOREIGN KEY (`project_brief_id`) REFERENCES `project_briefs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_brief_services`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `project_brief_services` WRITE;
/*!40000 ALTER TABLE `project_brief_services` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_brief_services` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `project_brief_site_restrictions`
--

DROP TABLE IF EXISTS `project_brief_site_restrictions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_brief_site_restrictions` (
  `id` char(36) NOT NULL,
  `project_brief_id` char(36) NOT NULL,
  `sort_order` int(11) NOT NULL,
  `type` enum('societyRwaPermittedWorkTimings','nocOrSecurityDepositRequired','structuralChangesPermitted','materialMovementRestrictions','neighbourSensitivities','powerAndWaterAvailability','accessStorageDebrisDisposal','ongoingWorkByOtherAgencies') NOT NULL,
  `details` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_project_brief_site_restrictions_project_brief` (`project_brief_id`) USING BTREE,
  CONSTRAINT `fk_project_brief_site_restrictions_project_brief` FOREIGN KEY (`project_brief_id`) REFERENCES `project_briefs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_brief_site_restrictions`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `project_brief_site_restrictions` WRITE;
/*!40000 ALTER TABLE `project_brief_site_restrictions` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_brief_site_restrictions` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `project_brief_space_requirements`
--

DROP TABLE IF EXISTS `project_brief_space_requirements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_brief_space_requirements` (
  `id` char(36) NOT NULL,
  `project_brief_id` char(36) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `space_name` varchar(255) NOT NULL,
  `requirement_details` text DEFAULT NULL,
  `quantity` decimal(10,2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_project_brief_spaces_brief` (`project_brief_id`) USING BTREE,
  KEY `idx_project_brief_spaces_sort` (`project_brief_id`,`sort_order`) USING BTREE,
  CONSTRAINT `fk_project_brief_spaces_brief` FOREIGN KEY (`project_brief_id`) REFERENCES `project_briefs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_brief_space_requirements`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `project_brief_space_requirements` WRITE;
/*!40000 ALTER TABLE `project_brief_space_requirements` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_brief_space_requirements` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `project_brief_style_directions`
--

DROP TABLE IF EXISTS `project_brief_style_directions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_brief_style_directions` (
  `id` char(36) NOT NULL,
  `project_brief_id` char(36) NOT NULL,
  `style_direction` enum('CONTEMPORARY','MINIMAL','CLASSIC_TRADITIONAL','INDIAN_CONTEMPORARY','INDUSTRIAL','MID_CENTURY','LUXE_OPULENT','WARM_RUSTIC','OTHER') NOT NULL,
  `other_description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_project_brief_style_direction` (`project_brief_id`,`style_direction`) USING BTREE,
  CONSTRAINT `fk_project_brief_style_directions_brief` FOREIGN KEY (`project_brief_id`) REFERENCES `project_briefs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_brief_style_directions`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `project_brief_style_directions` WRITE;
/*!40000 ALTER TABLE `project_brief_style_directions` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_brief_style_directions` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `project_brief_work_types`
--

DROP TABLE IF EXISTS `project_brief_work_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_brief_work_types` (
  `id` char(36) NOT NULL,
  `project_brief_id` char(36) NOT NULL,
  `work_type` enum('TURNKEY','CONSULTANCY','BUILDER_FINANCE','PMC_WORK','OTHER') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_project_brief_work_type` (`project_brief_id`,`work_type`) USING BTREE,
  CONSTRAINT `fk_project_brief_work_types_brief` FOREIGN KEY (`project_brief_id`) REFERENCES `project_briefs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_brief_work_types`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `project_brief_work_types` WRITE;
/*!40000 ALTER TABLE `project_brief_work_types` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_brief_work_types` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `project_briefs`
--

DROP TABLE IF EXISTS `project_briefs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_briefs` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `relationship_to_client` varchar(255) DEFAULT NULL,
  `referred_by_source` varchar(255) DEFAULT NULL,
  `brief_date` date DEFAULT NULL,
  `site_address` text DEFAULT NULL,
  `project_type_id` char(36) DEFAULT NULL,
  `site_area` decimal(15,2) DEFAULT NULL,
  `site_area_unit` enum('SQ_FT','GAJ','OTHER') DEFAULT NULL,
  `facing_orientation` varchar(255) DEFAULT NULL,
  `parking_provision` text DEFAULT NULL,
  `ownership_status` varchar(255) DEFAULT NULL,
  `number_of_floors` int(11) DEFAULT NULL,
  `lift_available` tinyint(1) DEFAULT NULL,
  `site_type` enum('BUILDER_FLOOR','BUNGALOW','VILLA','FARMHOUSE','PENTHOUSE','OFFICE','RETAIL_SHOWROOM','HOSPITALITY','HOTEL','RESTAURANT','BANQUETS','BAR_AND_LOUNGE','CAFE','RESORT','QSR_AND_CLOUD_KITCHEN','CAMPUS_ADDITION','EDUCATION','RELIGIOUS','RESIDENTIAL_INSTITUTIONAL','SPORTS','FLAT','FLOOR','KOTHI','RAW','OTHER') DEFAULT NULL,
  `site_condition` enum('BARE_PLOT','COLD_SHELL','WARM_SHELL','EXISTING_OCCUPIED','EXISTING_VACANT','EXISTING_OPERATIONAL','REBRANDING','EXISTING_BUILDING_VACANT','EXISTING_BUILDING_OPERATIONAL','FIT_OUT_REQUIRED','OCCUPIED','UNOCCUPIED','OTHER') DEFAULT NULL,
  `drawings_available` enum('ARCHITECTURAL','STRUCTURAL','MEP','WORKING','AS_BUILT','NONE','OTHER') DEFAULT NULL,
  `drawings_other` text DEFAULT NULL,
  `work_type_other` varchar(255) DEFAULT NULL,
  `services_other` varchar(255) DEFAULT NULL,
  `areas_included_in_scope` text DEFAULT NULL,
  `areas_excluded_from_scope` text DEFAULT NULL,
  `work_already_done_by_others` text DEFAULT NULL,
  `vastu_requirements` text DEFAULT NULL,
  `colours_to_avoid` text DEFAULT NULL,
  `materials_liked` text DEFAULT NULL,
  `materials_disliked_hard_no` text DEFAULT NULL,
  `must_have_elements` text DEFAULT NULL,
  `colours_preferred` text DEFAULT NULL,
  `maintenance_appetite` enum('HIGH','MEDIUM','LOW') DEFAULT NULL,
  `initial_client_budget` decimal(15,2) DEFAULT NULL,
  `budget_currency` varchar(10) NOT NULL DEFAULT 'INR',
  `budget_flexibility` text DEFAULT NULL,
  `desired_start_date` date DEFAULT NULL,
  `site_handover_date` date DEFAULT NULL,
  `target_completion_date` date DEFAULT NULL,
  `deadline_reason` text DEFAULT NULL,
  `phasing_required` tinyint(1) DEFAULT NULL,
  `household_notes` text DEFAULT NULL,
  `open_points_to_close` text DEFAULT NULL,
  `brief_taken_by` char(36) DEFAULT NULL,
  `brief_taken_date` date DEFAULT NULL,
  `confirmed_by_user_id` char(36) DEFAULT NULL,
  `confirmed_date` date DEFAULT NULL,
  `status` enum('DRAFT','READY_FOR_DESIGN','SIGNED_OFF','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `version` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  `principal_architect` text DEFAULT NULL,
  `project_lead` text DEFAULT NULL,
  `property_type` text DEFAULT NULL,
  `funding_stage` text DEFAULT NULL,
  `budget_range` text DEFAULT NULL,
  `expected_timeline` text DEFAULT NULL,
  `toilet_facility_and_stay_for_labour` text DEFAULT NULL,
  `project_category` enum('RESIDENTIAL','COMMERCIAL','INSTITUTIONAL') DEFAULT NULL,
  `site_type_other` text DEFAULT NULL,
  `site_condition_other` text DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_project_briefs_project_version` (`project_id`,`version`) USING BTREE,
  KEY `idx_project_briefs_project` (`project_id`) USING BTREE,
  KEY `idx_project_briefs_status` (`status`) USING BTREE,
  KEY `idx_project_briefs_brief_date` (`brief_date`) USING BTREE,
  KEY `idx_project_briefs_deleted_at` (`deleted_at`) USING BTREE,
  KEY `fk_project_briefs_taken_by` (`brief_taken_by`),
  KEY `fk_project_briefs_confirmed_by` (`confirmed_by_user_id`),
  CONSTRAINT `fk_project_briefs_confirmed_by` FOREIGN KEY (`confirmed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_project_briefs_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_project_briefs_taken_by` FOREIGN KEY (`brief_taken_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_briefs`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `project_briefs` WRITE;
/*!40000 ALTER TABLE `project_briefs` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_briefs` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `project_deliverable_records`
--

DROP TABLE IF EXISTS `project_deliverable_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_deliverable_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `deliverable_id` int(11) NOT NULL,
  `is_submitted` tinyint(1) DEFAULT 0,
  `submitted_at` datetime DEFAULT NULL,
  `file_url` varchar(500) DEFAULT NULL,
  `submitted_by` varchar(150) DEFAULT NULL,
  `version` varchar(20) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_deliverable_records`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `project_deliverable_records` WRITE;
/*!40000 ALTER TABLE `project_deliverable_records` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_deliverable_records` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `project_gates`
--

DROP TABLE IF EXISTS `project_gates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_gates` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `gate_definition_id` char(36) NOT NULL,
  `status` enum('LOCKED','PENDING','READY','CLEARED','REOPENED') NOT NULL DEFAULT 'LOCKED',
  `cleared_at` datetime DEFAULT NULL,
  `cleared_by` char(36) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `overridden` tinyint(1) NOT NULL DEFAULT 0,
  `last_readiness_snapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`last_readiness_snapshot`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uq_project_gates_project_definition` (`project_id`,`gate_definition_id`) USING BTREE,
  KEY `idx_project_gates_cleared_by` (`cleared_by`) USING BTREE,
  KEY `fk_project_gates_gate_definition` (`gate_definition_id`),
  CONSTRAINT `fk_project_gates_cleared_by` FOREIGN KEY (`cleared_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_project_gates_gate_definition` FOREIGN KEY (`gate_definition_id`) REFERENCES `gate_definitions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_project_gates_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_gates`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `project_gates` WRITE;
/*!40000 ALTER TABLE `project_gates` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_gates` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `project_locations`
--

DROP TABLE IF EXISTS `project_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_locations` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `parent_id` char(36) DEFAULT NULL,
  `type` enum('FLOOR','AREA','ROOM','ZONE') NOT NULL DEFAULT 'FLOOR',
  `name` varchar(255) NOT NULL,
  `code` varchar(100) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_project_locations_project_parent` (`project_id`,`parent_id`),
  KEY `fk_project_locations_parent` (`parent_id`),
  CONSTRAINT `fk_project_locations_parent` FOREIGN KEY (`parent_id`) REFERENCES `project_locations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_project_locations_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_locations`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `project_locations` WRITE;
/*!40000 ALTER TABLE `project_locations` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_locations` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `project_phases`
--

DROP TABLE IF EXISTS `project_phases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_phases` (
  `id` char(36) NOT NULL,
  `module` enum('CONSULTANCY','PMC','DOCUMENTS') NOT NULL,
  `phase_number` int(11) NOT NULL,
  `phase_code` varchar(20) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `sort_order` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uq_project_phases_module_phase_code` (`module`,`phase_code`),
  KEY `idx_project_phases_deleted_at` (`deleted_at`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_phases`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `project_phases` WRITE;
/*!40000 ALTER TABLE `project_phases` DISABLE KEYS */;
INSERT INTO `project_phases` VALUES
('25d68d20-209d-46ba-b05a-a1f70e398716','CONSULTANCY',15,'P15','TENDER DRAWINGS',NULL,3,'2026-09-18 15:59:12','2026-09-18 15:59:12',NULL),
('2a0de81d-a43a-5fb5-96ba-94257a9bc75e','DOCUMENTS',6,'06_TENDER','06 TENDER',NULL,6,'2026-09-12 10:14:52','2026-09-12 10:14:52',NULL),
('35ccb713-885f-59f6-9a8f-5aad10fe48ed','DOCUMENTS',11,'B_MATERIAL','B MATERIAL',NULL,11,'2026-09-12 10:14:52','2026-09-12 10:14:52',NULL),
('3a44a34e-db2f-5793-9bbd-dde8d2365828','DOCUMENTS',7,'07_WORKING','07 WORKING',NULL,7,'2026-09-12 10:14:52','2026-09-12 10:14:52',NULL),
('3aa4d822-dca3-5e58-be3e-91f9eecaa311','DOCUMENTS',2,'02_RECCE','02 RECCE',NULL,2,'2026-09-12 10:14:51','2026-09-12 10:14:51',NULL),
('4491ecd3-a595-43af-a3da-a56b7fb38bed','PMC',4,'P4','FINISHING',NULL,8,'2026-09-18 15:59:23','2026-09-18 15:59:23',NULL),
('46eb9f32-06c1-5d8f-b486-0730f4d7a0cb','DOCUMENTS',9,'09_HANDOVER','09 HANDOVER',NULL,9,'2026-09-12 10:14:52','2026-09-12 10:14:52',NULL),
('510941bb-c763-42d2-9afd-bee3b56abc6c','PMC',3,'P3','FIT OUTS',NULL,7,'2026-09-18 15:59:20','2026-09-18 15:59:20',NULL),
('549bcfee-35bc-448f-b603-257716b88e4b','CONSULTANCY',13,'P13','DESIGN',NULL,1,'2026-09-18 15:59:08','2026-09-18 15:59:08',NULL),
('59156697-4db1-4ee9-8f3b-bb1c117ea8f1','CONSULTANCY',12,'P12','PRE-DESIGN',NULL,0,'2026-09-18 15:59:07','2026-09-18 15:59:07',NULL),
('5cec1504-2f7a-5667-832f-4a96b85e8d44','DOCUMENTS',8,'08_EXECUTION','08 EXECUTION',NULL,8,'2026-09-12 10:14:52','2026-09-12 10:14:52',NULL),
('72f0d98c-72ff-470b-9c8b-e1b68a3d5523','PMC',2,'P2','CIVIL WORK',NULL,6,'2026-09-18 15:59:18','2026-09-18 15:59:18',NULL),
('75b981d1-5575-4bbd-8af3-6c0b4d41d865','CONSULTANCY',14,'P14','MATERIAL SELECTION',NULL,2,'2026-09-18 15:59:09','2026-09-18 15:59:09',NULL),
('97a2ffe7-d687-4dba-915e-49ef89047799','PMC',5,'P5','SNAG & HANDOVER',NULL,9,'2026-09-18 15:59:24','2026-09-18 15:59:24',NULL),
('a0628b6a-0206-5acd-8fcc-9838fc245781','DOCUMENTS',3,'03_PRE_DESIGN','03 PRE DESIGN',NULL,3,'2026-09-12 10:14:51','2026-09-12 10:14:51',NULL),
('a274a262-4c02-4e9a-a95a-8d4142e677bc','CONSULTANCY',16,'P16','WORKING DRAWINGS',NULL,4,'2026-09-18 15:59:13','2026-09-18 15:59:13',NULL),
('bf4191fb-1601-53e1-b84f-ec7a21a56d6d','DOCUMENTS',4,'04_PLANNING','04 PLANNING',NULL,4,'2026-09-12 10:14:52','2026-09-12 10:14:52',NULL),
('c74e66e4-de59-43c7-b110-0124d72e4392','PMC',1,'P1','Site preparation',NULL,5,'2026-09-18 15:59:16','2026-10-03 11:31:24',NULL),
('cb595cbe-ba42-5fc3-af81-39e798fce957','DOCUMENTS',5,'05_DESIGN','05 DESIGN',NULL,5,'2026-09-12 10:14:52','2026-09-12 10:14:52',NULL),
('d51f2d19-97a8-11f1-9d65-52540021303b','CONSULTANCY',1,'PH-01','Project Initiation','Project kickoff, scope confirmation, stakeholder identification, and initial project setup.',1,'2026-08-14 11:54:41','2026-08-14 11:54:41',NULL),
('d51f3487-97a8-11f1-9d65-52540021303b','CONSULTANCY',2,'PH-02','Site Survey & Assessment','Detailed site inspection, measurements, existing-condition assessment, and site documentation.',2,'2026-08-14 11:54:41','2026-08-14 11:54:41',NULL),
('d51f3631-97a8-11f1-9d65-52540021303b','CONSULTANCY',3,'PH-03','Design & Planning','Preparation and review of architectural, structural, MEP, and execution plans.',3,'2026-08-14 11:54:41','2026-08-14 11:54:41',NULL),
('d51f36f4-97a8-11f1-9d65-52540021303b','CONSULTANCY',4,'PH-04','Approvals & Procurement','Obtain required approvals and initiate procurement of materials, vendors, and subcontractors.',4,'2026-08-14 11:54:41','2026-08-14 11:54:41',NULL),
('d51f37ba-97a8-11f1-9d65-52540021303b','CONSULTANCY',5,'PH-05','Site Mobilization','Prepare the site for execution including manpower, equipment, temporary facilities, and safety arrangements.',5,'2026-08-14 11:54:41','2026-08-14 11:54:41',NULL),
('d51f38cb-97a8-11f1-9d65-52540021303b','CONSULTANCY',6,'PH-06','Civil & Structural Works','Execute excavation, foundation, structural, masonry, and related civil construction works.',6,'2026-08-14 11:54:41','2026-08-14 11:54:41',NULL),
('d51f3971-97a8-11f1-9d65-52540021303b','CONSULTANCY',7,'PH-07','MEP Installation','Installation of electrical, plumbing, HVAC, fire-fighting, and other MEP systems.',7,'2026-08-14 11:54:41','2026-08-14 11:54:41',NULL),
('d51f3a07-97a8-11f1-9d65-52540021303b','CONSULTANCY',8,'PH-08','Finishing Works','Execute plastering, flooring, painting, ceilings, doors, windows, fixtures, and final finishes.',8,'2026-08-14 11:54:41','2026-08-14 11:54:41',NULL),
('d51f3aab-97a8-11f1-9d65-52540021303b','CONSULTANCY',9,'PH-09','Testing & Commissioning','Test installed systems, rectify defects, and commission electrical, plumbing, HVAC, fire, and other systems.',9,'2026-08-14 11:54:41','2026-08-14 11:54:41',NULL),
('d51f3b4e-97a8-11f1-9d65-52540021303b','CONSULTANCY',10,'PH-10','Snagging & Rectification','Identify, document, and rectify construction defects and incomplete works.',10,'2026-08-14 11:54:41','2026-08-14 11:54:41',NULL),
('d51f3be7-97a8-11f1-9d65-52540021303b','CONSULTANCY',11,'PH-11','Final Inspection & Handover','Complete final inspection, documentation, client walkthrough, and project handover.',11,'2026-08-14 11:54:41','2026-08-14 11:54:41',NULL),
('df430513-9a8b-526e-981a-a33cea8e94ff','DOCUMENTS',1,'01_BRIEF','01 BRIEF',NULL,1,'2026-09-12 10:14:51','2026-09-12 10:14:51',NULL),
('f5886765-a1ea-56b4-a176-0f187c0f7205','DOCUMENTS',10,'A_VENDOR_TRADES','A VENDOR TRADES',NULL,10,'2026-09-12 10:14:52','2026-09-12 10:14:52',NULL);
/*!40000 ALTER TABLE `project_phases` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `project_planner_item_locations`
--

DROP TABLE IF EXISTS `project_planner_item_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_planner_item_locations` (
  `id` char(36) NOT NULL,
  `planner_item_id` char(36) NOT NULL,
  `location_id` char(36) NOT NULL,
  `status` enum('NOT_STARTED','IN_PROGRESS','COMPLETED','ON_HOLD','CANCELLED') NOT NULL DEFAULT 'NOT_STARTED',
  `progress_pct` decimal(5,2) NOT NULL DEFAULT 0.00,
  `planned_start_date` date DEFAULT NULL,
  `planned_end_date` date DEFAULT NULL,
  `actual_start_date` date DEFAULT NULL,
  `actual_end_date` date DEFAULT NULL,
  `assigned_to` char(36) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_planner_item_location` (`planner_item_id`,`location_id`),
  KEY `idx_planner_item_locations_item` (`planner_item_id`),
  KEY `idx_planner_item_locations_location` (`location_id`),
  KEY `idx_planner_item_locations_assigned_to` (`assigned_to`),
  CONSTRAINT `fk_planner_item_locations_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_planner_item_locations_item` FOREIGN KEY (`planner_item_id`) REFERENCES `project_planner_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_planner_item_locations_location` FOREIGN KEY (`location_id`) REFERENCES `project_locations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_planner_item_locations`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `project_planner_item_locations` WRITE;
/*!40000 ALTER TABLE `project_planner_item_locations` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_planner_item_locations` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `project_planner_items`
--

DROP TABLE IF EXISTS `project_planner_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_planner_items` (
  `id` char(36) NOT NULL,
  `planner_id` char(36) NOT NULL,
  `task_template_id` char(36) DEFAULT NULL,
  `phase_id` char(36) NOT NULL,
  `work_name` varchar(255) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `document_type_id` char(36) DEFAULT NULL,
  `status` enum('NOT_STARTED','IN_PROGRESS','COMPLETED','ON_HOLD','CANCELLED') NOT NULL DEFAULT 'NOT_STARTED',
  `planned_start_date` date DEFAULT NULL,
  `planned_end_date` date DEFAULT NULL,
  `actual_start_date` date DEFAULT NULL,
  `actual_end_date` date DEFAULT NULL,
  `progress_pct` decimal(5,2) NOT NULL DEFAULT 0.00,
  `assigned_to` char(36) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_project_planner_items_planner_phase` (`planner_id`,`phase_id`),
  KEY `idx_project_planner_items_planner_sort` (`planner_id`,`sort_order`),
  KEY `idx_project_planner_items_document_type` (`document_type_id`),
  KEY `idx_project_planner_items_assigned_to` (`assigned_to`),
  KEY `idx_project_planner_items_phase` (`phase_id`),
  KEY `idx_project_planner_items_created_by` (`created_by`),
  KEY `idx_project_planner_items_task_template` (`task_template_id`),
  CONSTRAINT `fk_project_planner_items_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_project_planner_items_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_project_planner_items_document_type` FOREIGN KEY (`document_type_id`) REFERENCES `document_types` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_project_planner_items_phase` FOREIGN KEY (`phase_id`) REFERENCES `project_phases` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_project_planner_items_planner` FOREIGN KEY (`planner_id`) REFERENCES `project_planners` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_planner_items`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `project_planner_items` WRITE;
/*!40000 ALTER TABLE `project_planner_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_planner_items` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `project_planners`
--

DROP TABLE IF EXISTS `project_planners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_planners` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `type` enum('PROJECT','CONSULTANCY','PMC','VENDOR_PROCUREMENT') NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `planned_start_date` date DEFAULT NULL,
  `planned_end_date` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_project_planners_project_id` (`project_id`),
  KEY `idx_project_planners_created_by` (`created_by`),
  KEY `idx_project_planners_updated_by` (`updated_by`),
  KEY `project_planners_project_lookup` (`project_id`),
  CONSTRAINT `fk_project_planners_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_project_planners_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_project_planners_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_planners`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `project_planners` WRITE;
/*!40000 ALTER TABLE `project_planners` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_planners` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `project_procurement_items`
--

DROP TABLE IF EXISTS `project_procurement_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_procurement_items` (
  `id` char(36) NOT NULL,
  `planner_id` char(36) NOT NULL,
  `template_key` varchar(64) DEFAULT NULL,
  `item_type` enum('MATERIAL','LABOUR') NOT NULL,
  `category_name` varchar(255) NOT NULL,
  `vendor_id` char(36) DEFAULT NULL,
  `vendor_name` varchar(255) DEFAULT NULL,
  `estimate_finalised_at` date DEFAULT NULL,
  `quotation_finalised_at` date DEFAULT NULL,
  `planned_start_date` date DEFAULT NULL,
  `planned_end_date` date DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `received_at_site_date` date DEFAULT NULL,
  `status` enum('NOT_STARTED','IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'NOT_STARTED',
  `remarks` text DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_project_procurement_items_planner_item_type` (`planner_id`,`item_type`),
  KEY `idx_project_procurement_items_vendor_id` (`vendor_id`),
  KEY `idx_project_procurement_items_template_key` (`template_key`),
  KEY `idx_project_procurement_items_created_by` (`created_by`),
  CONSTRAINT `fk_project_procurement_items_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_project_procurement_items_planner` FOREIGN KEY (`planner_id`) REFERENCES `project_planners` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_project_procurement_items_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_procurement_items`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `project_procurement_items` WRITE;
/*!40000 ALTER TABLE `project_procurement_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_procurement_items` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `project_quality_checks`
--

DROP TABLE IF EXISTS `project_quality_checks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_quality_checks` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `item_id` char(36) NOT NULL,
  `status` enum('PENDING','PASSED','FAILED') NOT NULL DEFAULT 'PENDING',
  `remarks` text DEFAULT NULL,
  `checked_by` char(36) DEFAULT NULL,
  `checked_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pqc_project_item` (`project_id`,`item_id`),
  KEY `idx_pqc_project` (`project_id`),
  KEY `idx_pqc_item` (`item_id`),
  KEY `idx_pqc_checked_by` (`checked_by`),
  CONSTRAINT `fk_pqc_checked_by` FOREIGN KEY (`checked_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_pqc_item` FOREIGN KEY (`item_id`) REFERENCES `quality_check_heads` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_pqc_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_quality_checks`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `project_quality_checks` WRITE;
/*!40000 ALTER TABLE `project_quality_checks` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_quality_checks` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `project_scope_categories`
--

DROP TABLE IF EXISTS `project_scope_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_scope_categories` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `scope_category_id` char(36) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uq_project_scope_category` (`project_id`,`scope_category_id`) USING BTREE,
  KEY `idx_project_scope_categories_project_id` (`project_id`) USING BTREE,
  KEY `idx_project_scope_categories_category_id` (`scope_category_id`) USING BTREE,
  KEY `idx_project_scope_categories_active` (`is_active`) USING BTREE,
  CONSTRAINT `fk_project_scope_categories_category` FOREIGN KEY (`scope_category_id`) REFERENCES `scope_categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_project_scope_categories_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_scope_categories`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `project_scope_categories` WRITE;
/*!40000 ALTER TABLE `project_scope_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_scope_categories` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `project_shortlists`
--

DROP TABLE IF EXISTS `project_shortlists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_shortlists` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `shortlist_type` enum('VENDOR','MATERIAL') NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `is_locked` tinyint(1) NOT NULL DEFAULT 0,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_project_shortlists_project_id` (`project_id`) USING BTREE,
  KEY `idx_project_shortlists_type` (`shortlist_type`) USING BTREE,
  KEY `idx_project_shortlists_created_by` (`created_by`) USING BTREE,
  KEY `idx_project_shortlists_updated_by` (`updated_by`) USING BTREE,
  CONSTRAINT `fk_project_shortlists_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_project_shortlists_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_project_shortlists_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_shortlists`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `project_shortlists` WRITE;
/*!40000 ALTER TABLE `project_shortlists` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_shortlists` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `project_spaces`
--

DROP TABLE IF EXISTS `project_spaces`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_spaces` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uq_project_space_slug` (`project_id`,`slug`) USING BTREE,
  KEY `idx_project_spaces_project_id` (`project_id`) USING BTREE,
  KEY `idx_project_spaces_active` (`is_active`) USING BTREE,
  KEY `idx_project_spaces_deleted_at` (`deleted_at`) USING BTREE,
  CONSTRAINT `fk_project_spaces_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_spaces`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `project_spaces` WRITE;
/*!40000 ALTER TABLE `project_spaces` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_spaces` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `project_step_progress`
--

DROP TABLE IF EXISTS `project_step_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_step_progress` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `step_id` int(11) NOT NULL,
  `status` enum('NOT_STARTED','IN_PROGRESS','COMPLETED','BLOCKED') NOT NULL DEFAULT 'NOT_STARTED',
  `assignee_team_id` int(11) DEFAULT NULL,
  `assignee_name` varchar(150) DEFAULT NULL,
  `planned_start_date` date DEFAULT NULL,
  `planned_end_date` date DEFAULT NULL,
  `actual_start_date` datetime DEFAULT NULL,
  `actual_completion_date` datetime DEFAULT NULL,
  `signed_off_by` varchar(150) DEFAULT NULL,
  `signed_off_at` datetime DEFAULT NULL,
  `blocked_reason` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_step_progress`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `project_step_progress` WRITE;
/*!40000 ALTER TABLE `project_step_progress` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_step_progress` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `project_types`
--

DROP TABLE IF EXISTS `project_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_types` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project_types_slug` (`slug`),
  KEY `idx_project_types_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_types`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `project_types` WRITE;
/*!40000 ALTER TABLE `project_types` DISABLE KEYS */;
INSERT INTO `project_types` VALUES
('47c269f2-7e6b-11f1-b721-52540021303b','Residential Interior','residential-interior','Interior design and execution projects for residential spaces.','2026-07-13 09:01:05','2026-07-13 09:01:05',NULL),
('47c2e685-7e6b-11f1-b721-52540021303b','Commercial Office','commercial-office','Office workspace planning, design and development projects.','2026-07-13 09:01:05','2026-07-13 09:01:05',NULL),
('47c2e9cf-7e6b-11f1-b721-52540021303b','Retail Store','retail-store','Retail outlet design, branding and construction projects.','2026-07-13 09:01:05','2026-07-13 09:01:05',NULL),
('47c2eaa0-7e6b-11f1-b721-52540021303b','Hospitality','hospitality','Hotel, restaurant and hospitality infrastructure projects.','2026-07-13 09:01:05','2026-07-13 09:01:05',NULL),
('47c2eb50-7e6b-11f1-b721-52540021303b','Renovation','renovation','Renovation and remodeling of existing properties.','2026-07-13 09:01:05','2026-07-13 09:01:05',NULL),
('47c2ec08-7e6b-11f1-b721-52540021303b','Industrial Project','industrial-project','Industrial facilities and manufacturing related projects.','2026-07-13 09:01:05','2026-07-13 09:01:05',NULL);
/*!40000 ALTER TABLE `project_types` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `project_vendor_procurements`
--

DROP TABLE IF EXISTS `project_vendor_procurements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_vendor_procurements` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `procurement_category_id` char(36) NOT NULL,
  `s_no` int(11) NOT NULL DEFAULT 0,
  `vendor_name` varchar(255) DEFAULT NULL,
  `estimate_finalised_date` date DEFAULT NULL,
  `quotation_finalised_date` date DEFAULT NULL,
  `labour_start_date` date DEFAULT NULL,
  `labour_end_date` date DEFAULT NULL,
  `material_purchase_date` date DEFAULT NULL,
  `material_received_date` date DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_project_vendor_procurements_project` (`project_id`),
  KEY `fk_project_vendor_procurements_category` (`procurement_category_id`),
  KEY `fk_project_vendor_procurements_created_by` (`created_by`),
  KEY `fk_project_vendor_procurements_updated_by` (`updated_by`),
  CONSTRAINT `fk_project_vendor_procurements_category` FOREIGN KEY (`procurement_category_id`) REFERENCES `procurement_categories` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_project_vendor_procurements_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_project_vendor_procurements_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_project_vendor_procurements_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_vendor_procurements`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `project_vendor_procurements` WRITE;
/*!40000 ALTER TABLE `project_vendor_procurements` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_vendor_procurements` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `client_id` char(36) DEFAULT NULL,
  `project_type_id` char(36) DEFAULT NULL,
  `site_location` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `priority` enum('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  `status` enum('active','completed','on_hold','inactive') NOT NULL DEFAULT 'active',
  `expected_completion_date` date DEFAULT NULL,
  `quotation_count` int(11) NOT NULL DEFAULT 0,
  `approved_value` decimal(15,2) NOT NULL DEFAULT 0.00,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `archived_at` timestamp NULL DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` char(36) DEFAULT NULL,
  `current_phase` varchar(100) DEFAULT NULL,
  `progress_pct` decimal(5,2) DEFAULT 0.00,
  `timeline_status` varchar(50) DEFAULT NULL,
  `next_milestone_name` varchar(255) DEFAULT NULL,
  `schedule_variance` int(11) NOT NULL DEFAULT 0,
  `planned_duration` int(11) NOT NULL DEFAULT 0,
  `archived_by` char(36) DEFAULT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `purchase_order_items`
--

DROP TABLE IF EXISTS `purchase_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_order_items` (
  `id` char(36) NOT NULL,
  `purchase_order_id` char(36) NOT NULL,
  `material_id` char(36) NOT NULL,
  `line_number` int(11) NOT NULL,
  `description` varchar(500) NOT NULL,
  `specification` text DEFAULT NULL,
  `brand` varchar(150) DEFAULT NULL,
  `unit` varchar(30) NOT NULL,
  `ordered_quantity` decimal(15,3) NOT NULL,
  `rate` decimal(15,2) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `received_quantity` decimal(15,3) NOT NULL DEFAULT 0.000,
  `pending_quantity` decimal(15,3) NOT NULL DEFAULT 0.000,
  `remarks` text DEFAULT NULL,
  `source_reference_id` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_purchase_order_items_purchase_order_id` (`purchase_order_id`),
  KEY `idx_purchase_order_items_material_id` (`material_id`),
  KEY `idx_purchase_order_items_line` (`purchase_order_id`,`line_number`),
  CONSTRAINT `fk_purchase_order_items_material` FOREIGN KEY (`material_id`) REFERENCES `material_masters` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_purchase_order_items_purchase_order` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_order_items`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `purchase_order_items` WRITE;
/*!40000 ALTER TABLE `purchase_order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_order_items` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `purchase_orders`
--

DROP TABLE IF EXISTS `purchase_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_orders` (
  `id` char(36) NOT NULL,
  `po_number` varchar(50) NOT NULL,
  `project_id` char(36) NOT NULL,
  `site_id` char(36) DEFAULT NULL,
  `vendor_id` char(36) DEFAULT NULL,
  `po_date` date NOT NULL,
  `target_delivery_date` date DEFAULT NULL,
  `agency_name` varchar(255) DEFAULT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `vendor_gstin` varchar(50) DEFAULT NULL,
  `vendor_pan` varchar(50) DEFAULT NULL,
  `ship_to_address` text DEFAULT NULL,
  `subtotal` decimal(15,2) NOT NULL DEFAULT 0.00,
  `discount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `gst_percent` decimal(5,2) NOT NULL DEFAULT 0.00,
  `gst_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `cartage` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `status` enum('DRAFT','PENDING_APPROVAL','APPROVED','SENT','PARTIALLY_RECEIVED','RECEIVED','CANCELLED','CLOSED') NOT NULL DEFAULT 'DRAFT',
  `source_type` enum('ESTIMATE','BOQ','QUOTATION','MANUAL') NOT NULL DEFAULT 'MANUAL',
  `source_reference_id` char(36) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `terms_and_conditions` text DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `approved_by` char(36) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `quotation_id` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uq_purchase_orders_po_number` (`po_number`) USING BTREE,
  KEY `idx_purchase_orders_project_id` (`project_id`) USING BTREE,
  KEY `idx_purchase_orders_site_id` (`site_id`) USING BTREE,
  KEY `idx_purchase_orders_vendor_id` (`vendor_id`) USING BTREE,
  KEY `idx_purchase_orders_status` (`status`) USING BTREE,
  KEY `idx_purchase_orders_source_type` (`source_type`) USING BTREE,
  KEY `idx_purchase_orders_source_reference_id` (`source_reference_id`) USING BTREE,
  KEY `idx_purchase_orders_quotation_id` (`quotation_id`) USING BTREE,
  KEY `idx_purchase_orders_created_by` (`created_by`) USING BTREE,
  KEY `idx_purchase_orders_approved_by` (`approved_by`) USING BTREE,
  CONSTRAINT `fk_purchase_orders_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_purchase_orders_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_purchase_orders_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  CONSTRAINT `fk_purchase_orders_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_orders`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `purchase_orders` WRITE;
/*!40000 ALTER TABLE `purchase_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchase_orders` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `qc_sign_off_item_results`
--

DROP TABLE IF EXISTS `qc_sign_off_item_results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `qc_sign_off_item_results` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `qc_sign_off_id` int(11) NOT NULL,
  `template_item_id` int(11) NOT NULL,
  `result` enum('PASS','FAIL','NA') NOT NULL DEFAULT 'NA',
  `remark` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_qc_sign_off_item_results_signoff_template` (`qc_sign_off_id`,`template_item_id`),
  KEY `fk_qc_sign_off_item_results_template_item` (`template_item_id`),
  CONSTRAINT `fk_qc_sign_off_item_results_qc_sign_off` FOREIGN KEY (`qc_sign_off_id`) REFERENCES `qc_sign_offs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_qc_sign_off_item_results_template_item` FOREIGN KEY (`template_item_id`) REFERENCES `checklist_template_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `qc_sign_off_item_results`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `qc_sign_off_item_results` WRITE;
/*!40000 ALTER TABLE `qc_sign_off_item_results` DISABLE KEYS */;
/*!40000 ALTER TABLE `qc_sign_off_item_results` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `qc_sign_offs`
--

DROP TABLE IF EXISTS `qc_sign_offs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `qc_sign_offs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` char(36) NOT NULL,
  `step_id` int(11) NOT NULL,
  `trade_team_id` int(11) NOT NULL,
  `checklist_template_id` int(11) NOT NULL,
  `result` enum('PASS','FAIL','REWORK') NOT NULL,
  `attempt_number` int(11) NOT NULL DEFAULT 1,
  `checked_by` varchar(150) NOT NULL,
  `checked_at` datetime NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_qc_sign_offs_project_id` (`project_id`),
  KEY `idx_qc_sign_offs_step_id` (`step_id`),
  KEY `idx_qc_sign_offs_trade_team_id` (`trade_team_id`),
  KEY `idx_qc_sign_offs_checklist_template_id` (`checklist_template_id`),
  KEY `idx_qc_sign_offs_result` (`result`),
  KEY `qc_sign_offs_project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `qc_sign_offs`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `qc_sign_offs` WRITE;
/*!40000 ALTER TABLE `qc_sign_offs` DISABLE KEYS */;
/*!40000 ALTER TABLE `qc_sign_offs` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `quality_check_heads`
--

DROP TABLE IF EXISTS `quality_check_heads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `quality_check_heads` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `sort_order` int(11) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `work_head` varchar(50) DEFAULT NULL,
  `template_serial_number` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_qch_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quality_check_heads`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `quality_check_heads` WRITE;
/*!40000 ALTER TABLE `quality_check_heads` DISABLE KEYS */;
INSERT INTO `quality_check_heads` VALUES
('00c392a9-da13-4924-829b-a4cf15314ed6','Plumbing',9,1,'2026-09-30 09:47:24','2026-10-03 10:58:06','PLUMBING',9),
('063b46c8-a716-438d-9830-d34a75c7b814','Doors & Fixed furniture',18,1,'2026-09-30 09:47:24','2026-10-03 10:58:08','DOORS',17),
('0bf7bd52-21ad-464f-af9b-a886137015a7','Paint work',14,1,'2026-09-30 09:47:24','2026-10-03 10:58:07','PAINT_WORK',14),
('0c89cef0-c764-4348-bda3-6198de497792','PCC work',2,1,'2026-09-30 09:47:24','2026-10-03 10:58:04','PCC_WORK',2),
('26c997e9-ba65-4bbb-a00a-6fb84a3354cb','Wardrobe inspection',16,1,'2026-09-30 09:47:24','2026-10-03 10:58:08','WARDROBE',16),
('28b7945a-4767-4f78-81e6-cfa76cc0de19','Excavation',1,1,'2026-09-30 09:47:24','2026-10-03 10:58:04','EXCAVATION',1),
('37cf3234-beeb-11f1-a7ce-52540021303b','Windows & glazing',19,1,'2026-10-03 10:58:08','2026-10-03 10:58:08','WINDOWS_GLAZING',18),
('3ebf60c7-1a54-4685-a0a5-c0c0a55c3217','False ceiling',12,1,'2026-09-30 09:47:24','2026-10-03 10:58:07','FALSE_CEILING',12),
('591a9b17-ac07-45a0-8155-8fccb5d8f7d4','Plaster work',7,1,'2026-09-30 09:47:24','2026-10-03 10:58:06','PLASTER_WORK',8),
('9a4395bb-b240-45e5-b4e2-6416da645771','Waterproofing',6,1,'2026-09-30 09:47:24','2026-10-03 10:58:05','WATERPROOFING',7),
('9b7df2f5-19c4-43b4-9b09-32caf4773b6b','Formwork/ Shuttering',3,1,'2026-09-30 09:47:24','2026-10-03 10:58:05','FORMWORK_SHUTTERING',3),
('9fd07572-4931-4cbe-9bcf-c08c2616fbf3','Waterproofing (bathroom)',8,0,'2026-09-30 09:47:24','2026-10-03 10:58:08',NULL,NULL),
('ad59ffbe-33d1-4267-8812-11e36fc47343','Electrical & Lighting',10,1,'2026-09-30 09:47:24','2026-10-03 10:58:06','ELECTRICAL_LIGHTING',10),
('afaa519f-c78d-48d9-bee8-112a78bbcfb7','Bathroom inspection',17,0,'2026-09-30 09:47:24','2026-10-03 10:58:08',NULL,NULL),
('c8ff0ed2-2f9a-43ff-a7e7-149890da74da','Concreting',4,1,'2026-09-30 09:47:24','2026-10-03 10:58:05','CONCRETING',4),
('ceade521-ece3-491a-8c2b-bce35f68647f','Flooring work',13,1,'2026-09-30 09:47:24','2026-10-03 10:58:07','FLOORING_WORK',13),
('df1801f9-e6a3-4b7f-bf60-3249450c9b82','Kitchen inspection',15,1,'2026-09-30 09:47:24','2026-10-03 10:58:07','KITCHEN',15),
('e721eb51-fdb6-49c8-af35-f08df5ba7f24','HVAC',11,1,'2026-09-30 09:47:24','2026-10-03 10:58:06','HVAC',11),
('f8a72cd8-2d5a-492d-bd37-b7e0d9d68d66','Brickwork',5,1,'2026-09-30 09:47:24','2026-10-03 10:58:05','BRICKWORK',6);
/*!40000 ALTER TABLE `quality_check_heads` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `quality_checklist_items`
--

DROP TABLE IF EXISTS `quality_checklist_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `quality_checklist_items` (
  `id` char(36) NOT NULL,
  `checklist_id` char(36) NOT NULL,
  `serial_number` int(11) NOT NULL,
  `checkpoint_name` varchar(255) NOT NULL,
  `checkpoint_description` text DEFAULT NULL,
  `phase` enum('BEFORE_EXECUTION','DURING_EXECUTION','AFTER_EXECUTION') NOT NULL DEFAULT 'DURING_EXECUTION',
  `status` enum('NOT_STARTED','IN_PROGRESS','COMPLETED','ACCEPTED','REJECTED','DEFERRED') NOT NULL DEFAULT 'NOT_STARTED',
  `is_accepted` tinyint(1) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `inspection_date` datetime DEFAULT NULL,
  `inspected_by` char(36) DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_qcli_checklist` (`checklist_id`),
  KEY `idx_qcli_status` (`status`),
  KEY `idx_qcli_phase` (`phase`),
  KEY `idx_qcli_inspected_by` (`inspected_by`),
  KEY `idx_qcli_created_by` (`created_by`),
  KEY `idx_qcli_updated_by` (`updated_by`),
  CONSTRAINT `fk_qcli_checklist` FOREIGN KEY (`checklist_id`) REFERENCES `quality_checklists` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_qcli_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_qcli_inspected_by` FOREIGN KEY (`inspected_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_qcli_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quality_checklist_items`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `quality_checklist_items` WRITE;
/*!40000 ALTER TABLE `quality_checklist_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `quality_checklist_items` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `quality_checklist_templates`
--

DROP TABLE IF EXISTS `quality_checklist_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `quality_checklist_templates` (
  `work_head` varchar(50) NOT NULL,
  `label` varchar(255) NOT NULL,
  `serial_number` int(11) NOT NULL,
  `sheet_name` varchar(100) NOT NULL,
  `title` varchar(255) NOT NULL,
  `version` varchar(30) NOT NULL,
  `checkpoints` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`checkpoints`)),
  PRIMARY KEY (`work_head`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quality_checklist_templates`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `quality_checklist_templates` WRITE;
/*!40000 ALTER TABLE `quality_checklist_templates` DISABLE KEYS */;
INSERT INTO `quality_checklist_templates` VALUES
('BRICKWORK','Brickwork',6,'Brickwork','Brickwork','20261003','[]'),
('CONCRETING','Concreting',4,'Concreting','Concreting','20261003','[]'),
('DOORS','Doors & Fixed furniture',17,'DOORS','INTERIOR WORKS- DOORS','20261003','[{\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 1, \"checkpoint_name\": \"Check approved door schedule, dimensions, swing direction, and elevations.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 2, \"checkpoint_name\": \"Verify opening dimensions, wall thickness, and finished floor level.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 3, \"checkpoint_name\": \"Confirm door frame and shutter material, thickness, and specifications.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 4, \"checkpoint_name\": \"Check approved veneer sample, species, shade, grain pattern, and finish (PU/polish).\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 5, \"checkpoint_name\": \"Confirm veneer application method, edge detailing, and approved finish sample.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 6, \"checkpoint_name\": \"Check hardware schedule: hinges, locks, handles, stoppers, and other accessories.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 7, \"checkpoint_name\": \"Check frame position, plumb, level, squareness, alignment, and anchoring.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 8, \"checkpoint_name\": \"Ensure frame and shutter are protected from moisture and construction damage.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 9, \"checkpoint_name\": \"Check shutter dimensions, thickness, and surface preparation before veneer application.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 10, \"checkpoint_name\": \"Verify veneer grain direction, matching, alignment, and consistency across panels.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 11, \"checkpoint_name\": \"Check veneer joints, edge banding, corners, and veneer wrapping at shutter edges.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 12, \"checkpoint_name\": \"Ensure veneer is firmly bonded with no bubbles, lifting, open joints, or loose edges.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 13, \"checkpoint_name\": \"Check PU/polish application, sanding, and finish coats as per approved sample.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 14, \"checkpoint_name\": \"Verify hinge positions, hardware installation, and door clearances.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 15, \"checkpoint_name\": \"Check door alignment, uniform gaps, and smooth opening/closing.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 16, \"checkpoint_name\": \"Verify veneer shade, grain direction, and grain matching against the approved sample.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 17, \"checkpoint_name\": \"Inspect veneer for bubbles, peeling, cracks, scratches, dents, and visible joint lines.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 18, \"checkpoint_name\": \"Check PU/polish finish for uniform sheen, colour, smoothness, and surface defects.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 19, \"checkpoint_name\": \"Inspect veneer edges, corners, joints, and frame-to-shutter finish.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 20, \"checkpoint_name\": \"Check hinges, locks, handles, stoppers, and all hardware functionality.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 21, \"checkpoint_name\": \"Verify door clearance from flooring, skirting, and adjacent elements.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 22, \"checkpoint_name\": \"Confirm all doors are clean, undamaged, and protected until handover.\"}]'),
('ELECTRICAL_LIGHTING','Electrical & Lighting',10,'Electrical & lighting','INTERIOR WORKS- ELECTRICAL & LIGHTING','20261003','[{\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 1, \"checkpoint_name\": \"Check fixture positions and heights against approved drawings.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 2, \"checkpoint_name\": \"Check water supply, hot/cold connections, flow, leaks, and drainage function.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 3, \"checkpoint_name\": \"Check floor traps, basin/kitchen connections, flushing, and water sealing.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 4, \"checkpoint_name\": \"Verify visible pipework, silicone/sealing, and access panels are neat and accessible.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 5, \"checkpoint_name\": \"Check conduit routing, bends, junction boxes, and concealed box levels.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 6, \"checkpoint_name\": \"Ensure wiring is correctly identified, connections are secure, and cables are not damaged.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 7, \"checkpoint_name\": \"Check earthing continuity and required electrical tests before energizing.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 8, \"checkpoint_name\": \"Verify light points, driver locations, and wiring coordination with ceiling and furniture.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 9, \"checkpoint_name\": \"MCB labelling\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 10, \"checkpoint_name\": \"Check switches, sockets, lights, dimmers, fans, and controls alignment and working\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 11, \"checkpoint_name\": \"Check fixture alignment, light colour temperature, and dimming where applicable.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 12, \"checkpoint_name\": \"Check plates, fittings, and cut-outs are undamaged and neatly installed.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 13, \"checkpoint_name\": \"Check plates, fittings, and cut-outs are undamaged and neatly installed.\"}]'),
('EXCAVATION','Excavation',1,'Excavation','Excavation','20261003','[]'),
('FALSE_CEILING','False ceiling',12,'FALSE CEILING','INTERIOR WORKS- FALSE CEILING','20261003','[{\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 1, \"checkpoint_name\": \"Approved ceiling plan, sections, levels, cove details, and lighting layout available.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 2, \"checkpoint_name\": \"Confirm all above-ceiling MEP work is inspected and tested before closure.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 3, \"checkpoint_name\": \"Check required ceiling height, hanger/fixing substrate, and framing system.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 4, \"checkpoint_name\": \"Confirm access panels, curtain pockets, AC diffusers, and fixture support provisions.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 5, \"checkpoint_name\": \"Check frame spacing, level, suspension, perimeter support, and fixing as specified.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 6, \"checkpoint_name\": \"Verify openings and supports for lights, fans, AC grilles, and heavy fixtures.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 7, \"checkpoint_name\": \"Check cove/profile alignment, curtain pocket dimensions, and access-panel locations.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 8, \"checkpoint_name\": \"Ensure above-ceiling services remain accessible and are not damaged.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 9, \"checkpoint_name\": \"Check ceiling level, joints, corners, screw marks, cracks, and surface finish.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 10, \"checkpoint_name\": \"Verify cove continuity, access panels, and clean cut-outs.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 11, \"checkpoint_name\": \"Check light/fan/diffuser positions against approved reflected ceiling plan.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 12, \"checkpoint_name\": \"Confirm all defects are rectified before final paint and fixture installation.\"}]'),
('FLOORING_WORK','Flooring work',13,'FLOORING WORK','INTERIOR WORKS- FLOORING WORK','20261003','[{\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 1, \"checkpoint_name\": \"Confirm waterproofing approval and required tests are complete in wet areas.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 2, \"checkpoint_name\": \"Check floor PCC/screed levels, substrate strength, and surface readiness.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 3, \"checkpoint_name\": \"Verify finished floor levels, slopes, thresholds, and door clearances.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 4, \"checkpoint_name\": \"Approve tile/stone material, shade, batch, pattern, and setting-out.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 5, \"checkpoint_name\": \"Confirm proposed skirting detail\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 6, \"checkpoint_name\": \"Check starting point, layout, joint width, pattern, and cut-piece placement.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 7, \"checkpoint_name\": \"Check adhesive/mortar suitability, coverage, and installation method.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 8, \"checkpoint_name\": \"Verify level, lippage, slope to drain, and alignment at thresholds.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 9, \"checkpoint_name\": \"Protect laid flooring and maintain joints/curing as required.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 10, \"checkpoint_name\": \"Check starting point, layout, joint width, pattern, and cut-piece placement.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 11, \"checkpoint_name\": \"Check adhesive/mortar suitability, coverage, and installation method.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 12, \"checkpoint_name\": \"Verify level, lippage, slope to drain, and alignment at thresholds.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 13, \"checkpoint_name\": \"Protect laid flooring with sheets\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 14, \"checkpoint_name\": \"Finalise grout shade before grouting\"}]'),
('FORMWORK_SHUTTERING','Formwork/ Shuttering',3,'Formwork/ Shuttering','Formwork/ Shuttering','20261003','[]'),
('HVAC','HVAC',11,'HVAC','INTERIOR WORKS- HVAC','20261003','[{\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 1, \"checkpoint_name\": \"Approved HVAC layout, equipment schedule, and load/design information available.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 2, \"checkpoint_name\": \"Confirm indoor/outdoor unit locations, service clearances, and maintenance access.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 3, \"checkpoint_name\": \"Check refrigerant pipe, insulation, drain pipe, and electrical requirements.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 4, \"checkpoint_name\": \"Coordinate ducts, diffusers, ceiling heights, curtain pockets, and furniture.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 5, \"checkpoint_name\": \"Check refrigerant pipe routing, jointing, insulation continuity, and support.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 6, \"checkpoint_name\": \"Check condensate drain slope, connections, and water-flow test.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 7, \"checkpoint_name\": \"Verify duct sizes, joints, supports, insulation, and sealing as specified.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 8, \"checkpoint_name\": \"Check sleeves, access panels, diffuser positions, and coordination before ceiling closure.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 9, \"checkpoint_name\": \"Check equipment installation, vibration isolation, and service access.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 10, \"checkpoint_name\": \"Verify condensate drainage and inspect for leaks.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 11, \"checkpoint_name\": \"Test cooling/heating operation as applicable, controls, and airflow/balancing records.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 12, \"checkpoint_name\": \"Check grille alignment, noise/vibration, and clean finished appearance.\"}]'),
('KITCHEN','Kitchen inspection',15,'KITCHEN','INTERIOR WORKS- KITCHEN','20261003','[{\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 1, \"checkpoint_name\": \"Approved kitchen drawings, elevations, sections, and appliance schedule available.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 2, \"checkpoint_name\": \"Check final site dimensions, wall/floor levels, and service points.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 3, \"checkpoint_name\": \"Confirm appliance sizes, ventilation, electrical loads, water, waste, and gas provision if applicable.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 4, \"checkpoint_name\": \"Verify countertop material, finish, edge profile, hardware, and sample approvals.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 5, \"checkpoint_name\": \"Check cabinet carcass material, thickness, finish, and installation alignment.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 6, \"checkpoint_name\": \"Verify levels, plumb, fixing, shutter gaps, drawer operation, and hardware.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 7, \"checkpoint_name\": \"Check sink cut-out, countertop support, joints, and sealing.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 8, \"checkpoint_name\": \"Confirm appliance clearances, service access, and coordination of plumbing/electrical points.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 9, \"checkpoint_name\": \"Check shutters, drawers, hinges, channels, handles, and soft-close operation.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 10, \"checkpoint_name\": \"Check countertop joints, edges, sink sealing, and water drainage.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 11, \"checkpoint_name\": \"Ensure splashbacks are properly fitted & grouted neatly\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 12, \"checkpoint_name\": \"Test appliances and service connections as applicable; check for leaks.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 13, \"checkpoint_name\": \"Inspect finish, alignment, gaps, scratches, and completeness of accessories.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 14, \"checkpoint_name\": \"Check the cabinet interiors are clean, undamaged, & free of construction dust\"}]'),
('PAINT_WORK','Paint work',14,'PAINT WORK','INTERIOR WORKS- PAINT WORK','20261003','[{\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 1, \"checkpoint_name\": \"Confirm plaster/putty substrate is dry and accepted; moisture requirements met.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 2, \"checkpoint_name\": \"Check cracks, undulations, dampness, and previous defects are repaired.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 3, \"checkpoint_name\": \"Approve paint system, colour, sheen, sample, and finish schedule.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 4, \"checkpoint_name\": \"Ensure flooring, hardware, glass, and completed work are protected.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 5, \"checkpoint_name\": \"Check surface sanding, putty, primer, and drying between coats.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 6, \"checkpoint_name\": \"Verify approved colour and consistent application/coverage.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 7, \"checkpoint_name\": \"Check edges, corners, cut-ins, and junctions with ceiling, doors, and furniture.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 8, \"checkpoint_name\": \"Protect adjacent finishes and rectify visible defects between coats.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 9, \"checkpoint_name\": \"Check colour consistency, shade, sheen, coverage, and visible roller/brush marks.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 10, \"checkpoint_name\": \"Inspect under normal and suitable grazing light for patches, pinholes, cracks, and unevenness.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 11, \"checkpoint_name\": \"Check edges around switches, frames, skirting, and fixtures.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 12, \"checkpoint_name\": \"Confirm touch-ups are complete and surfaces are clean and undamaged.\"}]'),
('PCC_WORK','PCC work',2,'PCC work','PCC work','20261003','[]'),
('PLASTER_WORK','Plaster work',8,'Plaster work','INTERIOR WORKS- PLASTER WORK','20261003','[{\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 1, \"checkpoint_name\": \"Check wall layout, openings, levels, and service chasing are complete.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 2, \"checkpoint_name\": \"Confirm concealed plumbing/electrical inspections and approvals are recorded.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 3, \"checkpoint_name\": \"Check substrate is clean and prepared; masonry joints and surface defects are addressed.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 4, \"checkpoint_name\": \"Confirm plaster mix, thickness, and corner/bead details as specified.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 5, \"checkpoint_name\": \"Check surface preparation and wetting/bonding as required by the system.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 6, \"checkpoint_name\": \"Check plaster thickness, line, level, plumb, and room corners\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 7, \"checkpoint_name\": \"Ensure mesh/reinforcement is provided at dissimilar-material junctions where specified.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 8, \"checkpoint_name\": \"Check that electrical boxes and plumbing outlets remain at correct depth and position; cure as specified.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 9, \"checkpoint_name\": \"Check wall plumb, flatness, corners, and surface finish under suitable lighting.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 10, \"checkpoint_name\": \"Check for cracks, hollowness, debonding, undulations, and damaged edges.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 11, \"checkpoint_name\": \"Verify openings and finished dimensions for doors, windows, wardrobes, and kitchen.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 12, \"checkpoint_name\": \"Confirm defects are repaired and surface is ready for the next finish.\"}]'),
('PLUMBING','Plumbing',9,'Plumbing','INTERIOR WORKS- PLUMBING','20261003','[{\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 1, \"checkpoint_name\": \"Approved plumbing layout and fixture schedule available\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 2, \"checkpoint_name\": \"Check pipe material, diameter, fittings, valves and approved brands/ specification as per work order\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 3, \"checkpoint_name\": \"Mark fixture points, heights and connections against sanitary and furniture drawings\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 4, \"checkpoint_name\": \"Confirm sleeve, shaft routes and access for maintenance\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 5, \"checkpoint_name\": \"Check pipe routing, supports, joints, and protection sleeves.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 6, \"checkpoint_name\": \"Verify hot/cold lines, drainage direction, and required slope.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 7, \"checkpoint_name\": \"Check concealed joints and pressure/leak tests before closing walls or floors.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 8, \"checkpoint_name\": \"Ensure traps, cleanouts, valves, and access points remain reachable\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 9, \"checkpoint_name\": \"Check fixture positions and heights against approved drawings.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 10, \"checkpoint_name\": \"Check water supply, hot/cold connections, flow, leaks, and drainage function.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 11, \"checkpoint_name\": \"Check floor traps, basin/kitchen connections, flushing, and water sealing.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 12, \"checkpoint_name\": \"Verify visible pipework, silicone/sealing, and access panels are neat and accessible.\"}]'),
('WARDROBE','Wardrobe inspection',16,'WARDROBE','INTERIOR WORKS- WARDROBE','20261003','[{\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 1, \"checkpoint_name\": \"Approved wardrobe layout, elevations, internal divisions, and hardware schedule available.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 2, \"checkpoint_name\": \"Check final wall-to-wall and floor-to-ceiling dimensions after relevant finishes.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 3, \"checkpoint_name\": \"Confirm electrical points, AC/curtain clearances, skirting, and door swing conflicts.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 4, \"checkpoint_name\": \"Approve board, finish, edge band, mirror/glass, and hardware samples.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 5, \"checkpoint_name\": \"Check carcass material, fixing, plumb, level, and alignment.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 6, \"checkpoint_name\": \"Verify shelf, drawer, hanging-rail, and loft dimensions against drawings.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 7, \"checkpoint_name\": \"Check shutter gaps, edge banding, hinges, channels, and hardware installation.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 8, \"checkpoint_name\": \"Ensure wardrobe does not obstruct switches, sockets, access panels, or ventilation.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 9, \"checkpoint_name\": \"Check shutters open/close freely and do not rub against floor or adjacent elements.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 10, \"checkpoint_name\": \"Check drawer operation, alignment, gaps, handles, and soft-close where specified.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 11, \"checkpoint_name\": \"Inspect finish for scratches, chips, glue marks, and damaged edges.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 12, \"checkpoint_name\": \"Verify mirrors, accessories, internal fittings, and final cleaning.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 13, \"checkpoint_name\": \"Sliding track smoothness\"}]'),
('WATERPROOFING','Waterproofing',7,'Waterproofing','INTERIOR WORKS- WATERPROOFING','20261003','[{\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 1, \"checkpoint_name\": \"Approved waterproofing system, product, and application method available.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 2, \"checkpoint_name\": \"Surface is sound, clean, dry as required, and free from loose material.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 3, \"checkpoint_name\": \"Check corners, wall-floor junctions, pipe sleeves, and drain locations.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 4, \"checkpoint_name\": \"Confirm required waterproofing height and upturns as per approved details.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 5, \"checkpoint_name\": \"Check primer and coating application, coverage, and specified number of coats.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 6, \"checkpoint_name\": \"Ensure corners and pipe penetrations receive specified reinforcement and sealing.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 7, \"checkpoint_name\": \"Check continuity around floor traps, sleeves, and thresholds.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 8, \"checkpoint_name\": \"Protect the membrane from damage; ensure correct curing and drying.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 9, \"checkpoint_name\": \"Check completed membrane for visible damage, cracks, pinholes, and missed areas.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 10, \"checkpoint_name\": \"Verify water-retention test is completed for the specified duration and no leakage is observed below or adjacent.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 11, \"checkpoint_name\": \"Check drain position, slope, and waterproofing termination.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 12, \"checkpoint_name\": \"Confirm repairs and retesting are completed before covering.\"}]'),
('WINDOWS_GLAZING','Windows & glazing',18,'WINDOWS & GLAZING','INTERIOR WORKS- WINDOWS & GLAZING','20261003','[{\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 1, \"checkpoint_name\": \"Check approved window schedule, sizes, elevations, and opening direction.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 2, \"checkpoint_name\": \"Verify sill level, lintel level, opening dimensions, and wall thickness.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 3, \"checkpoint_name\": \"Confirm frame material, profile, glass type/thickness, and finish.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 4, \"checkpoint_name\": \"Check safety-glass requirements and hardware specifications.\"}, {\"phase\": \"BEFORE_EXECUTION\", \"serial_number\": 5, \"checkpoint_name\": \"Confirm waterproofing, sill slope, drainage, and perimeter sealing details.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 6, \"checkpoint_name\": \"Check frame position, plumb, level, squareness, and anchoring.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 7, \"checkpoint_name\": \"Verify frame protection and correct fixing method.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 8, \"checkpoint_name\": \"Check glass installation, gaskets, setting blocks, and glazing beads.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 9, \"checkpoint_name\": \"Ensure sealant is applied continuously at required junctions.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 10, \"checkpoint_name\": \"Check opening/closing mechanism, rollers, hinges, and locks.\"}, {\"phase\": \"DURING_EXECUTION\", \"serial_number\": 11, \"checkpoint_name\": \"Verify drainage holes and water discharge paths are not blocked.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 12, \"checkpoint_name\": \"Check frame alignment, finish, and uniform perimeter gaps.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 13, \"checkpoint_name\": \"Inspect glass for cracks, chips, scratches, and visible defects.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 14, \"checkpoint_name\": \"Check smooth operation, locking, and handles.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 15, \"checkpoint_name\": \"Verify sealant finish and visible frame-to-wall junctions.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 16, \"checkpoint_name\": \"Check for water ingress where applicable and confirm drainage.\"}, {\"phase\": \"AFTER_EXECUTION\", \"serial_number\": 17, \"checkpoint_name\": \"Ensure glass and frames are clean, undamaged, and properly protected until handover.\"}]');
/*!40000 ALTER TABLE `quality_checklist_templates` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `quality_checklists`
--

DROP TABLE IF EXISTS `quality_checklists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `quality_checklists` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `checklist_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('PENDING','IN_PROGRESS','COMPLETED','PASSED','FAILED','ON_HOLD') NOT NULL DEFAULT 'PENDING',
  `completion_percentage` decimal(5,2) NOT NULL DEFAULT 0.00,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  `work_head` varchar(50) DEFAULT NULL,
  `template_version` varchar(30) DEFAULT NULL,
  `template_title` varchar(255) DEFAULT NULL,
  `template_sheet_name` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_qcl_project` (`project_id`),
  KEY `idx_qcl_status` (`status`),
  KEY `idx_qcl_created_by` (`created_by`),
  KEY `idx_qcl_updated_by` (`updated_by`),
  CONSTRAINT `fk_qcl_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_qcl_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_qcl_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quality_checklists`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `quality_checklists` WRITE;
/*!40000 ALTER TABLE `quality_checklists` DISABLE KEYS */;
/*!40000 ALTER TABLE `quality_checklists` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `quotation_comparisons`
--

DROP TABLE IF EXISTS `quotation_comparisons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `quotation_comparisons` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `projectId` char(36) NOT NULL,
  `workCategory` varchar(255) DEFAULT NULL,
  `quotationIds` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`quotationIds`)),
  `comparedAt` datetime DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_quotation_comparisons_project` (`projectId`),
  CONSTRAINT `fk_quotation_comparisons_project` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quotation_comparisons`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `quotation_comparisons` WRITE;
/*!40000 ALTER TABLE `quotation_comparisons` DISABLE KEYS */;
/*!40000 ALTER TABLE `quotation_comparisons` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `quotation_items`
--

DROP TABLE IF EXISTS `quotation_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `quotation_items` (
  `id` char(36) NOT NULL,
  `quotation_id` char(36) NOT NULL,
  `sno` smallint(6) NOT NULL,
  `particular` text NOT NULL,
  `unit_id` char(36) DEFAULT NULL,
  `rate` decimal(12,2) NOT NULL DEFAULT 0.00,
  `quantity` decimal(10,3) NOT NULL DEFAULT 0.000,
  `amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `remarks` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_quotation_sno` (`quotation_id`,`sno`),
  KEY `idx_quotation_items_qid` (`quotation_id`),
  KEY `idx_quotation_items_unit_id` (`unit_id`),
  CONSTRAINT `fk_quotation_items_unit` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `quotation_items_ibfk_1` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quotation_items`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `quotation_items` WRITE;
/*!40000 ALTER TABLE `quotation_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `quotation_items` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `quotation_versions`
--

DROP TABLE IF EXISTS `quotation_versions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `quotation_versions` (
  `id` char(36) NOT NULL,
  `quotation_id` char(36) NOT NULL,
  `version` int(11) NOT NULL,
  `snapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`snapshot`)),
  `remarks` text DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_quotation_version` (`quotation_id`,`version`),
  KEY `fk_qv_created_by` (`created_by`),
  KEY `idx_qv_quotation` (`quotation_id`),
  KEY `idx_qv_created_at` (`created_at`),
  CONSTRAINT `fk_qv_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_qv_quotation` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quotation_versions`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `quotation_versions` WRITE;
/*!40000 ALTER TABLE `quotation_versions` DISABLE KEYS */;
/*!40000 ALTER TABLE `quotation_versions` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `quotations`
--

DROP TABLE IF EXISTS `quotations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `quotations` (
  `id` char(36) NOT NULL,
  `quotation_number` varchar(50) NOT NULL,
  `current_version` int(11) NOT NULL DEFAULT 1,
  `quotation_date` date NOT NULL,
  `expiry_date` date DEFAULT NULL,
  `validity_days` int(11) DEFAULT 30,
  `comparison_notes` text DEFAULT NULL,
  `selected_at` timestamp NULL DEFAULT NULL,
  `selected_by` char(36) DEFAULT NULL,
  `is_selected` tinyint(1) NOT NULL DEFAULT 0,
  `boq_reference` varchar(255) DEFAULT NULL,
  `status` enum('draft','submitted','approved','returned_for_editing','declined','cancelled') NOT NULL DEFAULT 'draft',
  `project_id` char(36) NOT NULL,
  `vendor_id` char(36) NOT NULL,
  `material_requirement_id` char(36) DEFAULT NULL,
  `project_snapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`project_snapshot`)),
  `vendor_snapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`vendor_snapshot`)),
  `subtotal` decimal(15,2) NOT NULL DEFAULT 0.00,
  `additional_charges` decimal(15,2) NOT NULL DEFAULT 0.00,
  `global_discount_type` enum('fixed','percentage') NOT NULL DEFAULT 'fixed',
  `global_discount_value` decimal(15,2) NOT NULL DEFAULT 0.00,
  `discount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `tax_percent` decimal(5,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `terms_conditions` text DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT NULL,
  `submitted_by` char(36) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `reviewed_by` char(36) DEFAULT NULL,
  `review_remarks` text DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_by` char(36) DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
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
  KEY `idx_quotations_material_requirement` (`material_requirement_id`),
  CONSTRAINT `quotations_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  CONSTRAINT `quotations_ibfk_2` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`),
  CONSTRAINT `quotations_ibfk_3` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `quotations_ibfk_4` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `quotations_ibfk_5` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `quotations_ibfk_6` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `quotations_ibfk_7` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `quotations_ibfk_8` FOREIGN KEY (`selected_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quotations`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `quotations` WRITE;
/*!40000 ALTER TABLE `quotations` DISABLE KEYS */;
/*!40000 ALTER TABLE `quotations` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `reminder_sync_records`
--

DROP TABLE IF EXISTS `reminder_sync_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `reminder_sync_records` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `kind` enum('tasks','calendar') NOT NULL,
  `local_id` char(36) NOT NULL,
  `remote_id` varchar(255) DEFAULT NULL,
  `destination` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`destination`)),
  `fingerprint` varchar(64) DEFAULT NULL,
  `status` enum('pending','synced','failed','uncertain') NOT NULL DEFAULT 'pending',
  `error` text DEFAULT NULL,
  `synced_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reminder_sync_records_user_kind_local_unique` (`user_id`,`kind`,`local_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reminder_sync_records`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `reminder_sync_records` WRITE;
/*!40000 ALTER TABLE `reminder_sync_records` DISABLE KEYS */;
/*!40000 ALTER TABLE `reminder_sync_records` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `reminder_sync_settings`
--

DROP TABLE IF EXISTS `reminder_sync_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `reminder_sync_settings` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `kind` enum('tasks','calendar') NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT 0,
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`config`)),
  `last_run` datetime DEFAULT NULL,
  `last_error` text DEFAULT NULL,
  `lock_token` char(36) DEFAULT NULL,
  `lock_until` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reminder_sync_settings_user_kind_unique` (`user_id`,`kind`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reminder_sync_settings`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `reminder_sync_settings` WRITE;
/*!40000 ALTER TABLE `reminder_sync_settings` DISABLE KEYS */;
INSERT INTO `reminder_sync_settings` VALUES
('24444457-8ae3-40dc-b6f9-4a782d310794','99632848-7f08-47b6-b200-ef55c0a4f8ec','tasks',0,'{\"timezone\": \"Asia/Kolkata\", \"portal_id\": \"60089118579\", \"project_id\": \"470419000000079850\", \"assignee_id\": \"\", \"tasklist_id\": \"\", \"task_reminder_time\": \"09:00\", \"include_undated_tasks\": false}',NULL,NULL,NULL,NULL,'2026-10-10 07:44:02','2026-10-12 11:51:26'),
('b83b0c22-9100-425c-85f2-18d3f3b3c953','9034b40f-08a6-4e04-a402-fe7397b29717','tasks',0,'{\"timezone\": \"Asia/Kolkata\", \"portal_id\": \"\", \"project_id\": \"\", \"assignee_id\": \"\", \"tasklist_id\": \"\", \"task_reminder_time\": \"09:00\", \"include_undated_tasks\": true}',NULL,NULL,NULL,NULL,'2026-10-13 05:19:02','2026-10-13 05:19:02'),
('bec8cd8f-bb7f-421d-815b-203277c6086c','d739bccb-7123-11f1-8bb6-52540021303b','tasks',1,'{\"timezone\": \"Asia/Kolkata\", \"portal_id\": \"60073600280\", \"project_id\": \"456433000000117004\", \"assignee_id\": \"60073600257\", \"tasklist_id\": \"\", \"task_reminder_time\": \"09:00\", \"include_undated_tasks\": true}','2026-10-29 11:30:17',NULL,NULL,NULL,'2026-10-08 04:50:29','2026-10-29 11:30:17'),
('cbdda22f-ffd7-42a4-871c-e35a1c463f23','d739bccb-7123-11f1-8bb6-52540021303b','calendar',1,'{\"timezone\": \"Asia/Kolkata\", \"calendar_id\": \"f617e47646fb41ab8bfe58cf26ab7dec\", \"reminder_minutes\": 30}','2026-10-29 11:30:17',NULL,NULL,NULL,'2026-10-05 10:39:59','2026-10-29 11:30:17'),
('d93fa185-97b3-4e11-be5f-798117dc07de','99632848-7f08-47b6-b200-ef55c0a4f8ec','calendar',1,'{\"timezone\": \"Asia/Kolkata\", \"calendar_id\": \"18ac1f122670492fa176731cdabeb5a6\", \"reminder_minutes\": 30}','2026-10-29 11:30:17',NULL,NULL,NULL,'2026-10-10 07:44:08','2026-10-29 11:30:18'),
('e40c4739-1db6-4ec0-8749-04fcc60fd58e','9034b40f-08a6-4e04-a402-fe7397b29717','calendar',0,'{\"timezone\": \"Asia/Kolkata\", \"calendar_id\": \"947c66b21d2146e48a1411085aa1b6ea\", \"reminder_minutes\": 30}',NULL,NULL,NULL,NULL,'2026-10-13 05:19:00','2026-10-13 05:19:00');
/*!40000 ALTER TABLE `reminder_sync_settings` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `rfis`
--

DROP TABLE IF EXISTS `rfis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `rfis` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` char(36) NOT NULL,
  `step_id` int(11) DEFAULT NULL,
  `rfi_number` int(11) NOT NULL,
  `subject` varchar(200) NOT NULL,
  `query` text NOT NULL,
  `raised_by` varchar(150) NOT NULL,
  `raised_at` datetime NOT NULL,
  `priority` enum('LOW','NORMAL','HIGH','URGENT') NOT NULL DEFAULT 'NORMAL',
  `routed_to_team_id` int(11) NOT NULL,
  `status` enum('OPEN','RESPONDED','CLOSED') NOT NULL DEFAULT 'OPEN',
  `response` text DEFAULT NULL,
  `responded_by` varchar(150) DEFAULT NULL,
  `responded_at` datetime DEFAULT NULL,
  `closed_at` datetime DEFAULT NULL,
  `attachment_urls` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`attachment_urls`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_rfis_project_id` (`project_id`),
  KEY `idx_rfis_step_id` (`step_id`),
  KEY `idx_rfis_routed_to_team_id` (`routed_to_team_id`),
  KEY `idx_rfis_status` (`status`),
  KEY `idx_rfis_priority` (`priority`),
  KEY `rfis_project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rfis`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `rfis` WRITE;
/*!40000 ALTER TABLE `rfis` DISABLE KEYS */;
/*!40000 ALTER TABLE `rfis` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `role_apps`
--

DROP TABLE IF EXISTS `role_apps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_apps` (
  `role_id` char(36) NOT NULL,
  `app_code` varchar(50) NOT NULL,
  `granted_at` datetime NOT NULL DEFAULT current_timestamp(),
  `granted_by` char(36) DEFAULT NULL,
  PRIMARY KEY (`role_id`,`app_code`) USING BTREE,
  KEY `fk_role_apps_app` (`app_code`),
  KEY `fk_role_apps_granted_by` (`granted_by`),
  CONSTRAINT `fk_role_apps_app` FOREIGN KEY (`app_code`) REFERENCES `apps` (`code`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_role_apps_granted_by` FOREIGN KEY (`granted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_role_apps_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_apps`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `role_apps` WRITE;
/*!40000 ALTER TABLE `role_apps` DISABLE KEYS */;
INSERT INTO `role_apps` VALUES
('07114f34-84d2-11f1-b721-52540021303b','accounts','2026-08-17 10:16:41',NULL),
('07114f34-84d2-11f1-b721-52540021303b','boq','2026-08-17 10:16:41',NULL),
('07114f34-84d2-11f1-b721-52540021303b','calendar','2026-08-17 10:16:41',NULL),
('07114f34-84d2-11f1-b721-52540021303b','crm','2026-08-17 10:16:41',NULL),
('07114f34-84d2-11f1-b721-52540021303b','dashboard','2026-08-17 10:16:41',NULL),
('07114f34-84d2-11f1-b721-52540021303b','documents','2026-08-17 10:16:41',NULL),
('07114f34-84d2-11f1-b721-52540021303b','inventory','2026-08-17 10:16:41',NULL),
('07114f34-84d2-11f1-b721-52540021303b','leads','2026-08-17 10:16:41',NULL),
('07114f34-84d2-11f1-b721-52540021303b','projects','2026-08-17 10:16:41',NULL),
('07114f34-84d2-11f1-b721-52540021303b','quotations','2026-08-17 10:16:41',NULL),
('07114f34-84d2-11f1-b721-52540021303b','settings','2026-08-17 10:16:41',NULL),
('07114f34-84d2-11f1-b721-52540021303b','tasks','2026-08-17 10:16:41',NULL),
('07114f34-84d2-11f1-b721-52540021303b','vendors','2026-08-17 10:16:41',NULL),
('07115348-84d2-11f1-b721-52540021303b','accounts','2026-10-13 05:24:33',NULL),
('07115348-84d2-11f1-b721-52540021303b','boq','2026-10-13 05:24:33',NULL),
('07115348-84d2-11f1-b721-52540021303b','calendar','2026-10-13 05:24:33',NULL),
('07115348-84d2-11f1-b721-52540021303b','crm','2026-10-13 05:24:33',NULL),
('07115348-84d2-11f1-b721-52540021303b','dashboard','2026-10-13 05:24:33',NULL),
('07115348-84d2-11f1-b721-52540021303b','documents','2026-10-13 05:24:33',NULL),
('07115348-84d2-11f1-b721-52540021303b','inventory','2026-10-13 05:24:33',NULL),
('07115348-84d2-11f1-b721-52540021303b','leads','2026-10-13 05:24:33',NULL),
('07115348-84d2-11f1-b721-52540021303b','projects','2026-10-13 05:24:33',NULL),
('07115348-84d2-11f1-b721-52540021303b','quotations','2026-10-13 05:24:33',NULL),
('07115348-84d2-11f1-b721-52540021303b','settings','2026-10-13 05:24:33',NULL),
('07115348-84d2-11f1-b721-52540021303b','tasks','2026-10-13 05:24:33',NULL),
('07115348-84d2-11f1-b721-52540021303b','vendors','2026-10-13 05:24:33',NULL),
('071154b6-84d2-11f1-b721-52540021303b','accounts','2026-08-17 10:16:11',NULL),
('071154b6-84d2-11f1-b721-52540021303b','boq','2026-08-17 10:16:11',NULL),
('071154b6-84d2-11f1-b721-52540021303b','calendar','2026-08-17 10:16:11',NULL),
('071154b6-84d2-11f1-b721-52540021303b','crm','2026-08-17 10:16:11',NULL),
('071154b6-84d2-11f1-b721-52540021303b','dashboard','2026-08-17 10:16:11',NULL),
('071154b6-84d2-11f1-b721-52540021303b','documents','2026-08-17 10:16:11',NULL),
('071154b6-84d2-11f1-b721-52540021303b','inventory','2026-08-17 10:16:11',NULL),
('071154b6-84d2-11f1-b721-52540021303b','leads','2026-08-17 10:16:11',NULL),
('071154b6-84d2-11f1-b721-52540021303b','projects','2026-08-17 10:16:11',NULL),
('071154b6-84d2-11f1-b721-52540021303b','quotations','2026-08-17 10:16:11',NULL),
('071154b6-84d2-11f1-b721-52540021303b','settings','2026-08-17 10:16:11',NULL),
('071154b6-84d2-11f1-b721-52540021303b','tasks','2026-08-17 10:16:11',NULL),
('071154b6-84d2-11f1-b721-52540021303b','vendors','2026-08-17 10:16:11',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','accounts','2026-10-13 05:11:54',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','boq','2026-10-13 05:11:54',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','calendar','2026-10-13 05:11:54',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','crm','2026-10-13 05:11:54',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','dashboard','2026-10-13 05:11:54',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','documents','2026-10-13 05:11:54',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','inventory','2026-10-13 05:11:54',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','leads','2026-10-13 05:11:54',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','projects','2026-10-13 05:11:54',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','quotations','2026-10-13 05:11:54',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','settings','2026-10-13 05:11:54',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','tasks','2026-10-13 05:11:54',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','vendors','2026-10-13 05:11:54',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','accounts','2026-08-17 10:16:21',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','boq','2026-08-17 10:16:21',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','calendar','2026-08-17 10:16:21',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','crm','2026-08-17 10:16:21',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','dashboard','2026-08-17 10:16:21',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','documents','2026-08-17 10:16:21',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','inventory','2026-08-17 10:16:21',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','leads','2026-08-17 10:16:21',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','quotations','2026-08-17 10:16:21',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','settings','2026-08-17 10:16:21',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','tasks','2026-08-17 10:16:21',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','vendors','2026-08-17 10:16:21',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','accounts','2026-07-28 05:29:14',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','boq','2026-07-28 05:29:14',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','calendar','2026-07-28 05:29:14',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','crm','2026-07-28 05:29:14',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','dashboard','2026-07-28 05:29:14',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','documents','2026-07-28 05:29:14',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','inventory','2026-07-28 05:29:14',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','leads','2026-07-28 05:29:14',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','projects','2026-07-28 05:29:14',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','quotations','2026-07-28 05:29:14',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','settings','2026-07-28 05:29:14',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','tasks','2026-07-28 05:29:14',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','vendors','2026-07-28 05:29:14',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','accounts','2026-10-28 11:39:53',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','adminConsole','2026-10-28 11:39:53',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','automation','2026-10-28 11:39:53',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','boq','2026-10-28 11:39:53',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','build','2026-10-28 11:39:53',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','calendar','2026-10-28 11:39:53',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','commandCenter','2026-10-28 11:39:53',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','crm','2026-10-28 11:39:53',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','dashboard','2026-10-28 11:39:53',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','design','2026-10-28 11:39:53',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','documents','2026-10-28 11:39:53',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','inventory','2026-10-28 11:39:53',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','leads','2026-10-28 11:39:53',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','projects','2026-10-28 11:39:53',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','quotations','2026-10-28 11:39:53',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','settings','2026-10-28 11:39:53',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','tasks','2026-10-28 11:39:53',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','vendors','2026-10-28 11:39:53',NULL);
/*!40000 ALTER TABLE `role_apps` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `role_id` char(36) NOT NULL,
  `permission_id` char(36) NOT NULL,
  `granted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `granted_by` char(36) DEFAULT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  KEY `granted_by` (`granted_by`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_ibfk_3` FOREIGN KEY (`granted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES
('06850ec5-6208-4db6-9b27-c6eed141b80b','65dae9af-84d2-11f1-b721-52540021303b','2026-07-25 12:18:25',NULL),
('06850ec5-6208-4db6-9b27-c6eed141b80b','65de61f5-84d2-11f1-b721-52540021303b','2026-07-25 12:18:28',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','4d35154f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','4d7031eb-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','4daa3dc0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','4de3b2b1-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','4e665014-c49b-11f1-a0d7-52540021303b','2026-10-13 10:48:06',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','4e751183-c49b-11f1-a0d7-52540021303b','2026-10-13 10:48:07',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','4e8476a9-c49b-11f1-a0d7-52540021303b','2026-10-13 10:48:07',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','4eddcde5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','4eeccf6c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','4f18902f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','4fadb488-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','4fbc5eaf-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','50165352-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','509580c5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','50b2e1fc-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','50c1762b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','50d02aaa-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','5190aea7-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','51bc7d35-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','51cbdf08-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','51dada48-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','522369fb-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','52512ba5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','526f4ace-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','527ea369-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','52ace725-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','52ca8d7f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','52f6eb78-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','5305c669-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','53316ae2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','535c91c2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','53aa9247-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','53cc1d17-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','53e9beba-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','53f8815a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','553732d5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','55e8931b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','56319fe4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','56797f6d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','56964305-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','56b40667-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','56c28d25-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','56df964d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','56ee50c9-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','5761aa24-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','57b8cbde-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','582d7c54-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','586863e4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','58bf2127-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','58f8e16b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','594146f4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','595e3be5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','597b650b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','5989ddee-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','59984a70-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','59a6a5a3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','59b53ae4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','59d21256-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','59e0b334-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','59ef5616-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','59fdd97d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','5a29a360-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','5a385bab-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','5a6489c0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','5aa0a6cd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','5adaa343-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','5b4095a8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','5b7a4148-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','5b88bc3b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','5bc2b77a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','5c19f0c4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','5c9cbc63-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','5d2e5a5f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','5d4b608c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','5d59f16a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','5d688a94-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','5ddccb4e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','5df9846c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','5e16ba11-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','5e6ea27b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','5e99e19c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','5ee2f707-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','5f004673-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','5f2b7254-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','5f577c43-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','5f65d1bd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','5fbd866a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','5fda86e3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','6006a4d8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','6033fcd3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','6080e969-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','609f1a6a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','60ae6b68-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','60dd1e99-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','61583b0c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','6185bf97-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','6195539a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','61c4b500-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','61f2d9f0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','62029204-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','622215c8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','628f9135-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','62e29c26-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','63541820-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','6383edce-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','63a58b5f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','63b451b2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','63f17b64-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','6400ce34-c49b-11f1-a0d7-52540021303b','2026-10-13 10:47:30',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','640fc58a-c49b-11f1-a0d7-52540021303b','2026-10-13 10:47:31',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','641e6ece-c49b-11f1-a0d7-52540021303b','2026-10-13 10:47:31',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','643101f1-c49b-11f1-a0d7-52540021303b','2026-10-13 10:47:40',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','644190ca-c49b-11f1-a0d7-52540021303b','2026-10-13 10:47:32',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','6451d9df-c49b-11f1-a0d7-52540021303b','2026-10-13 10:47:33',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','6460d23f-c49b-11f1-a0d7-52540021303b','2026-10-13 10:47:33',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','64705df5-c49b-11f1-a0d7-52540021303b','2026-10-13 10:47:33',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','64811c13-c49b-11f1-a0d7-52540021303b','2026-10-13 10:47:18',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','64905415-c49b-11f1-a0d7-52540021303b','2026-10-13 10:47:19',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','64a0a23a-c49b-11f1-a0d7-52540021303b','2026-10-13 10:47:20',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','64b16003-c49b-11f1-a0d7-52540021303b','2026-10-13 10:47:34',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','64c1b2ea-c49b-11f1-a0d7-52540021303b','2026-10-13 10:47:34',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','64d14267-c49b-11f1-a0d7-52540021303b','2026-10-13 10:47:35',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','64e2387e-c49b-11f1-a0d7-52540021303b','2026-10-13 10:47:35',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','64f1d0a0-c49b-11f1-a0d7-52540021303b','2026-10-13 10:47:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','650179d9-c49b-11f1-a0d7-52540021303b','2026-10-13 10:47:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','6510e36a-c49b-11f1-a0d7-52540021303b','2026-10-13 10:47:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65de7231-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65de72e7-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65de739d-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65de745a-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65de7520-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65de75cd-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65de7eac-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65de8012-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65de80d9-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65de81ae-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65de8274-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65de8327-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65de83db-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65de84c3-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65de859e-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65de867b-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65de875b-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65de8824-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65de88dc-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65de89b1-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65de8a87-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65de8b74-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65de8c4d-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65de8eb6-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65de8f82-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65de9059-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65de9121-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65de91fa-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65de92d1-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65de939e-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65de9485-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65de9e7f-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65de9f5e-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65dea046-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65dea117-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65dea1e8-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65dea2a4-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65dea373-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65dea44f-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','65dea53c-84d2-11f1-b721-52540021303b','2026-07-21 12:37:36',NULL),
('070dd7b5-84d2-11f1-b721-52540021303b','b3675e12-ae64-11f1-b327-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','4d35154f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','4d7031eb-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','4daa3dc0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','4de3b2b1-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','4eddcde5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','4eeccf6c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','4f18902f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','4fadb488-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','509580c5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','50b2e1fc-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','50c1762b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','50d02aaa-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','5190aea7-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','51bc7d35-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','51cbdf08-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','51dada48-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','522369fb-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','526f4ace-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','52ace725-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','52ca8d7f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','52f6eb78-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','5305c669-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','53316ae2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','535c91c2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','53aa9247-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','53cc1d17-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','53e9beba-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','53f8815a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','553732d5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','55e8931b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','56797f6d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','56964305-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','56b40667-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','56c28d25-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','56df964d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','56ee50c9-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','57b8cbde-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','58f8e16b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','597b650b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','59a6a5a3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','59e0b334-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','5a29a360-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','5a6489c0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','5aa0a6cd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','5adaa343-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','5b88bc3b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','5d4b608c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','5d688a94-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','5df9846c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','5e6ea27b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','5e99e19c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','5ee2f707-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','5f004673-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','5f2b7254-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','5f65d1bd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','5fbd866a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','5fda86e3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','6006a4d8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','6080e969-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','609f1a6a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','60ae6b68-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','60dd1e99-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','61583b0c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','6185bf97-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','6195539a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','61c4b500-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','61f2d9f0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','62029204-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','628f9135-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','62e29c26-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','63541820-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','6383edce-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','63b451b2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','63f17b64-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07114f34-84d2-11f1-b721-52540021303b','65de7231-84d2-11f1-b721-52540021303b','2026-07-21 12:37:42',NULL),
('07114f34-84d2-11f1-b721-52540021303b','65de72e7-84d2-11f1-b721-52540021303b','2026-07-21 12:37:42',NULL),
('07114f34-84d2-11f1-b721-52540021303b','65de739d-84d2-11f1-b721-52540021303b','2026-07-21 12:37:42',NULL),
('07114f34-84d2-11f1-b721-52540021303b','65de7eac-84d2-11f1-b721-52540021303b','2026-07-21 12:37:42',NULL),
('07114f34-84d2-11f1-b721-52540021303b','65de8012-84d2-11f1-b721-52540021303b','2026-07-21 12:37:42',NULL),
('07114f34-84d2-11f1-b721-52540021303b','65de80d9-84d2-11f1-b721-52540021303b','2026-07-21 12:37:42',NULL),
('07114f34-84d2-11f1-b721-52540021303b','65de84c3-84d2-11f1-b721-52540021303b','2026-07-21 12:37:42',NULL),
('07114f34-84d2-11f1-b721-52540021303b','65de859e-84d2-11f1-b721-52540021303b','2026-07-21 12:37:42',NULL),
('07114f34-84d2-11f1-b721-52540021303b','65de867b-84d2-11f1-b721-52540021303b','2026-07-21 12:37:42',NULL),
('07114f34-84d2-11f1-b721-52540021303b','65de8824-84d2-11f1-b721-52540021303b','2026-07-21 12:37:42',NULL),
('07114f34-84d2-11f1-b721-52540021303b','65de88dc-84d2-11f1-b721-52540021303b','2026-07-21 12:37:42',NULL),
('07114f34-84d2-11f1-b721-52540021303b','65de89b1-84d2-11f1-b721-52540021303b','2026-07-21 12:37:42',NULL),
('07114f34-84d2-11f1-b721-52540021303b','65de8eb6-84d2-11f1-b721-52540021303b','2026-07-21 12:37:42',NULL),
('07114f34-84d2-11f1-b721-52540021303b','65de8f82-84d2-11f1-b721-52540021303b','2026-07-21 12:37:42',NULL),
('07114f34-84d2-11f1-b721-52540021303b','65de9059-84d2-11f1-b721-52540021303b','2026-07-21 12:37:42',NULL),
('07114f34-84d2-11f1-b721-52540021303b','65de91fa-84d2-11f1-b721-52540021303b','2026-07-21 12:37:42',NULL),
('07114f34-84d2-11f1-b721-52540021303b','65de92d1-84d2-11f1-b721-52540021303b','2026-07-21 12:37:42',NULL),
('07114f34-84d2-11f1-b721-52540021303b','65de939e-84d2-11f1-b721-52540021303b','2026-07-21 12:37:42',NULL),
('07114f34-84d2-11f1-b721-52540021303b','65de9e7f-84d2-11f1-b721-52540021303b','2026-07-21 12:37:42',NULL),
('07114f34-84d2-11f1-b721-52540021303b','65de9f5e-84d2-11f1-b721-52540021303b','2026-07-21 12:37:42',NULL),
('07114f34-84d2-11f1-b721-52540021303b','65dea046-84d2-11f1-b721-52540021303b','2026-07-21 12:37:42',NULL),
('07114f34-84d2-11f1-b721-52540021303b','65dea2a4-84d2-11f1-b721-52540021303b','2026-07-21 12:37:42',NULL),
('07114f34-84d2-11f1-b721-52540021303b','65dea373-84d2-11f1-b721-52540021303b','2026-07-21 12:37:42',NULL),
('07114f34-84d2-11f1-b721-52540021303b','65dea44f-84d2-11f1-b721-52540021303b','2026-07-21 12:37:42',NULL),
('07114f34-84d2-11f1-b721-52540021303b','65deae96-84d2-11f1-b721-52540021303b','2026-07-21 13:59:53',NULL),
('07114f34-84d2-11f1-b721-52540021303b','b3675e12-ae64-11f1-b327-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','4d35154f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','4d7031eb-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','4daa3dc0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','4de3b2b1-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','4eddcde5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','4eeccf6c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','4f18902f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','4fadb488-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','4fbc5eaf-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','50165352-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','509580c5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','50b2e1fc-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','50c1762b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','50d02aaa-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','5190aea7-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','51bc7d35-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','51cbdf08-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','51dada48-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','522369fb-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','52512ba5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','526f4ace-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','527ea369-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','52ace725-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','52ca8d7f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','52f6eb78-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','5305c669-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','53316ae2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','535c91c2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','53aa9247-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','53cc1d17-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','53e9beba-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','53f8815a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','553732d5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','55e8931b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','56319fe4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','56797f6d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','56964305-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','56b40667-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','56c28d25-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','56df964d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','56ee50c9-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','5761aa24-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','57b8cbde-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','582d7c54-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','586863e4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','58bf2127-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','58f8e16b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','594146f4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','595e3be5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','597b650b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','5989ddee-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','59984a70-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','59a6a5a3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','59b53ae4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','59d21256-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','59e0b334-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','59ef5616-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','59fdd97d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','5a29a360-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','5a385bab-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','5a6489c0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','5aa0a6cd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','5adaa343-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','5b4095a8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','5b7a4148-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','5b88bc3b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','5bc2b77a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','5c19f0c4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','5c9cbc63-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','5d2e5a5f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','5d4b608c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','5d59f16a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','5d688a94-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','5ddccb4e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','5df9846c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','5e16ba11-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','5e6ea27b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','5e99e19c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','5ee2f707-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','5f004673-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','5f2b7254-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','5f577c43-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','5f65d1bd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','5fbd866a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','5fda86e3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','6006a4d8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','6033fcd3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','6080e969-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','609f1a6a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','60ae6b68-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','60dd1e99-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','61583b0c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','6185bf97-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','6195539a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','61c4b500-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','61f2d9f0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','62029204-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','622215c8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','628f9135-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','62e29c26-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','63541820-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','6383edce-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','63a58b5f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','63b451b2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','63f17b64-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65de7231-84d2-11f1-b721-52540021303b','2026-07-21 12:37:46',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65de72e7-84d2-11f1-b721-52540021303b','2026-07-21 12:37:46',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65de739d-84d2-11f1-b721-52540021303b','2026-07-21 12:37:46',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65de745a-84d2-11f1-b721-52540021303b','2026-07-21 12:37:46',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65de7520-84d2-11f1-b721-52540021303b','2026-07-21 12:37:46',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65de75cd-84d2-11f1-b721-52540021303b','2026-07-21 12:37:46',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65de7eac-84d2-11f1-b721-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65de80d9-84d2-11f1-b721-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65de8327-84d2-11f1-b721-52540021303b','2026-10-10 16:53:13',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65de8824-84d2-11f1-b721-52540021303b','2026-07-21 12:37:46',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65de88dc-84d2-11f1-b721-52540021303b','2026-07-21 12:37:46',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65de89b1-84d2-11f1-b721-52540021303b','2026-07-21 12:37:46',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65de8a87-84d2-11f1-b721-52540021303b','2026-07-21 12:37:46',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65de8b74-84d2-11f1-b721-52540021303b','2026-07-21 12:37:46',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65de8c4d-84d2-11f1-b721-52540021303b','2026-07-21 12:37:46',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65de8eb6-84d2-11f1-b721-52540021303b','2026-07-21 12:37:46',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65de8f82-84d2-11f1-b721-52540021303b','2026-07-21 12:37:46',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65de9059-84d2-11f1-b721-52540021303b','2026-07-21 12:37:46',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65de9121-84d2-11f1-b721-52540021303b','2026-07-21 12:37:46',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65de91fa-84d2-11f1-b721-52540021303b','2026-07-21 12:37:46',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65de92d1-84d2-11f1-b721-52540021303b','2026-07-21 12:37:46',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65de939e-84d2-11f1-b721-52540021303b','2026-07-21 12:37:46',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65de9485-84d2-11f1-b721-52540021303b','2026-07-21 12:37:46',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65de9e7f-84d2-11f1-b721-52540021303b','2026-07-21 12:37:46',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65de9f5e-84d2-11f1-b721-52540021303b','2026-07-21 12:37:46',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65dea046-84d2-11f1-b721-52540021303b','2026-07-21 12:37:46',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65dea117-84d2-11f1-b721-52540021303b','2026-07-21 12:37:46',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65dea1e8-84d2-11f1-b721-52540021303b','2026-07-21 12:37:46',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65dea2a4-84d2-11f1-b721-52540021303b','2026-07-21 12:37:46',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65dea373-84d2-11f1-b721-52540021303b','2026-07-21 12:37:46',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65dea44f-84d2-11f1-b721-52540021303b','2026-07-21 12:37:46',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65dea53c-84d2-11f1-b721-52540021303b','2026-07-21 12:37:46',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65dea6a7-84d2-11f1-b721-52540021303b','2026-07-21 12:37:46',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65dea7ae-84d2-11f1-b721-52540021303b','2026-07-21 12:37:46',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65dea874-84d2-11f1-b721-52540021303b','2026-07-21 12:37:46',NULL),
('071151f6-84d2-11f1-b721-52540021303b','65dea953-84d2-11f1-b721-52540021303b','2026-07-21 12:37:46',NULL),
('071151f6-84d2-11f1-b721-52540021303b','b3675e12-ae64-11f1-b327-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','4d35154f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','4d7031eb-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','4daa3dc0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','4de3b2b1-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','4e665014-c49b-11f1-a0d7-52540021303b','2026-10-12 17:36:41',NULL),
('07115348-84d2-11f1-b721-52540021303b','4e751183-c49b-11f1-a0d7-52540021303b','2026-10-12 17:36:41',NULL),
('07115348-84d2-11f1-b721-52540021303b','4e8476a9-c49b-11f1-a0d7-52540021303b','2026-10-12 17:36:42',NULL),
('07115348-84d2-11f1-b721-52540021303b','4eddcde5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','4eeccf6c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','4f18902f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','4fadb488-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','509580c5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','50b2e1fc-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','50c1762b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','50d02aaa-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','5129c322-c49b-11f1-a0d7-52540021303b','2026-10-13 09:42:06',NULL),
('07115348-84d2-11f1-b721-52540021303b','5146e96b-c49b-11f1-a0d7-52540021303b','2026-10-13 09:42:07',NULL),
('07115348-84d2-11f1-b721-52540021303b','5164b941-c49b-11f1-a0d7-52540021303b','2026-10-13 10:55:10',NULL),
('07115348-84d2-11f1-b721-52540021303b','5190aea7-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','51bc7d35-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','51cbdf08-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','51dada48-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','51e93b83-c49b-11f1-a0d7-52540021303b','2026-10-13 09:38:40',NULL),
('07115348-84d2-11f1-b721-52540021303b','51f7a177-c49b-11f1-a0d7-52540021303b','2026-10-13 09:38:41',NULL),
('07115348-84d2-11f1-b721-52540021303b','522369fb-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','526f4ace-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','52ace725-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','52ca8d7f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','52f6eb78-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','5305c669-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','53316ae2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','535c91c2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','53aa9247-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','53cc1d17-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','53e9beba-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','53f8815a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','553732d5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','558146f9-c49b-11f1-a0d7-52540021303b','2026-10-13 09:45:31',NULL),
('07115348-84d2-11f1-b721-52540021303b','55e8931b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','56797f6d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','56964305-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','56b40667-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','56c28d25-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','56df964d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','56ee50c9-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','57b8cbde-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','57c7541b-c49b-11f1-a0d7-52540021303b','2026-10-13 10:55:50',NULL),
('07115348-84d2-11f1-b721-52540021303b','57e41824-c49b-11f1-a0d7-52540021303b','2026-10-13 10:55:52',NULL),
('07115348-84d2-11f1-b721-52540021303b','57f2817e-c49b-11f1-a0d7-52540021303b','2026-10-13 10:55:53',NULL),
('07115348-84d2-11f1-b721-52540021303b','58010369-c49b-11f1-a0d7-52540021303b','2026-10-13 10:55:57',NULL),
('07115348-84d2-11f1-b721-52540021303b','58f8e16b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','595e3be5-c49b-11f1-a0d7-52540021303b','2026-10-13 10:56:05',NULL),
('07115348-84d2-11f1-b721-52540021303b','597b650b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','5989ddee-c49b-11f1-a0d7-52540021303b','2026-10-13 10:56:07',NULL),
('07115348-84d2-11f1-b721-52540021303b','59984a70-c49b-11f1-a0d7-52540021303b','2026-10-13 10:56:08',NULL),
('07115348-84d2-11f1-b721-52540021303b','59a6a5a3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','59b53ae4-c49b-11f1-a0d7-52540021303b','2026-10-13 10:56:10',NULL),
('07115348-84d2-11f1-b721-52540021303b','59d21256-c49b-11f1-a0d7-52540021303b','2026-10-13 10:56:11',NULL),
('07115348-84d2-11f1-b721-52540021303b','59e0b334-c49b-11f1-a0d7-52540021303b','2026-10-13 10:56:15',NULL),
('07115348-84d2-11f1-b721-52540021303b','59ef5616-c49b-11f1-a0d7-52540021303b','2026-10-13 10:56:12',NULL),
('07115348-84d2-11f1-b721-52540021303b','5a29a360-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','5a6489c0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','5a731f49-c49b-11f1-a0d7-52540021303b','2026-10-13 10:56:21',NULL),
('07115348-84d2-11f1-b721-52540021303b','5aa0a6cd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','5abdc5d4-c49b-11f1-a0d7-52540021303b','2026-10-27 12:17:22','d739bccb-7123-11f1-8bb6-52540021303b'),
('07115348-84d2-11f1-b721-52540021303b','5adaa343-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','5b88bc3b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','5d2e5a5f-c49b-11f1-a0d7-52540021303b','2026-10-27 12:59:22','d739bccb-7123-11f1-8bb6-52540021303b'),
('07115348-84d2-11f1-b721-52540021303b','5d3ccd94-c49b-11f1-a0d7-52540021303b','2026-10-27 12:59:23','d739bccb-7123-11f1-8bb6-52540021303b'),
('07115348-84d2-11f1-b721-52540021303b','5d4b608c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','5d59f16a-c49b-11f1-a0d7-52540021303b','2026-10-27 12:59:24','d739bccb-7123-11f1-8bb6-52540021303b'),
('07115348-84d2-11f1-b721-52540021303b','5d688a94-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','5df9846c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','5e6ea27b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','5e99e19c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','5ee2f707-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','5f004673-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','5f2b7254-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','5f65d1bd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','5fbd866a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','5fda86e3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','5fe8f2e8-c49b-11f1-a0d7-52540021303b','2026-10-27 12:45:01','d739bccb-7123-11f1-8bb6-52540021303b'),
('07115348-84d2-11f1-b721-52540021303b','5ff7f38d-c49b-11f1-a0d7-52540021303b','2026-10-27 12:45:03','d739bccb-7123-11f1-8bb6-52540021303b'),
('07115348-84d2-11f1-b721-52540021303b','6006a4d8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','6015674a-c49b-11f1-a0d7-52540021303b','2026-10-27 12:45:04','d739bccb-7123-11f1-8bb6-52540021303b'),
('07115348-84d2-11f1-b721-52540021303b','6024d73f-c49b-11f1-a0d7-52540021303b','2026-10-27 12:45:05','d739bccb-7123-11f1-8bb6-52540021303b'),
('07115348-84d2-11f1-b721-52540021303b','6033fcd3-c49b-11f1-a0d7-52540021303b','2026-10-27 12:45:08','d739bccb-7123-11f1-8bb6-52540021303b'),
('07115348-84d2-11f1-b721-52540021303b','6080e969-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','609f1a6a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','60ae6b68-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','60dd1e99-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','61583b0c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','6185bf97-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','6195539a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','61c4b500-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','61f2d9f0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','62029204-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','628f9135-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','62e29c26-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','63541820-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','6383edce-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','63b451b2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','63f17b64-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:13',NULL),
('07115348-84d2-11f1-b721-52540021303b','641e6ece-c49b-11f1-a0d7-52540021303b','2026-10-13 09:44:35',NULL),
('07115348-84d2-11f1-b721-52540021303b','644190ca-c49b-11f1-a0d7-52540021303b','2026-10-13 09:44:24',NULL),
('07115348-84d2-11f1-b721-52540021303b','6451d9df-c49b-11f1-a0d7-52540021303b','2026-10-13 09:44:25',NULL),
('07115348-84d2-11f1-b721-52540021303b','6460d23f-c49b-11f1-a0d7-52540021303b','2026-10-13 09:44:26',NULL),
('07115348-84d2-11f1-b721-52540021303b','64705df5-c49b-11f1-a0d7-52540021303b','2026-10-13 09:44:27',NULL),
('07115348-84d2-11f1-b721-52540021303b','64811c13-c49b-11f1-a0d7-52540021303b','2026-10-13 09:44:08',NULL),
('07115348-84d2-11f1-b721-52540021303b','64905415-c49b-11f1-a0d7-52540021303b','2026-10-13 09:44:09',NULL),
('07115348-84d2-11f1-b721-52540021303b','64a0a23a-c49b-11f1-a0d7-52540021303b','2026-10-13 09:44:10',NULL),
('07115348-84d2-11f1-b721-52540021303b','64b16003-c49b-11f1-a0d7-52540021303b','2026-10-13 09:44:29',NULL),
('07115348-84d2-11f1-b721-52540021303b','64c1b2ea-c49b-11f1-a0d7-52540021303b','2026-10-13 09:44:30',NULL),
('07115348-84d2-11f1-b721-52540021303b','64d14267-c49b-11f1-a0d7-52540021303b','2026-10-13 09:44:31',NULL),
('07115348-84d2-11f1-b721-52540021303b','64e2387e-c49b-11f1-a0d7-52540021303b','2026-10-13 09:44:31',NULL),
('07115348-84d2-11f1-b721-52540021303b','64f1d0a0-c49b-11f1-a0d7-52540021303b','2026-10-13 09:44:32',NULL),
('07115348-84d2-11f1-b721-52540021303b','650179d9-c49b-11f1-a0d7-52540021303b','2026-10-13 09:44:33',NULL),
('07115348-84d2-11f1-b721-52540021303b','6510e36a-c49b-11f1-a0d7-52540021303b','2026-10-13 09:44:33',NULL),
('07115348-84d2-11f1-b721-52540021303b','65dae9af-84d2-11f1-b721-52540021303b','2026-10-13 09:38:04',NULL),
('07115348-84d2-11f1-b721-52540021303b','65de61f5-84d2-11f1-b721-52540021303b','2026-10-13 09:38:05',NULL),
('07115348-84d2-11f1-b721-52540021303b','65de653c-84d2-11f1-b721-52540021303b','2026-10-13 09:38:39',NULL),
('07115348-84d2-11f1-b721-52540021303b','65de7231-84d2-11f1-b721-52540021303b','2026-07-21 12:37:51',NULL),
('07115348-84d2-11f1-b721-52540021303b','65de72e7-84d2-11f1-b721-52540021303b','2026-07-21 12:37:51',NULL),
('07115348-84d2-11f1-b721-52540021303b','65de739d-84d2-11f1-b721-52540021303b','2026-07-21 12:37:51',NULL),
('07115348-84d2-11f1-b721-52540021303b','65de767f-84d2-11f1-b721-52540021303b','2026-10-13 09:38:29',NULL),
('07115348-84d2-11f1-b721-52540021303b','65de773a-84d2-11f1-b721-52540021303b','2026-10-13 09:38:28',NULL),
('07115348-84d2-11f1-b721-52540021303b','65de7a20-84d2-11f1-b721-52540021303b','2026-10-13 09:45:22',NULL),
('07115348-84d2-11f1-b721-52540021303b','65de8012-84d2-11f1-b721-52540021303b','2026-10-13 10:54:52',NULL),
('07115348-84d2-11f1-b721-52540021303b','65de8327-84d2-11f1-b721-52540021303b','2026-10-13 10:54:49',NULL),
('07115348-84d2-11f1-b721-52540021303b','65de8824-84d2-11f1-b721-52540021303b','2026-07-21 12:37:51',NULL),
('07115348-84d2-11f1-b721-52540021303b','65de88dc-84d2-11f1-b721-52540021303b','2026-07-21 12:37:51',NULL),
('07115348-84d2-11f1-b721-52540021303b','65de89b1-84d2-11f1-b721-52540021303b','2026-07-21 12:37:51',NULL),
('07115348-84d2-11f1-b721-52540021303b','65de8b74-84d2-11f1-b721-52540021303b','2026-10-13 09:38:46',NULL),
('07115348-84d2-11f1-b721-52540021303b','65de8eb6-84d2-11f1-b721-52540021303b','2026-07-21 12:37:51',NULL),
('07115348-84d2-11f1-b721-52540021303b','65de8f82-84d2-11f1-b721-52540021303b','2026-07-21 12:37:51',NULL),
('07115348-84d2-11f1-b721-52540021303b','65de9059-84d2-11f1-b721-52540021303b','2026-07-21 12:37:51',NULL),
('07115348-84d2-11f1-b721-52540021303b','65de91fa-84d2-11f1-b721-52540021303b','2026-07-21 12:37:51',NULL),
('07115348-84d2-11f1-b721-52540021303b','65de92d1-84d2-11f1-b721-52540021303b','2026-07-21 12:37:51',NULL),
('07115348-84d2-11f1-b721-52540021303b','65de939e-84d2-11f1-b721-52540021303b','2026-07-21 12:37:51',NULL),
('07115348-84d2-11f1-b721-52540021303b','65de9e7f-84d2-11f1-b721-52540021303b','2026-07-21 12:37:51',NULL),
('07115348-84d2-11f1-b721-52540021303b','65de9f5e-84d2-11f1-b721-52540021303b','2026-07-21 12:37:51',NULL),
('07115348-84d2-11f1-b721-52540021303b','65dea046-84d2-11f1-b721-52540021303b','2026-07-21 12:37:51',NULL),
('07115348-84d2-11f1-b721-52540021303b','65dea2a4-84d2-11f1-b721-52540021303b','2026-07-21 12:37:51',NULL),
('07115348-84d2-11f1-b721-52540021303b','65dea373-84d2-11f1-b721-52540021303b','2026-07-21 12:37:51',NULL),
('07115348-84d2-11f1-b721-52540021303b','65dea44f-84d2-11f1-b721-52540021303b','2026-07-21 12:37:51',NULL),
('07115348-84d2-11f1-b721-52540021303b','65dea6a7-84d2-11f1-b721-52540021303b','2026-07-21 12:37:51',NULL),
('07115348-84d2-11f1-b721-52540021303b','65dea7ae-84d2-11f1-b721-52540021303b','2026-07-21 12:37:51',NULL),
('07115348-84d2-11f1-b721-52540021303b','65dea874-84d2-11f1-b721-52540021303b','2026-07-21 12:37:51',NULL),
('07115348-84d2-11f1-b721-52540021303b','65deaf4b-84d2-11f1-b721-52540021303b','2026-10-13 09:39:00',NULL),
('07115348-84d2-11f1-b721-52540021303b','65deb0d1-84d2-11f1-b721-52540021303b','2026-10-13 09:38:38',NULL),
('07115348-84d2-11f1-b721-52540021303b','b3675e12-ae64-11f1-b327-52540021303b','2026-10-10 16:53:13',NULL),
('071153fc-84d2-11f1-b721-52540021303b','4d35154f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','4d530b5b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','4d7031eb-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','4d7efa0e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','4d8d6867-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','4daa3dc0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','4db89857-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','4de3b2b1-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','4eddcde5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','4eeccf6c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','4f18902f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','4fadb488-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','509580c5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','50b2e1fc-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','50c1762b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','50d02aaa-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','51821c11-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','5190aea7-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','51cbdf08-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','51dada48-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','522369fb-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','526f4ace-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','52ace725-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','52f6eb78-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','53316ae2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','533fcc5f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','535c91c2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','536b249c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','53797c42-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','53aa9247-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','53bb6743-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','53e9beba-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','553732d5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','55e8931b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','56797f6d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','56964305-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','56b40667-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','56c28d25-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','56df964d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','56ee50c9-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','57b8cbde-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','58dbe38a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','58f8e16b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','59075fdb-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','597b650b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','59a6a5a3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','59e0b334-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','5a29a360-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','5a6489c0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','5aa0a6cd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','5adaa343-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','5b5d5298-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','5b88bc3b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','5b97184b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','5d4b608c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','5d688a94-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','5df9846c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','5e6ea27b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','5e7d32ef-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','5e99e19c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','5ea89d33-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','5eb74719-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','5ec5c8f6-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','5ed4415b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','5ee2f707-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','5ef1cbaa-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','5f004673-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','5f1d0c50-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','5f2b7254-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','5f3a1e82-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','5f48e95f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','5f65d1bd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','5f748888-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','5f83631e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','5f91d093-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','5fa0373d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','5faf1f62-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','5fbd866a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','5fcbf941-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','5fda86e3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','5fe8f2e8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','6006a4d8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','6024d73f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','6033fcd3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','6080e969-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','609f1a6a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','60ae6b68-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','60dd1e99-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','61583b0c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','6185bf97-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','6195539a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','61c4b500-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','61f2d9f0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','62029204-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','628f9135-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','62e29c26-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','63541820-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','6383edce-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','63a58b5f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','63b451b2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','63f17b64-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('071153fc-84d2-11f1-b721-52540021303b','65de7231-84d2-11f1-b721-52540021303b','2026-07-21 12:37:57',NULL),
('071153fc-84d2-11f1-b721-52540021303b','65de72e7-84d2-11f1-b721-52540021303b','2026-07-21 12:37:57',NULL),
('071153fc-84d2-11f1-b721-52540021303b','65de739d-84d2-11f1-b721-52540021303b','2026-07-21 12:37:57',NULL),
('071153fc-84d2-11f1-b721-52540021303b','65de8824-84d2-11f1-b721-52540021303b','2026-07-21 12:37:57',NULL),
('071153fc-84d2-11f1-b721-52540021303b','65de88dc-84d2-11f1-b721-52540021303b','2026-07-21 12:37:57',NULL),
('071153fc-84d2-11f1-b721-52540021303b','65de89b1-84d2-11f1-b721-52540021303b','2026-07-21 12:37:57',NULL),
('071153fc-84d2-11f1-b721-52540021303b','65de8b74-84d2-11f1-b721-52540021303b','2026-07-21 12:37:57',NULL),
('071153fc-84d2-11f1-b721-52540021303b','65de91fa-84d2-11f1-b721-52540021303b','2026-07-21 12:37:57',NULL),
('071153fc-84d2-11f1-b721-52540021303b','65de92d1-84d2-11f1-b721-52540021303b','2026-07-21 12:37:57',NULL),
('071153fc-84d2-11f1-b721-52540021303b','65de939e-84d2-11f1-b721-52540021303b','2026-07-21 12:37:57',NULL),
('071153fc-84d2-11f1-b721-52540021303b','65de9e7f-84d2-11f1-b721-52540021303b','2026-07-21 12:37:57',NULL),
('071153fc-84d2-11f1-b721-52540021303b','65de9f5e-84d2-11f1-b721-52540021303b','2026-07-21 12:37:57',NULL),
('071153fc-84d2-11f1-b721-52540021303b','65dea046-84d2-11f1-b721-52540021303b','2026-07-21 12:37:57',NULL),
('071153fc-84d2-11f1-b721-52540021303b','65dea2a4-84d2-11f1-b721-52540021303b','2026-07-21 12:37:57',NULL),
('071153fc-84d2-11f1-b721-52540021303b','65dea373-84d2-11f1-b721-52540021303b','2026-07-21 12:37:57',NULL),
('071153fc-84d2-11f1-b721-52540021303b','65dea44f-84d2-11f1-b721-52540021303b','2026-07-21 12:37:57',NULL),
('071153fc-84d2-11f1-b721-52540021303b','b3675e12-ae64-11f1-b327-52540021303b','2026-10-10 16:53:14',NULL),
('071154b6-84d2-11f1-b721-52540021303b','65dae9af-84d2-11f1-b721-52540021303b','2026-07-25 11:24:45',NULL),
('071154b6-84d2-11f1-b721-52540021303b','65de72e7-84d2-11f1-b721-52540021303b','2026-07-21 12:38:03',NULL),
('071154b6-84d2-11f1-b721-52540021303b','65de8012-84d2-11f1-b721-52540021303b','2026-07-21 12:38:03',NULL),
('071154b6-84d2-11f1-b721-52540021303b','65de88dc-84d2-11f1-b721-52540021303b','2026-07-21 12:38:03',NULL),
('071154b6-84d2-11f1-b721-52540021303b','65de8b74-84d2-11f1-b721-52540021303b','2026-07-21 12:38:03',NULL),
('071154b6-84d2-11f1-b721-52540021303b','65de8f82-84d2-11f1-b721-52540021303b','2026-07-21 12:38:03',NULL),
('071154b6-84d2-11f1-b721-52540021303b','65dea373-84d2-11f1-b721-52540021303b','2026-07-21 12:38:03',NULL),
('071154b6-84d2-11f1-b721-52540021303b','65dead0c-84d2-11f1-b721-52540021303b','2026-07-21 12:38:03',NULL),
('071154b6-84d2-11f1-b721-52540021303b','65deae96-84d2-11f1-b721-52540021303b','2026-07-21 13:21:08',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','4d35154f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','4d530b5b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','4d7031eb-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','4d7efa0e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','4d8d6867-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','4daa3dc0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','4db89857-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','4de3b2b1-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','4e665014-c49b-11f1-a0d7-52540021303b','2026-10-13 10:42:08',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','4e751183-c49b-11f1-a0d7-52540021303b','2026-10-13 10:42:08',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','4e8476a9-c49b-11f1-a0d7-52540021303b','2026-10-13 10:42:09',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','4eddcde5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','4eeccf6c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','4f18902f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','4fadb488-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','4fbc5eaf-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','4fe94691-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','50165352-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5033a409-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','509580c5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','50b2e1fc-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','50c1762b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','50d02aaa-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','50dfc90d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','50ee7d9c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','50fd9170-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','510bf933-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5129c322-c49b-11f1-a0d7-52540021303b','2026-10-13 10:42:19',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5146e96b-c49b-11f1-a0d7-52540021303b','2026-10-13 10:42:23',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5164b941-c49b-11f1-a0d7-52540021303b','2026-10-13 10:42:25',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','51734d55-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','51821c11-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5190aea7-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','51adc839-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','51bc7d35-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','51cbdf08-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','51dada48-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','51e93b83-c49b-11f1-a0d7-52540021303b','2026-10-13 10:42:33',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','51f7a177-c49b-11f1-a0d7-52540021303b','2026-10-13 10:42:33',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','522369fb-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','52512ba5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','526f4ace-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','527ea369-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','52ace725-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','52ca8d7f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','52f6eb78-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5305c669-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','53316ae2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','533fcc5f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','535c91c2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','536b249c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','53797c42-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','53aa9247-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','53bb6743-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','53cc1d17-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','53e9beba-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','53f8815a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','553732d5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','558146f9-c49b-11f1-a0d7-52540021303b','2026-10-13 10:42:53',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','558fb34b-c49b-11f1-a0d7-52540021303b','2026-10-13 10:42:54',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','55e8931b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','56319fe4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','56797f6d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','56964305-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','56b40667-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','56c28d25-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','56df964d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','56ee50c9-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5761aa24-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','57b8cbde-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','57c7541b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','57e41824-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','57f2817e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','58010369-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','582d7c54-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','586863e4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','58bf2127-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','58dbe38a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','58f8e16b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','59075fdb-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','594146f4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','595e3be5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','597b650b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5989ddee-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','59984a70-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','59a6a5a3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','59b53ae4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','59d21256-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','59e0b334-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','59ef5616-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','59fdd97d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5a29a360-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5a385bab-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5a6489c0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5aa0a6cd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5adaa343-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5af854bc-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5b4095a8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5b5d5298-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5b7a4148-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5b88bc3b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5b97184b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5ba5a989-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5bc2b77a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5bd12466-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5bee4a75-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5c19f0c4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5c45b806-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5c542675-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5c9cbc63-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5d2e5a5f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5d4b608c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5d59f16a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5d688a94-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5ddccb4e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5df9846c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5e16ba11-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5e6ea27b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5e7d32ef-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5e99e19c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5ea89d33-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5eb74719-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5ec5c8f6-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5ed4415b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5ee2f707-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5ef1cbaa-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5f004673-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5f0eb0f3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5f1d0c50-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5f2b7254-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5f3a1e82-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5f48e95f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5f577c43-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5f65d1bd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5f748888-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5f83631e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5f91d093-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5fa0373d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5faf1f62-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5fbd866a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5fcbf941-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5fda86e3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','5fe8f2e8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','6006a4d8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','6024d73f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','6033fcd3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','6043a44d-c49b-11f1-a0d7-52540021303b','2026-10-13 10:43:12',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','6052c190-c49b-11f1-a0d7-52540021303b','2026-10-13 10:43:13',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','60619298-c49b-11f1-a0d7-52540021303b','2026-10-13 10:43:13',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','6080e969-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','608f9bdd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','609f1a6a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','60ae6b68-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','60bd0fd1-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','60dd1e99-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','60edc2fe-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','61583b0c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','6185bf97-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','6195539a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','61c4b500-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','61f2d9f0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','62029204-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','622215c8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','628f9135-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','62e29c26-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','63541820-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','6375132e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','6383edce-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','63969997-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','63a58b5f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','63b451b2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','63c354d6-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','63d1f675-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','63e1b363-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','63f17b64-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','641e6ece-c49b-11f1-a0d7-52540021303b','2026-10-13 10:43:40',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','644190ca-c49b-11f1-a0d7-52540021303b','2026-10-13 10:43:42',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','6451d9df-c49b-11f1-a0d7-52540021303b','2026-10-13 10:43:43',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','6460d23f-c49b-11f1-a0d7-52540021303b','2026-10-13 10:43:43',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','64705df5-c49b-11f1-a0d7-52540021303b','2026-10-13 10:43:43',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','64811c13-c49b-11f1-a0d7-52540021303b','2026-10-13 10:43:44',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','64905415-c49b-11f1-a0d7-52540021303b','2026-10-13 10:43:45',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','64a0a23a-c49b-11f1-a0d7-52540021303b','2026-10-13 10:43:45',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','64d14267-c49b-11f1-a0d7-52540021303b','2026-10-13 10:43:47',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','64e2387e-c49b-11f1-a0d7-52540021303b','2026-10-13 10:43:48',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','64f1d0a0-c49b-11f1-a0d7-52540021303b','2026-10-13 10:43:52',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','650179d9-c49b-11f1-a0d7-52540021303b','2026-10-13 10:43:52',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','6510e36a-c49b-11f1-a0d7-52540021303b','2026-10-13 10:43:53',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','65dae9af-84d2-11f1-b721-52540021303b','2026-10-13 10:42:04',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','65de653c-84d2-11f1-b721-52540021303b','2026-10-13 10:42:32',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','65de7eac-84d2-11f1-b721-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','65de80d9-84d2-11f1-b721-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','65de8274-84d2-11f1-b721-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','65de8327-84d2-11f1-b721-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','65de859e-84d2-11f1-b721-52540021303b','2026-10-13 10:42:13',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','65de956a-84d2-11f1-b721-52540021303b','2026-10-13 10:43:24',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','65de9645-84d2-11f1-b721-52540021303b','2026-10-13 10:43:26',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','65de9910-84d2-11f1-b721-52540021303b','2026-10-13 10:43:23',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','65deaf4b-84d2-11f1-b721-52540021303b','2026-10-13 10:42:45',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','65deb0d1-84d2-11f1-b721-52540021303b','2026-10-13 10:42:31',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','b3675e12-ae64-11f1-b327-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','b3722c58-ae64-11f1-b327-52540021303b','2026-10-10 16:53:14',NULL),
('89fd2332-97b2-11f1-9d65-52540021303b','b37b7a9e-ae64-11f1-b327-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','4d35154f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','4d530b5b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','4d7031eb-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','4d7efa0e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','4d8d6867-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','4daa3dc0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','4db89857-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','4de3b2b1-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','4eddcde5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','4eeccf6c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','4f18902f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','4fadb488-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','4fbc5eaf-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','4fe94691-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','50165352-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5033a409-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','509580c5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','50b2e1fc-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','50c1762b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','50d02aaa-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','50dfc90d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','50ee7d9c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','50fd9170-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','510bf933-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','51821c11-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5190aea7-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','51adc839-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','51bc7d35-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','51cbdf08-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','51dada48-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','522369fb-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','52512ba5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','526f4ace-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','527ea369-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','52ace725-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','52ca8d7f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','52f6eb78-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5305c669-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','53316ae2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','533fcc5f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','535c91c2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','536b249c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','53797c42-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','53aa9247-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','53bb6743-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','53cc1d17-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','53e9beba-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','53f8815a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','553732d5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','55e8931b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','56319fe4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','56797f6d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','56964305-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','56b40667-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','56c28d25-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','56df964d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','56ee50c9-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5761aa24-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','57b8cbde-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','57c7541b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','57e41824-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','57f2817e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','58010369-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','582d7c54-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','586863e4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','58bf2127-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','58dbe38a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','58f8e16b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','59075fdb-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','594146f4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','595e3be5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','597b650b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5989ddee-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','59984a70-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','59a6a5a3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','59b53ae4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','59d21256-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','59e0b334-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','59ef5616-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','59fdd97d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5a29a360-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5a385bab-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5a6489c0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5aa0a6cd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5adaa343-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5af854bc-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5b4095a8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5b5d5298-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5b7a4148-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5b88bc3b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5b97184b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5ba5a989-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5bc2b77a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5bd12466-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5bee4a75-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5c19f0c4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5c45b806-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5c542675-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5c9cbc63-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5d2e5a5f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5d4b608c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5d59f16a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5d688a94-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5ddccb4e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5df9846c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5e16ba11-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5e6ea27b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5e7d32ef-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5e99e19c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5ea89d33-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5eb74719-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5ec5c8f6-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5ed4415b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5ee2f707-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5ef1cbaa-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5f004673-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5f1d0c50-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5f2b7254-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5f3a1e82-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5f48e95f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5f577c43-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5f65d1bd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5f748888-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5f83631e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5f91d093-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5fa0373d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5faf1f62-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5fbd866a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5fcbf941-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5fda86e3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','5fe8f2e8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','6006a4d8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','6024d73f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','6033fcd3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','6080e969-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','608f9bdd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','609f1a6a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','60ae6b68-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','60bd0fd1-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','60dd1e99-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','60edc2fe-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','61583b0c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','6185bf97-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','6195539a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','61c4b500-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','61f2d9f0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','62029204-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','622215c8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','628f9135-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','62e29c26-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','63541820-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','6375132e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','6383edce-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','63a58b5f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','63b451b2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','63c354d6-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','63d1f675-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','63e1b363-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','63f17b64-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','65de7eac-84d2-11f1-b721-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','65de80d9-84d2-11f1-b721-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','65de8327-84d2-11f1-b721-52540021303b','2026-10-10 16:53:14',NULL),
('89fd7ac2-97b2-11f1-9d65-52540021303b','b3675e12-ae64-11f1-b327-52540021303b','2026-10-10 16:53:14',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4cf46ab4-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4d0546b3-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4d155bef-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4d264b12-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4d35154f-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4d438359-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4d530b5b-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4d61e954-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4d7031eb-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4d7efa0e-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4d8d6867-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4d9bd089-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4daa3dc0-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4db89857-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4dc7052d-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4dd55a46-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4de3b2b1-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4df257ca-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4e00c40a-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4e0f4082-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4e1e10ac-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4e2ca429-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4e3b0d5f-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4e4963d5-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4e57e65b-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4e665014-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4e751183-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4e8476a9-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4e9315a8-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4ea2489e-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4eb0b24c-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4ebf4baa-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4ecefc38-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4eddcde5-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4eeccf6c-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4efb7700-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4f09e196-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4f18902f-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4f277b07-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4fadb488-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4fbc5eaf-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4fe94691-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','4ff8113e-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5006da71-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','50165352-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5024ee69-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5033a409-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','504215d3-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5050c3d3-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5086523e-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','509580c5-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','50a4007b-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','50b2e1fc-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','50c1762b-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','50d02aaa-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','50dfc90d-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','50ee7d9c-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','50fd9170-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','510bf933-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','511aa4bf-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5129c322-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','51386622-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5146e96b-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','51559ffa-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5164b941-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','51734d55-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','51821c11-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5190aea7-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','519f49c6-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','51adc839-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','51bc7d35-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','51cbdf08-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','51dada48-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','51e93b83-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','51f7a177-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','520648cc-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5214b3c7-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','522369fb-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','523300b5-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5242a558-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','52512ba5-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5260be8f-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','526f4ace-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','527ea369-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','528eb6ab-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','529e49fa-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','52ace725-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','52bc10c0-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','52ca8d7f-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','52d8da53-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','52e83f8b-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','52f6eb78-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5305c669-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','53148b7c-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','532308e1-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','53316ae2-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','533fcc5f-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','534e4f34-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','535c91c2-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','536b249c-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','53797c42-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5387fdbe-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5397c547-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','53aa9247-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','53bb6743-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','53cc1d17-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','53db3153-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','53e9beba-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','53f8815a-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','54259b2f-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5476712e-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','548567df-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','54942346-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','54a2b8ad-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','54b16376-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','54c28e0a-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','54d10a15-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','54df63e0-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','54edca99-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','54fc2afd-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','550b324c-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5519eeab-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','552890af-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','553732d5-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','55464e21-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5554defc-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5563ecca-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5572a06f-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','558146f9-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','558fb34b-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','559e1d4f-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','55e8931b-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','56147708-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5622de0e-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','56319fe4-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','564059d4-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','564eb2ec-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','565cf5fd-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','566b3b4f-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','56797f6d-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5687d86d-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','56964305-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','56a55a2f-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','56b40667-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','56c28d25-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','56d11615-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','56df964d-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','56ee50c9-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','56fcb6aa-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','570b4dcf-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5719f0f4-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','57285b16-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5736b56a-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','57451ff9-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5753660f-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5761aa24-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5770604a-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','577ee35a-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','578d51b4-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','579bb41f-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','57aa22fd-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','57b8cbde-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','57c7541b-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','57d5bf9f-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','57e41824-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','57f2817e-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','58010369-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','58104408-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','581eff93-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','582d7c54-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','583c0cc1-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','584b6596-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5859e46c-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','586863e4-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5876d227-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','588538af-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','58938cd5-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','58a1e92f-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','58b08e74-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','58bf2127-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','58cd8d8d-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','58dbe38a-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','58ea774b-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','58f8e16b-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','59075fdb-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5915bbf9-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','592424b2-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5933042e-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','594146f4-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','594fbc68-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','595e3be5-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','596ce265-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','597b650b-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5989ddee-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','59984a70-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','59a6a5a3-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','59b53ae4-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','59c3b65d-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','59d21256-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','59e0b334-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','59ef5616-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','59fdd97d-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5a0c5b79-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5a1ab464-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5a29a360-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5a385bab-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5a471219-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5a55beab-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5a6489c0-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5a731f49-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5a81f550-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5a919ab9-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5aa0a6cd-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5aaf43b4-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5abdc5d4-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5acc5728-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5adaa343-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5ae9d41e-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5af854bc-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5b06d225-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5b1517c8-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5b23819f-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5b31fecd-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5b4095a8-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5b4effc1-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5b5d5298-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5b6bea58-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5b7a4148-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5b88bc3b-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5b97184b-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5ba5a989-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5bb426fb-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5bc2b77a-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5bd12466-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5bdfa8ea-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5bee4a75-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5bfcca39-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5c0b47c4-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5c19f0c4-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5c2871ff-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5c3726ea-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5c45b806-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5c542675-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5c627ea1-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5c710828-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5c7f98e0-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5c8e17a6-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5c9cbc63-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5cab4fa8-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5cb9f2a8-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5cc89f0d-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5cd71f7c-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5ce58567-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5cf42b2e-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5d02b2de-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5d113ea1-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5d1fbc43-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5d2e5a5f-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5d3ccd94-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5d4b608c-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5d59f16a-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5d688a94-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5d772fe0-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5d8598bd-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5d9414f1-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5da28049-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5db1146d-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5dbff710-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5dce4c4b-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5ddccb4e-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5deb217f-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5df9846c-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5e082afa-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5e16ba11-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5e252683-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5e33a709-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5e42fd1a-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5e516817-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5e604a46-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5e6ea27b-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5e7d32ef-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5e8b76ad-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5e99e19c-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5ea89d33-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5eb74719-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5ec5c8f6-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5ed4415b-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5ee2f707-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5ef1cbaa-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5f004673-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5f0eb0f3-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5f1d0c50-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5f2b7254-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5f3a1e82-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5f48e95f-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5f577c43-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5f65d1bd-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5f748888-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5f83631e-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5f91d093-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5fa0373d-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5faf1f62-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5fbd866a-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5fcbf941-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5fda86e3-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5fe8f2e8-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','5ff7f38d-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','6006a4d8-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','6015674a-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','6024d73f-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','6033fcd3-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','6043a44d-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','6052c190-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','60619298-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','607016f6-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','6080e969-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','608f9bdd-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','609f1a6a-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','60ae6b68-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','60bd0fd1-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','60cdd65a-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','60dd1e99-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','60edc2fe-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','60fd957b-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','610c19bb-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','611a9259-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','61296f24-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','61386d5d-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','6146f62a-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','61583b0c-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','6166b707-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','6175e6e3-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','6185bf97-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','6195539a-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','61a5340d-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','61b632a7-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','61c4b500-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','61d460d3-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','61e3ab6f-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','61f2d9f0-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','62029204-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','6211d4b2-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','622215c8-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','6230f197-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','623f9a58-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','624f4296-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','625f3b1f-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','626df8e3-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','627f3791-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','628f9135-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','62a2bb30-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','62b3b9be-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','62c3b50c-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','62d41259-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','62e29c26-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','62f2d94c-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','63050d85-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','63143898-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','63251050-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','6333f1a1-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','63437742-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','63541820-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','636594c1-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','6375132e-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','6383edce-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','63969997-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','63a58b5f-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','63b451b2-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','63c354d6-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','63d1f675-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','63e1b363-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','63f17b64-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','6400ce34-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','640fc58a-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','641e6ece-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','643101f1-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','644190ca-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','6451d9df-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','6460d23f-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','64705df5-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','64811c13-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','64905415-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','64a0a23a-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','64b16003-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','64c1b2ea-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','64d14267-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','64e2387e-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','64f1d0a0-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','650179d9-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','6510e36a-c49b-11f1-a0d7-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65dae9af-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de61f5-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de653c-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de66f6-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de67af-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de6865-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de6921-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de69ce-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de6ac2-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de6b6e-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de6c31-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de6d00-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de6dc7-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de6e76-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de6f34-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de6fef-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de70aa-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de7179-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de7231-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de72e7-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de739d-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de745a-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de7520-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de75cd-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de767f-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de773a-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de77e1-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de78a1-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de7953-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de7a20-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de7ade-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de7ba1-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de7c5b-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de7d11-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de7df8-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de7eac-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de8012-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de80d9-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de81ae-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de8274-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de8327-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de83db-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de84c3-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de859e-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de867b-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de875b-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de8824-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de88dc-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de89b1-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de8a87-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de8b74-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de8c4d-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de8eb6-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de8f82-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de9059-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de9121-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de91fa-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de92d1-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de939e-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de9485-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de956a-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de9645-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de976b-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de9845-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de9910-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de99c9-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de9a95-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de9b5b-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de9c36-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de9cfd-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de9dbb-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de9e7f-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65de9f5e-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65dea046-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65dea117-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65dea1e8-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65dea2a4-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65dea373-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65dea44f-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65dea53c-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65dea6a7-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65dea7ae-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65dea874-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65dea953-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65deaa1f-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65deaada-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65deab97-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65deac52-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65dead0c-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65deadb9-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65deae96-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65deaf4b-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65deb006-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65deb0d1-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65deb18f-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65deb241-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','65deb2f0-84d2-11f1-b721-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','b3675e12-ae64-11f1-b327-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','b3722c58-ae64-11f1-b327-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','b37b7a9e-ae64-11f1-b327-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','b386592c-ae64-11f1-b327-52540021303b','2026-10-10 17:03:17',NULL),
('90de7f01-7123-11f1-8bb6-52540021303b','b392f9c2-ae64-11f1-b327-52540021303b','2026-10-10 17:03:17',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4cf46ab4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4d0546b3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4d155bef-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4d264b12-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4d35154f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4d438359-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4d530b5b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4d61e954-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4d7031eb-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4d7efa0e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4d8d6867-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4d9bd089-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4daa3dc0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4db89857-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4dc7052d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4dd55a46-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4de3b2b1-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4df257ca-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4e00c40a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4e0f4082-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4e1e10ac-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4e2ca429-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4e3b0d5f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4e4963d5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4e57e65b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4e665014-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4e751183-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4e8476a9-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4e9315a8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4ea2489e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4eb0b24c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4ebf4baa-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4ecefc38-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4eddcde5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4eeccf6c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4efb7700-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4f09e196-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4f18902f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4f277b07-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4fadb488-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4fbc5eaf-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4fe94691-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','4ff8113e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5006da71-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','50165352-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5024ee69-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5033a409-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','504215d3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5050c3d3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5086523e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','509580c5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','50a4007b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','50b2e1fc-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','50c1762b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','50d02aaa-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','50dfc90d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','50ee7d9c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','50fd9170-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','510bf933-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','511aa4bf-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5129c322-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','51386622-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5146e96b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','51559ffa-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5164b941-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','51734d55-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','51821c11-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5190aea7-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','519f49c6-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','51adc839-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','51bc7d35-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','51cbdf08-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','51dada48-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','51e93b83-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','51f7a177-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','520648cc-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5214b3c7-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','522369fb-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','523300b5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5242a558-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','52512ba5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5260be8f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','526f4ace-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','527ea369-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','528eb6ab-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','529e49fa-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','52ace725-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','52bc10c0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','52ca8d7f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','52d8da53-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','52e83f8b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','52f6eb78-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5305c669-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','53148b7c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','532308e1-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','53316ae2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','533fcc5f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','534e4f34-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','535c91c2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','536b249c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','53797c42-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5387fdbe-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5397c547-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','53aa9247-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','53bb6743-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','53cc1d17-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','53db3153-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','53e9beba-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','53f8815a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','54259b2f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5476712e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','548567df-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','54942346-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','54a2b8ad-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','54b16376-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','54c28e0a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','54d10a15-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','54df63e0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','54edca99-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','54fc2afd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','550b324c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5519eeab-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','552890af-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','553732d5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','55464e21-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5554defc-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5563ecca-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5572a06f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','558146f9-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','558fb34b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','559e1d4f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','55e8931b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','56147708-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5622de0e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','56319fe4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','564059d4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','564eb2ec-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','565cf5fd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','566b3b4f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','56797f6d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5687d86d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','56964305-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','56a55a2f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','56b40667-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','56c28d25-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','56d11615-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','56df964d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','56ee50c9-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','56fcb6aa-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','570b4dcf-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5719f0f4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','57285b16-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5736b56a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','57451ff9-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5753660f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5761aa24-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5770604a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','577ee35a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','578d51b4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','579bb41f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','57aa22fd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','57b8cbde-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','57c7541b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','57d5bf9f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','57e41824-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','57f2817e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','58010369-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','58104408-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','581eff93-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','582d7c54-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','583c0cc1-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','584b6596-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5859e46c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','586863e4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5876d227-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','588538af-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','58938cd5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','58a1e92f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','58b08e74-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','58bf2127-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','58cd8d8d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','58dbe38a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','58ea774b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','58f8e16b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','59075fdb-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5915bbf9-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','592424b2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5933042e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','594146f4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','594fbc68-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','595e3be5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','596ce265-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','597b650b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5989ddee-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','59984a70-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','59a6a5a3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','59b53ae4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','59c3b65d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','59d21256-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','59e0b334-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','59ef5616-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','59fdd97d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5a0c5b79-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5a1ab464-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5a29a360-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5a385bab-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5a471219-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5a55beab-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5a6489c0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5a731f49-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5a81f550-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5a919ab9-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5aa0a6cd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5aaf43b4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5abdc5d4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5acc5728-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5adaa343-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5ae9d41e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5af854bc-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5b06d225-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5b1517c8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5b23819f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5b31fecd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5b4095a8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5b4effc1-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5b5d5298-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5b6bea58-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5b7a4148-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5b88bc3b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5b97184b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5ba5a989-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5bb426fb-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5bc2b77a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5bd12466-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5bdfa8ea-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5bee4a75-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5bfcca39-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5c0b47c4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5c19f0c4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5c2871ff-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5c3726ea-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5c45b806-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5c542675-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5c627ea1-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5c710828-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5c7f98e0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5c8e17a6-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5c9cbc63-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5cab4fa8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5cb9f2a8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5cc89f0d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5cd71f7c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5ce58567-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5cf42b2e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5d02b2de-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5d113ea1-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5d1fbc43-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5d2e5a5f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5d3ccd94-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5d4b608c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5d59f16a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5d688a94-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5d772fe0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5d8598bd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5d9414f1-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5da28049-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5db1146d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5dbff710-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5dce4c4b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5ddccb4e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5deb217f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5df9846c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5e082afa-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5e16ba11-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5e252683-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5e33a709-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5e42fd1a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5e516817-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5e604a46-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5e6ea27b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5e7d32ef-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5e8b76ad-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5e99e19c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5ea89d33-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5eb74719-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5ec5c8f6-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5ed4415b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5ee2f707-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5ef1cbaa-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5f004673-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5f0eb0f3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5f1d0c50-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5f2b7254-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5f3a1e82-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5f48e95f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5f577c43-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5f65d1bd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5f748888-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5f83631e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5f91d093-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5fa0373d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5faf1f62-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5fbd866a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5fcbf941-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5fda86e3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5fe8f2e8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','5ff7f38d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','6006a4d8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','6015674a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','6024d73f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','6033fcd3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','6043a44d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','6052c190-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','60619298-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','607016f6-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','6080e969-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','608f9bdd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','609f1a6a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','60ae6b68-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','60bd0fd1-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','60cdd65a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','60dd1e99-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','60edc2fe-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','60fd957b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','610c19bb-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','611a9259-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','61296f24-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','61386d5d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','6146f62a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','61583b0c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','6166b707-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','6175e6e3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','6185bf97-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','6195539a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','61a5340d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','61b632a7-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','61c4b500-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','61d460d3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','61e3ab6f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','61f2d9f0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','62029204-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','6211d4b2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','622215c8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','6230f197-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','623f9a58-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','624f4296-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','625f3b1f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','626df8e3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','627f3791-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','628f9135-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','62a2bb30-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','62b3b9be-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','62c3b50c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','62d41259-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','62e29c26-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','62f2d94c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','63050d85-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','63143898-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','63251050-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','6333f1a1-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','63437742-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','63541820-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','636594c1-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','6375132e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','6383edce-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','63969997-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','63a58b5f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','63b451b2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','63c354d6-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','63d1f675-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','63e1b363-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','63f17b64-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','6400ce34-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','640fc58a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','641e6ece-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','643101f1-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','644190ca-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','6451d9df-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','6460d23f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','64705df5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','64811c13-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','64905415-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','64a0a23a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','64b16003-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','64c1b2ea-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','64d14267-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','64e2387e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','64f1d0a0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','650179d9-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','6510e36a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65dae9af-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de61f5-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de653c-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de66f6-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de67af-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de6865-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de6921-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de69ce-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de6ac2-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de6b6e-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de6c31-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de6d00-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de6dc7-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de6e76-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de6f34-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de6fef-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de70aa-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de7179-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de7231-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de72e7-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de739d-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de745a-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de7520-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de75cd-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de767f-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de773a-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de77e1-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de78a1-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de7953-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de7a20-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de7ade-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de7ba1-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de7c5b-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de7d11-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de7df8-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de7eac-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de8012-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de80d9-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de81ae-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de8274-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de8327-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de83db-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de84c3-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de859e-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de867b-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de875b-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de8824-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de88dc-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de89b1-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de8a87-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de8b74-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de8c4d-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de8eb6-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de8f82-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de9059-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de9121-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de91fa-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de92d1-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de939e-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de9485-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de956a-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de9645-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de976b-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de9845-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de9910-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de99c9-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de9a95-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de9b5b-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de9c36-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de9cfd-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de9dbb-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de9e7f-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65de9f5e-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65dea046-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65dea117-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65dea1e8-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65dea2a4-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65dea373-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65dea44f-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65dea53c-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65dea6a7-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65dea7ae-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65dea874-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65dea953-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65deaa1f-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65deaada-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65deab97-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65deac52-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65dead0c-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65deadb9-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65deae96-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65deaf4b-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65deb006-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','65deb0d1-84d2-11f1-b721-52540021303b','2026-07-21 12:37:23',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','751997ec-d1bf-11f1-924f-52540021303b','2026-10-27 10:06:32',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','a19c96ec-d1c0-11f1-924f-52540021303b','2026-10-27 10:11:10',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','b3675e12-ae64-11f1-b327-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','b3722c58-ae64-11f1-b327-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','b37b7a9e-ae64-11f1-b327-52540021303b','2026-10-10 16:41:52',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','b392f9c2-ae64-11f1-b327-52540021303b','2026-10-27 10:06:32',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','c0f57007-c604-11f1-924f-52540021303b','2026-10-12 11:49:45',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','c103a0ec-c604-11f1-924f-52540021303b','2026-10-12 11:49:45',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','c1120aa3-c604-11f1-924f-52540021303b','2026-10-12 11:49:45',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','c1203b6a-c604-11f1-924f-52540021303b','2026-10-12 11:49:45',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','d3dfe714-d398-11f1-8d3e-020000000000','2026-10-29 13:01:16',NULL),
('90e34b7b-7123-11f1-8bb6-52540021303b','e86d8a17-d1c0-11f1-924f-52540021303b','2026-10-27 10:13:08',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4cf46ab4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4d0546b3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4d155bef-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4d264b12-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4d35154f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4d438359-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4d530b5b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4d61e954-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4d7031eb-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4d7efa0e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4d8d6867-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4d9bd089-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4daa3dc0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4db89857-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4dc7052d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4dd55a46-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4de3b2b1-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4df257ca-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4e00c40a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4e0f4082-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4e1e10ac-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4e2ca429-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4e3b0d5f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4e4963d5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4e57e65b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4e665014-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4e751183-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4e8476a9-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4e9315a8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4ea2489e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4eb0b24c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4ebf4baa-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4ecefc38-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4eddcde5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4eeccf6c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4efb7700-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4f09e196-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4f18902f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4f277b07-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4fadb488-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4fbc5eaf-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4fe94691-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','4ff8113e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5006da71-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','50165352-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5024ee69-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5033a409-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','504215d3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5050c3d3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5086523e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','509580c5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','50a4007b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','50b2e1fc-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','50c1762b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','50d02aaa-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','50dfc90d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','50ee7d9c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','50fd9170-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','510bf933-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','511aa4bf-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5129c322-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','51386622-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5146e96b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','51559ffa-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5164b941-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','51734d55-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','51821c11-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5190aea7-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','519f49c6-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','51adc839-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','51bc7d35-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','51cbdf08-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','51dada48-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','51e93b83-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','51f7a177-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','520648cc-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5214b3c7-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','522369fb-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','523300b5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5242a558-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','52512ba5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5260be8f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','526f4ace-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','527ea369-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','528eb6ab-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','529e49fa-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','52ace725-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','52bc10c0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','52ca8d7f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','52d8da53-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','52e83f8b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','52f6eb78-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5305c669-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','53148b7c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','532308e1-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','53316ae2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','533fcc5f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','534e4f34-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','535c91c2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','536b249c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','53797c42-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5387fdbe-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5397c547-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','53aa9247-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','53bb6743-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','53cc1d17-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','53db3153-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','53e9beba-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','53f8815a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','54259b2f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5476712e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','548567df-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','54942346-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','54a2b8ad-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','54b16376-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','54c28e0a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','54d10a15-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','54df63e0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','54edca99-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','54fc2afd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','550b324c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5519eeab-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','552890af-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','553732d5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','55464e21-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5554defc-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5563ecca-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5572a06f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','558146f9-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','558fb34b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','559e1d4f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','55e8931b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','56147708-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5622de0e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','56319fe4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','564059d4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','564eb2ec-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','565cf5fd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','566b3b4f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','56797f6d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5687d86d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','56964305-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','56a55a2f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','56b40667-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','56c28d25-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','56d11615-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','56df964d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','56ee50c9-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','56fcb6aa-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','570b4dcf-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5719f0f4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','57285b16-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5736b56a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','57451ff9-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5753660f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5761aa24-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5770604a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','577ee35a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','578d51b4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','579bb41f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','57aa22fd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','57b8cbde-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','57c7541b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','57d5bf9f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','57e41824-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','57f2817e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','58010369-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','58104408-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','581eff93-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','582d7c54-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','583c0cc1-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','584b6596-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5859e46c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','586863e4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5876d227-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','588538af-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','58938cd5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','58a1e92f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','58b08e74-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','58bf2127-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','58cd8d8d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','58dbe38a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','58ea774b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','58f8e16b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','59075fdb-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5915bbf9-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','592424b2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5933042e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','594146f4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','594fbc68-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','595e3be5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','596ce265-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','597b650b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5989ddee-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','59984a70-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','59a6a5a3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','59b53ae4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','59c3b65d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','59d21256-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','59e0b334-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','59ef5616-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','59fdd97d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5a0c5b79-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5a1ab464-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5a29a360-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5a385bab-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5a471219-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5a55beab-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5a6489c0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5a731f49-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5a81f550-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5a919ab9-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5aa0a6cd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5aaf43b4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5abdc5d4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5acc5728-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5adaa343-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5ae9d41e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5af854bc-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5b06d225-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5b1517c8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5b23819f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5b31fecd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5b4095a8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5b4effc1-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5b5d5298-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5b6bea58-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5b7a4148-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5b88bc3b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5b97184b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5ba5a989-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5bb426fb-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5bc2b77a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5bd12466-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5bdfa8ea-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5bee4a75-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5bfcca39-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5c0b47c4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5c19f0c4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5c2871ff-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5c3726ea-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5c45b806-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5c542675-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5c627ea1-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5c710828-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5c7f98e0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5c8e17a6-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5c9cbc63-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5cab4fa8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5cb9f2a8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5cc89f0d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5cd71f7c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5ce58567-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5cf42b2e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5d02b2de-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5d113ea1-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5d1fbc43-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5d2e5a5f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5d3ccd94-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5d4b608c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5d59f16a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5d688a94-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5d772fe0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5d8598bd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5d9414f1-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5da28049-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5db1146d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5dbff710-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5dce4c4b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5ddccb4e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5deb217f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5df9846c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5e082afa-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5e16ba11-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5e252683-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5e33a709-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5e42fd1a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5e516817-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5e604a46-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5e6ea27b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5e7d32ef-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5e8b76ad-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5e99e19c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5ea89d33-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5eb74719-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5ec5c8f6-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5ed4415b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5ee2f707-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5ef1cbaa-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5f004673-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5f0eb0f3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5f1d0c50-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5f2b7254-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5f3a1e82-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5f48e95f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5f577c43-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5f65d1bd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5f748888-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5f83631e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5f91d093-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5fa0373d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5faf1f62-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5fbd866a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5fcbf941-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5fda86e3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5fe8f2e8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','5ff7f38d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','6006a4d8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','6015674a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','6024d73f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','6033fcd3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','6043a44d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','6052c190-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','60619298-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','607016f6-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','6080e969-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','608f9bdd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','609f1a6a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','60ae6b68-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','60bd0fd1-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','60cdd65a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','60dd1e99-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','60edc2fe-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','60fd957b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','610c19bb-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','611a9259-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','61296f24-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','61386d5d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','6146f62a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','61583b0c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','6166b707-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','6175e6e3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','6185bf97-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','6195539a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','61a5340d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','61b632a7-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','61c4b500-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','61d460d3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','61e3ab6f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','61f2d9f0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','62029204-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','6211d4b2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','622215c8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','6230f197-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','623f9a58-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','624f4296-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','625f3b1f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','626df8e3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','627f3791-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','628f9135-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','62a2bb30-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','62b3b9be-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','62c3b50c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','62d41259-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','62e29c26-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','62f2d94c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','63050d85-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','63143898-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','63251050-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','6333f1a1-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','63437742-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','63541820-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','636594c1-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','6375132e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','6383edce-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','63969997-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','63a58b5f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','63b451b2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','63c354d6-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','63d1f675-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','63e1b363-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','63f17b64-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','6400ce34-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','640fc58a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','641e6ece-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','643101f1-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','644190ca-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','6451d9df-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','6460d23f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','64705df5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','64811c13-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','64905415-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','64a0a23a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','64b16003-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','64c1b2ea-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','64d14267-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','64e2387e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','64f1d0a0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','650179d9-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','6510e36a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:41:52',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65dae9af-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de61f5-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de653c-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de66f6-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de67af-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de6865-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de6921-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de69ce-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de6ac2-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de6b6e-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de6c31-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de6d00-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de6dc7-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de6e76-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de6f34-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de6fef-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de70aa-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de7179-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de7231-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de72e7-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de739d-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de745a-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de7520-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de75cd-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de767f-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de773a-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de77e1-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de78a1-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de7953-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de7a20-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de7ade-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de7ba1-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de7c5b-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de7d11-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de7df8-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de7eac-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de8012-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de80d9-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de81ae-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de8274-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de8327-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de83db-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de84c3-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de859e-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de867b-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de875b-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de8824-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de88dc-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de89b1-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de8a87-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de8b74-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de8c4d-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de8eb6-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de8f82-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de9059-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de9121-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de91fa-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de92d1-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de939e-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de9485-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de956a-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de9645-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de976b-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de9845-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de9910-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de99c9-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de9a95-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de9b5b-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de9c36-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de9cfd-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de9dbb-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de9e7f-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65de9f5e-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65dea046-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65dea117-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65dea1e8-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65dea2a4-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65dea373-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65dea44f-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65dea53c-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65dea6a7-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65dea7ae-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65dea874-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65dea953-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65deaa1f-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65deaada-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65deab97-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65deac52-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65dead0c-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65deadb9-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65deae96-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65deaf4b-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65deb006-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65deb0d1-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65deb18f-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65deb241-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','65deb2f0-84d2-11f1-b721-52540021303b','2026-07-21 12:37:18',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','751997ec-d1bf-11f1-924f-52540021303b','2026-10-27 10:06:32',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','a19c96ec-d1c0-11f1-924f-52540021303b','2026-10-27 10:11:10',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','b3675e12-ae64-11f1-b327-52540021303b','2026-10-03 13:16:40',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','b3722c58-ae64-11f1-b327-52540021303b','2026-10-03 13:16:38',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','b37b7a9e-ae64-11f1-b327-52540021303b','2026-10-03 13:16:40',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','b386592c-ae64-11f1-b327-52540021303b','2026-10-03 13:16:39',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','b392f9c2-ae64-11f1-b327-52540021303b','2026-10-03 13:16:41',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','c0f57007-c604-11f1-924f-52540021303b','2026-10-12 11:49:45',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','c103a0ec-c604-11f1-924f-52540021303b','2026-10-12 11:49:45',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','c1120aa3-c604-11f1-924f-52540021303b','2026-10-12 11:49:45',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','c1203b6a-c604-11f1-924f-52540021303b','2026-10-12 11:49:45',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','d3dfe714-d398-11f1-8d3e-020000000000','2026-10-29 13:01:16',NULL),
('90e34f44-7123-11f1-8bb6-52540021303b','e86d8a17-d1c0-11f1-924f-52540021303b','2026-10-27 10:13:08',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','4d35154f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','4d530b5b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','4d7031eb-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','4d7efa0e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','4d8d6867-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','4daa3dc0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','4db89857-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','4de3b2b1-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','4eddcde5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','4eeccf6c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','4f18902f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','4fadb488-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','509580c5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','50b2e1fc-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','50c1762b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','50d02aaa-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','51821c11-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','5190aea7-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','51cbdf08-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','51dada48-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','522369fb-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','526f4ace-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','52ace725-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','52f6eb78-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','53316ae2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','533fcc5f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','535c91c2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','536b249c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','53797c42-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','53aa9247-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','53bb6743-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','53e9beba-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','553732d5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','55e8931b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','56797f6d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','56964305-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','56b40667-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','56c28d25-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','56df964d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','56ee50c9-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','57b8cbde-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','58dbe38a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','58f8e16b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','59075fdb-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','597b650b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','59a6a5a3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','59e0b334-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','5a29a360-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','5a6489c0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','5aa0a6cd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','5adaa343-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','5b5d5298-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','5b7a4148-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','5b88bc3b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','5b97184b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','5d4b608c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','5d688a94-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','5df9846c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','5e6ea27b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','5e7d32ef-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','5e99e19c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','5eb74719-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','5ec5c8f6-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','5ed4415b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','5ee2f707-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','5ef1cbaa-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','5f004673-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','5f1d0c50-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','5f2b7254-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','5f3a1e82-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','5f48e95f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','5f577c43-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','5f65d1bd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','5f748888-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','5f83631e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','5fa0373d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','5faf1f62-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','5fbd866a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','5fcbf941-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','5fda86e3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','5fe8f2e8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','6006a4d8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','6024d73f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','6033fcd3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','6080e969-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','609f1a6a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','60ae6b68-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','60dd1e99-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','61583b0c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','6185bf97-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','6195539a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','61c4b500-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','61f2d9f0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','62029204-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','628f9135-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','62e29c26-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','63541820-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','6383edce-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','63a58b5f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','63b451b2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','63f17b64-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f2571d79-a047-11f1-99c8-52540021303b','b3675e12-ae64-11f1-b327-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','4d35154f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','4d530b5b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','4d7031eb-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','4d7efa0e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','4d8d6867-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','4daa3dc0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','4db89857-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','4de3b2b1-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','4eddcde5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','4eeccf6c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','4f18902f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','4fadb488-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','4fbc5eaf-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','4fe94691-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','50165352-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5033a409-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','509580c5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','50b2e1fc-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','50c1762b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','50d02aaa-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','50dfc90d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','50ee7d9c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','50fd9170-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','510bf933-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','51821c11-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5190aea7-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','51adc839-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','51bc7d35-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','51cbdf08-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','51dada48-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','522369fb-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','52512ba5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','526f4ace-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','527ea369-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','52ace725-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','52ca8d7f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','52f6eb78-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5305c669-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','53316ae2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','533fcc5f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','535c91c2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','536b249c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','53797c42-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','53aa9247-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','53bb6743-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','53cc1d17-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','53e9beba-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','53f8815a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','553732d5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','55e8931b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','56319fe4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','56797f6d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','56964305-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','56b40667-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','56c28d25-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','56df964d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','56ee50c9-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5761aa24-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','57b8cbde-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','57c7541b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','57e41824-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','57f2817e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','58010369-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','582d7c54-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','586863e4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','58bf2127-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','58dbe38a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','58f8e16b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','59075fdb-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','594146f4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','595e3be5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','597b650b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5989ddee-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','59984a70-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','59a6a5a3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','59b53ae4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','59d21256-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','59e0b334-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','59ef5616-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','59fdd97d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5a29a360-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5a385bab-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5a6489c0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5aa0a6cd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5adaa343-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5af854bc-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5b4095a8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5b5d5298-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5b7a4148-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5b88bc3b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5b97184b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5ba5a989-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5bc2b77a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5bd12466-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5bee4a75-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5c19f0c4-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5c45b806-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5c542675-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5c9cbc63-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5d2e5a5f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5d4b608c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5d59f16a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5d688a94-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5ddccb4e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5df9846c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5e16ba11-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5e6ea27b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5e7d32ef-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5e99e19c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5ea89d33-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5eb74719-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5ec5c8f6-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5ed4415b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5ee2f707-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5ef1cbaa-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5f004673-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5f1d0c50-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5f2b7254-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5f3a1e82-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5f48e95f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5f577c43-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5f65d1bd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5f748888-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5f83631e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5f91d093-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5fa0373d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5faf1f62-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5fbd866a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5fcbf941-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5fda86e3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','5fe8f2e8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','6006a4d8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','6024d73f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','6033fcd3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','6080e969-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','608f9bdd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','609f1a6a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','60ae6b68-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','60bd0fd1-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','60dd1e99-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','60edc2fe-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','61583b0c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','6185bf97-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','6195539a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','61c4b500-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','61f2d9f0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','62029204-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','622215c8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','628f9135-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','62e29c26-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','63541820-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','6375132e-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','6383edce-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','63a58b5f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','63b451b2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','63c354d6-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','63d1f675-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','63e1b363-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','63f17b64-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','65de7eac-84d2-11f1-b721-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','65de80d9-84d2-11f1-b721-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','65de8327-84d2-11f1-b721-52540021303b','2026-10-10 16:53:14',NULL),
('f9703e5b-b411-11f1-b327-52540021303b','b3675e12-ae64-11f1-b327-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','4d35154f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','4d7031eb-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','4daa3dc0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','4de3b2b1-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','4eddcde5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','4eeccf6c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','4f18902f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','4fadb488-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','509580c5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','50b2e1fc-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','50c1762b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','50d02aaa-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','5190aea7-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','51bc7d35-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','51cbdf08-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','51dada48-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','522369fb-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','526f4ace-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','52ace725-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','52ca8d7f-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','52f6eb78-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','5305c669-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','53316ae2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','535c91c2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','53aa9247-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','53cc1d17-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','53e9beba-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','53f8815a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','553732d5-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','55e8931b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','56797f6d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','56964305-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','56b40667-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','56c28d25-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','56df964d-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','56ee50c9-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','57b8cbde-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','58f8e16b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','597b650b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','59a6a5a3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','59e0b334-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','5a29a360-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','5a6489c0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','5aa0a6cd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','5adaa343-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','5b88bc3b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','5d4b608c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','5d688a94-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','5df9846c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','5e6ea27b-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','5e99e19c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','5ee2f707-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','5f004673-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','5f2b7254-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','5f65d1bd-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','5fbd866a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','5fda86e3-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','6006a4d8-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','6080e969-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','609f1a6a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','60ae6b68-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','60dd1e99-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','61583b0c-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','6185bf97-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','6195539a-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','61c4b500-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','61f2d9f0-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','62029204-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','628f9135-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','62e29c26-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','63541820-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','6383edce-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','63b451b2-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','63f17b64-c49b-11f1-a0d7-52540021303b','2026-10-10 16:53:14',NULL),
('f9704219-b411-11f1-b327-52540021303b','b3675e12-ae64-11f1-b327-52540021303b','2026-10-10 16:53:14',NULL);
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` char(36) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `scope` enum('INTERNAL','PROJECT') NOT NULL DEFAULT 'INTERNAL',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_roles_scope_name` (`scope`,`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES
('06850ec5-6208-4db6-9b27-c6eed141b80b','USER','Default Role','2026-07-25 12:18:20','2026-07-27 15:57:59','INTERNAL'),
('070dd7b5-84d2-11f1-b721-52540021303b','SENIOR_ARCHITECT','Senior architect with project planning and design permissions','2026-07-21 12:31:42','2026-07-21 12:31:42','INTERNAL'),
('07114f34-84d2-11f1-b721-52540021303b','JUNIOR_ARCHITECT','Junior architect with limited design and project permissions','2026-07-21 12:31:42','2026-07-21 12:31:42','INTERNAL'),
('071151f6-84d2-11f1-b721-52540021303b','SENIOR_INTERIOR_DESIGNER','Senior interior designer with interior planning and client coordination permissions','2026-07-21 12:31:42','2026-07-21 12:31:42','INTERNAL'),
('07115348-84d2-11f1-b721-52540021303b','JUNIOR_INTERIOR_DESIGNER','Junior interior designer with limited interior design permissions','2026-07-21 12:31:42','2026-07-21 12:31:42','INTERNAL'),
('071153fc-84d2-11f1-b721-52540021303b','SITE_SUPERVISOR','Site supervisor responsible for site execution and progress monitoring','2026-07-21 12:31:42','2026-07-21 12:31:42','INTERNAL'),
('071154b6-84d2-11f1-b721-52540021303b','CLIENT','Client with access to assigned projects and project updates','2026-07-21 12:31:42','2026-07-21 12:31:42','INTERNAL'),
('89fd2332-97b2-11f1-9d65-52540021303b','PRINCIPAL_ARCHITECT','Principal architect responsible for overall architectural direction, design decisions, project oversight, and architectural approvals','2026-08-14 13:04:10','2026-08-14 13:04:10','INTERNAL'),
('89fd7ac2-97b2-11f1-9d65-52540021303b','PROJECT_LEAD','Project lead responsible for project coordination, execution oversight, team management, and project delivery','2026-08-14 13:04:10','2026-08-14 13:04:10','INTERNAL'),
('90de7f01-7123-11f1-8bb6-52540021303b','DEVELOPER','Developer role with limited system access','2026-06-26 11:24:59','2026-06-26 11:24:59','INTERNAL'),
('90e34b7b-7123-11f1-8bb6-52540021303b','ADMIN','Admin role with management access','2026-06-26 11:24:59','2026-06-26 11:24:59','INTERNAL'),
('90e34f44-7123-11f1-8bb6-52540021303b','SUPERADMIN','Super administrator with full access','2026-06-26 11:24:59','2026-06-26 11:24:59','INTERNAL'),
('f2571d79-a047-11f1-99c8-52540021303b','SITE_ENGINEER','Responsible for site inspections, site recce, measurements, execution monitoring, and reporting.','2026-08-25 11:13:49','2026-08-25 11:13:49','INTERNAL'),
('f9703e5b-b411-11f1-b327-52540021303b','Project Lead',NULL,'2026-09-19 15:37:51','2026-09-19 15:37:51','PROJECT'),
('f9704219-b411-11f1-b327-52540021303b','ARCHITECT',NULL,'2026-09-19 15:37:51','2026-10-01 09:49:39','PROJECT');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `sample_boards`
--

DROP TABLE IF EXISTS `sample_boards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sample_boards` (
  `id` char(36) NOT NULL,
  `materialRequirementId` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `imageUrls` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`imageUrls`)),
  `vendorName` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `approvalStatus` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `approvedBy` varchar(255) DEFAULT NULL,
  `approvedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_sample_boards_material_requirement` (`materialRequirementId`) USING BTREE,
  KEY `idx_sample_boards_approval_status` (`approvalStatus`) USING BTREE,
  CONSTRAINT `fk_sample_boards_material_requirement` FOREIGN KEY (`materialRequirementId`) REFERENCES `material_requirements` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sample_boards`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `sample_boards` WRITE;
/*!40000 ALTER TABLE `sample_boards` DISABLE KEYS */;
/*!40000 ALTER TABLE `sample_boards` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `scheduled_jobs`
--

DROP TABLE IF EXISTS `scheduled_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `scheduled_jobs` (
  `name` varchar(100) NOT NULL,
  `next_run_at` datetime(3) NOT NULL,
  `occurrence_id` char(36) NOT NULL,
  `last_success_at` datetime(3) DEFAULT NULL,
  `last_failed_at` datetime(3) DEFAULT NULL,
  `failures` int(10) unsigned NOT NULL DEFAULT 0,
  `last_error` text DEFAULT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `scheduled_jobs`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `scheduled_jobs` WRITE;
/*!40000 ALTER TABLE `scheduled_jobs` DISABLE KEYS */;
INSERT INTO `scheduled_jobs` VALUES
('automation-evaluation','2026-10-15 12:12:45.749','8a10cd28-c88d-11f1-924f-52540021303b','2026-10-15 11:42:45.749',NULL,0,NULL),
('zoho-reminder-poll','2026-10-15 11:50:32.688','7c9ed4f9-c88e-11f1-924f-52540021303b','2026-10-15 11:49:32.688',NULL,0,NULL);
/*!40000 ALTER TABLE `scheduled_jobs` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `scope_categories`
--

DROP TABLE IF EXISTS `scope_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `scope_categories` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uq_scope_categories_slug` (`slug`) USING BTREE,
  KEY `idx_scope_categories_active` (`is_active`) USING BTREE,
  KEY `idx_scope_categories_deleted_at` (`deleted_at`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `scope_categories`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `scope_categories` WRITE;
/*!40000 ALTER TABLE `scope_categories` DISABLE KEYS */;
INSERT INTO `scope_categories` VALUES
('fb5c78dc-9f92-11f1-99c8-52540021303b','Site Preparation','site-preparation','Site clearing, preparation, mobilization, temporary works and related activities.',1,1,'2026-08-24 13:38:25','2026-08-24 13:38:25',NULL),
('fb5c7dcb-9f92-11f1-99c8-52540021303b','Civil Works','civil-works','Excavation, foundations, concrete, masonry, structural and other civil construction works.',2,1,'2026-08-24 13:38:25','2026-08-24 13:38:25',NULL),
('fb5c8017-9f92-11f1-99c8-52540021303b','Architectural Works','architectural-works','Architectural finishes, flooring, walls, ceilings, doors, windows and related works.',3,1,'2026-08-24 13:38:25','2026-08-24 13:38:25',NULL),
('fb5c81bb-9f92-11f1-99c8-52540021303b','Electrical Works','electrical-works','Electrical installation, wiring, lighting, power distribution and related systems.',4,1,'2026-08-24 13:38:25','2026-08-24 13:38:25',NULL),
('fb5c82cd-9f92-11f1-99c8-52540021303b','Plumbing & Sanitary','plumbing-sanitary','Water supply, drainage, sanitary fixtures, piping and associated plumbing works.',5,1,'2026-08-24 13:38:25','2026-08-24 13:38:25',NULL),
('fb5c83a7-9f92-11f1-99c8-52540021303b','HVAC','hvac','Heating, ventilation, air conditioning and associated mechanical systems.',6,1,'2026-08-24 13:38:25','2026-08-24 13:38:25',NULL),
('fb5c84aa-9f92-11f1-99c8-52540021303b','Fire & Safety','fire-safety','Fire protection, fire detection, emergency systems and safety installations.',7,1,'2026-08-24 13:38:25','2026-08-24 13:38:25',NULL),
('fb5c85e9-9f92-11f1-99c8-52540021303b','External Works','external-works','Landscaping, paving, boundary works, external drainage and other outdoor works.',8,1,'2026-08-24 13:38:25','2026-08-24 13:38:25',NULL),
('fb5c86bb-9f92-11f1-99c8-52540021303b','Furniture & Fixtures','furniture-fixtures','Fixed furniture, loose furniture, fixtures, fittings and associated installation works.',9,1,'2026-08-24 13:38:25','2026-08-24 13:38:25',NULL),
('fb5c8766-9f92-11f1-99c8-52540021303b','Testing & Commissioning','testing-commissioning','Testing, inspection, commissioning, balancing and handover activities.',10,1,'2026-08-24 13:38:25','2026-08-24 13:38:25',NULL),
('fb5c8822-9f92-11f1-99c8-52540021303b','Documentation & Handover','documentation-handover','As-built drawings, operation manuals, warranties, certificates and final handover documentation.',11,1,'2026-08-24 13:38:25','2026-08-24 13:38:25',NULL);
/*!40000 ALTER TABLE `scope_categories` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `scope_items`
--

DROP TABLE IF EXISTS `scope_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `scope_items` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `scope_of_work_id` char(36) NOT NULL,
  `project_space_id` char(36) NOT NULL,
  `scope_category_id` char(36) NOT NULL,
  `scope_of_work` text DEFAULT NULL,
  `is_included` tinyint(1) NOT NULL DEFAULT 1,
  `is_excluded` tinyint(1) NOT NULL DEFAULT 0,
  `notes` text DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_scope_items_project_id` (`project_id`) USING BTREE,
  KEY `idx_scope_items_project_space_id` (`project_space_id`) USING BTREE,
  KEY `idx_scope_items_scope_category_id` (`scope_category_id`) USING BTREE,
  KEY `idx_scope_items_included_excluded` (`is_included`,`is_excluded`) USING BTREE,
  KEY `idx_scope_items_deleted_at` (`deleted_at`) USING BTREE,
  KEY `idx_scope_items_scope_of_work_id` (`scope_of_work_id`),
  CONSTRAINT `fk_scope_items_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_scope_items_project_space` FOREIGN KEY (`project_space_id`) REFERENCES `project_spaces` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_scope_items_scope_category` FOREIGN KEY (`scope_category_id`) REFERENCES `scope_categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_scope_items_scope_of_work` FOREIGN KEY (`scope_of_work_id`) REFERENCES `scope_of_work` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `scope_items`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `scope_items` WRITE;
/*!40000 ALTER TABLE `scope_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `scope_items` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `scope_of_work`
--

DROP TABLE IF EXISTS `scope_of_work`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `scope_of_work` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `scope_summary` text DEFAULT NULL,
  `specific_exclusions` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `project_mode` varchar(50) DEFAULT NULL,
  `version` int(11) NOT NULL DEFAULT 1,
  `status` varchar(50) NOT NULL DEFAULT 'DRAFT',
  `prepared_by` char(36) DEFAULT NULL,
  `reviewed_by` char(36) DEFAULT NULL,
  `accepted_at` datetime DEFAULT NULL,
  `accepted_by` char(36) DEFAULT NULL,
  `client_signature_name` varchar(255) DEFAULT NULL,
  `client_signature_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  `total_area_sqft` decimal(12,2) DEFAULT NULL,
  `document_date` date DEFAULT NULL,
  `authorised_signatory_name` varchar(255) DEFAULT NULL,
  `authorised_signatory_date` date DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_scope_of_work_project_id` (`project_id`) USING BTREE,
  KEY `idx_scope_of_work_prepared_by` (`prepared_by`) USING BTREE,
  KEY `idx_scope_of_work_reviewed_by` (`reviewed_by`) USING BTREE,
  KEY `idx_scope_of_work_accepted_by` (`accepted_by`) USING BTREE,
  KEY `idx_scope_of_work_status` (`status`) USING BTREE,
  KEY `idx_scope_of_work_deleted_at` (`deleted_at`) USING BTREE,
  CONSTRAINT `fk_scope_of_work_accepted_by` FOREIGN KEY (`accepted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_scope_of_work_prepared_by` FOREIGN KEY (`prepared_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_scope_of_work_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_scope_of_work_reviewed_by` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `scope_of_work`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `scope_of_work` WRITE;
/*!40000 ALTER TABLE `scope_of_work` DISABLE KEYS */;
/*!40000 ALTER TABLE `scope_of_work` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `id` char(36) NOT NULL,
  `key` varchar(100) NOT NULL,
  `value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`value`)),
  `updated_by` char(36) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `settings_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES
('4689e689-8ce3-4326-bd73-2d8176ae1b03','proposal_next_steps.6725b123-5893-454d-9e7a-7d14fbaf1fc1','{\"steps\": [{\"id\": \"review-proposal\", \"done\": false, \"title\": \"Review this proposal\", \"detail\": \"Take a week. Mark anything unclear. We will walk it through with you.\"}, {\"id\": \"confirm-scope\", \"done\": false, \"title\": \"Confirm the scope\", \"detail\": \"Tick the engagement and optional items. We revise the BOQ against your ticks.\"}, {\"id\": \"freeze-cost\", \"done\": false, \"title\": \"Freeze cost at Gate 02\", \"detail\": \"BOQ priced line by line and signed. The estimate becomes a firm number.\"}, {\"id\": \"sign-agreement\", \"done\": false, \"title\": \"Sign the Agreement\", \"detail\": \"Scope of Work, Payment Schedule, Plan of Action issued together for signature.\"}, {\"id\": \"release-m1\", \"done\": false, \"title\": \"Release M1 and mobilise\", \"detail\": \"15% booking and mobilisation. Site team on the ground within five days.\"}], \"checklist\": [{\"id\": \"signed-agreement\", \"done\": false, \"label\": \"Signed Scope of Work and Agreement\"}, {\"id\": \"booking-payment\", \"done\": false, \"label\": \"Booking and mobilisation payment\"}, {\"id\": \"society-permission\", \"done\": false, \"label\": \"Society permission for work and material lift\"}, {\"id\": \"site-access\", \"done\": false, \"label\": \"Access, keys and a point of contact at site\"}, {\"id\": \"water-power\", \"done\": false, \"label\": \"Water and power connection at the unit\"}, {\"id\": \"client-material\", \"done\": false, \"label\": \"Any client-supplied material schedule\"}]}',NULL,'2026-10-09 09:50:37'),
('51d7db8d-148e-460a-9fc0-25ebeffee437','terms','{\"default_terms\": \"\"}',NULL,'2026-06-30 15:00:51');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `shortlist_entries`
--

DROP TABLE IF EXISTS `shortlist_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `shortlist_entries` (
  `id` char(36) NOT NULL,
  `project_shortlist_id` char(36) NOT NULL,
  `trade` varchar(32) NOT NULL,
  `working_type` varchar(32) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `vendor_id` char(36) DEFAULT NULL,
  `material_id` char(36) DEFAULT NULL,
  `name_of_vendor` varchar(255) DEFAULT NULL,
  `estimate_value` decimal(15,2) DEFAULT NULL,
  `quotation_value` decimal(15,2) DEFAULT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'INR',
  `quotation_id` char(36) DEFAULT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'DRAFT',
  `notes` text DEFAULT NULL,
  `is_selected` tinyint(1) NOT NULL DEFAULT 0,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `workspace_trade` varchar(32) GENERATED ALWAYS AS (case when `trade` in ('Plumber','Electrician','AC','POP','Flooring','Carpentar','MS','Solar','Glass','Paint','Civil','Facade') and `working_type` in ('Contractor','Individual','Freelancer') then `trade` else NULL end) STORED,
  `workspace_working_type` varchar(32) GENERATED ALWAYS AS (case when `working_type` in ('Contractor','Individual','Freelancer') then `working_type` else NULL end) STORED,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uq_shortlist_workspace_row` (`project_shortlist_id`,`workspace_trade`,`workspace_working_type`),
  KEY `idx_shortlist_entries_project_shortlist_id` (`project_shortlist_id`) USING BTREE,
  KEY `idx_shortlist_entries_trade` (`trade`) USING BTREE,
  KEY `idx_shortlist_entries_working_type` (`working_type`) USING BTREE,
  KEY `idx_shortlist_entries_vendor_id` (`vendor_id`) USING BTREE,
  KEY `idx_shortlist_entries_material_id` (`material_id`) USING BTREE,
  KEY `idx_shortlist_entries_created_by` (`created_by`) USING BTREE,
  KEY `idx_shortlist_entries_updated_by` (`updated_by`) USING BTREE,
  CONSTRAINT `fk_shortlist_entries_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_shortlist_entries_material` FOREIGN KEY (`material_id`) REFERENCES `material_masters` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_shortlist_entries_project_shortlist` FOREIGN KEY (`project_shortlist_id`) REFERENCES `project_shortlists` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_shortlist_entries_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_shortlist_entries_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shortlist_entries`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `shortlist_entries` WRITE;
/*!40000 ALTER TABLE `shortlist_entries` DISABLE KEYS */;
/*!40000 ALTER TABLE `shortlist_entries` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `shortlist_entries_workspace_backup`
--

DROP TABLE IF EXISTS `shortlist_entries_workspace_backup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `shortlist_entries_workspace_backup` (
  `id` char(36) NOT NULL,
  `project_shortlist_id` char(36) NOT NULL,
  `trade` varchar(32) NOT NULL,
  `working_type` varchar(32) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `vendor_id` char(36) DEFAULT NULL,
  `material_id` char(36) DEFAULT NULL,
  `name_of_vendor` varchar(255) DEFAULT NULL,
  `estimate_value` decimal(15,2) DEFAULT NULL,
  `quotation_value` decimal(15,2) DEFAULT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'INR',
  `quotation_id` char(36) DEFAULT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'DRAFT',
  `notes` text DEFAULT NULL,
  `is_selected` tinyint(1) NOT NULL DEFAULT 0,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_shortlist_entries_project_shortlist_id` (`project_shortlist_id`) USING BTREE,
  KEY `idx_shortlist_entries_trade` (`trade`) USING BTREE,
  KEY `idx_shortlist_entries_working_type` (`working_type`) USING BTREE,
  KEY `idx_shortlist_entries_vendor_id` (`vendor_id`) USING BTREE,
  KEY `idx_shortlist_entries_material_id` (`material_id`) USING BTREE,
  KEY `idx_shortlist_entries_created_by` (`created_by`) USING BTREE,
  KEY `idx_shortlist_entries_updated_by` (`updated_by`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shortlist_entries_workspace_backup`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `shortlist_entries_workspace_backup` WRITE;
/*!40000 ALTER TABLE `shortlist_entries_workspace_backup` DISABLE KEYS */;
/*!40000 ALTER TABLE `shortlist_entries_workspace_backup` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `shortlist_packages`
--

DROP TABLE IF EXISTS `shortlist_packages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `shortlist_packages` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `shortlist_type` enum('VENDOR','MATERIAL') NOT NULL,
  `entries` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`entries`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_shortlist_packages_type` (`shortlist_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shortlist_packages`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `shortlist_packages` WRITE;
/*!40000 ALTER TABLE `shortlist_packages` DISABLE KEYS */;
/*!40000 ALTER TABLE `shortlist_packages` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `site_recce_photos`
--

DROP TABLE IF EXISTS `site_recce_photos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_recce_photos` (
  `id` char(36) NOT NULL,
  `site_recce_id` char(36) NOT NULL,
  `room_id` char(36) NOT NULL,
  `shot_number` int(11) NOT NULL,
  `layout_image_url` text DEFAULT NULL,
  `layout_file_name` varchar(255) DEFAULT NULL,
  `photo_url` text DEFAULT NULL,
  `photo_file_name` varchar(255) DEFAULT NULL,
  `standing_position` varchar(255) DEFAULT NULL,
  `camera_direction` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_site_recce_photos_site_recce_id` (`site_recce_id`),
  KEY `idx_site_recce_photos_room_id` (`room_id`),
  KEY `idx_site_recce_photos_shot_number` (`room_id`,`shot_number`),
  CONSTRAINT `fk_site_recce_photos_room` FOREIGN KEY (`room_id`) REFERENCES `site_recce_rooms` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_site_recce_photos_site_recce` FOREIGN KEY (`site_recce_id`) REFERENCES `site_recces` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_recce_photos`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `site_recce_photos` WRITE;
/*!40000 ALTER TABLE `site_recce_photos` DISABLE KEYS */;
/*!40000 ALTER TABLE `site_recce_photos` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `site_recce_rooms`
--

DROP TABLE IF EXISTS `site_recce_rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_recce_rooms` (
  `id` char(36) NOT NULL,
  `site_recce_id` char(36) NOT NULL,
  `room_name` varchar(255) NOT NULL,
  `room_type` enum('LIVING_DINING','MASTER_BEDROOM','BEDROOM','KITCHEN','BATHROOM','BALCONY','OTHER') NOT NULL DEFAULT 'OTHER',
  `room_number` int(11) DEFAULT NULL,
  `length` decimal(14,6) DEFAULT NULL,
  `width` decimal(14,6) DEFAULT NULL,
  `height` decimal(14,6) DEFAULT NULL,
  `measurement_unit` enum('FT','M','IN','CM') NOT NULL DEFAULT 'FT',
  `existing_flooring` text DEFAULT NULL,
  `existing_ceiling` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `room_type_other` varchar(255) DEFAULT NULL,
  `area` decimal(12,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_site_recce_rooms_site_recce_id` (`site_recce_id`),
  KEY `idx_site_recce_rooms_sort_order` (`site_recce_id`,`sort_order`),
  CONSTRAINT `fk_site_recce_rooms_site_recce` FOREIGN KEY (`site_recce_id`) REFERENCES `site_recces` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_recce_rooms`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `site_recce_rooms` WRITE;
/*!40000 ALTER TABLE `site_recce_rooms` DISABLE KEYS */;
/*!40000 ALTER TABLE `site_recce_rooms` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `site_recces`
--

DROP TABLE IF EXISTS `site_recces`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_recces` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `project_name` varchar(255) DEFAULT NULL,
  `client_name` varchar(255) DEFAULT NULL,
  `site_address` text DEFAULT NULL,
  `recce_date` date NOT NULL,
  `site_engineer_id` char(36) DEFAULT NULL,
  `accompanied_by` varchar(255) DEFAULT NULL,
  `unit_floor_no` varchar(100) DEFAULT NULL,
  `carpet_area_sqft` decimal(12,2) DEFAULT NULL,
  `built_up_area_sqft` decimal(12,2) DEFAULT NULL,
  `number_of_rooms` int(11) DEFAULT NULL,
  `number_of_floors` int(11) DEFAULT NULL,
  `site_type` varchar(100) DEFAULT NULL,
  `lift_available` tinyint(1) DEFAULT NULL,
  `lift_size` varchar(255) DEFAULT NULL,
  `staircase_width` varchar(100) DEFAULT NULL,
  `material_entry_point` text DEFAULT NULL,
  `water_connection` text DEFAULT NULL,
  `power_load_available` varchar(255) DEFAULT NULL,
  `drainage_point_location` text DEFAULT NULL,
  `society_rwa_restrictions` text DEFAULT NULL,
  `working_hours_allowed` varchar(255) DEFAULT NULL,
  `material_movement_rule` text DEFAULT NULL,
  `existing_condition` text DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `project_type` varchar(100) DEFAULT NULL,
  `site_type_other` varchar(100) DEFAULT NULL,
  `site_condition` varchar(100) DEFAULT NULL,
  `site_condition_category` varchar(100) DEFAULT NULL,
  `site_condition_other` varchar(100) DEFAULT NULL,
  `floor_layouts` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`floor_layouts`)),
  `site_restrictions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`site_restrictions`)),
  `existing_site_layouts` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`existing_site_layouts`)),
  PRIMARY KEY (`id`),
  KEY `idx_site_recces_project_id` (`project_id`),
  KEY `idx_site_recces_site_engineer_id` (`site_engineer_id`),
  KEY `idx_site_recces_created_by` (`created_by`),
  KEY `idx_site_recces_updated_by` (`updated_by`),
  KEY `idx_site_recces_recce_date` (`recce_date`),
  KEY `idx_site_recces_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_site_recces_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_site_recces_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_site_recces_site_engineer` FOREIGN KEY (`site_engineer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_site_recces_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_recces`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `site_recces` WRITE;
/*!40000 ALTER TABLE `site_recces` DISABLE KEYS */;
/*!40000 ALTER TABLE `site_recces` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `site_visit_logs`
--

DROP TABLE IF EXISTS `site_visit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_visit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` char(36) NOT NULL,
  `visit_assignment_id` int(11) DEFAULT NULL,
  `visitor_type` enum('INTERNAL','EXTERNAL') NOT NULL,
  `visitor_name` varchar(150) NOT NULL,
  `scheduled_date` date NOT NULL,
  `actual_visit_at` datetime DEFAULT NULL,
  `status` enum('SCHEDULED','COMPLETED','MISSED','CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
  `purpose` varchar(250) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `logged_by` varchar(150) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_site_visit_logs_project_id` (`project_id`),
  KEY `idx_site_visit_logs_visit_assignment_id` (`visit_assignment_id`),
  KEY `idx_site_visit_logs_scheduled_date` (`scheduled_date`),
  KEY `idx_site_visit_logs_status` (`status`),
  KEY `site_visit_logs_project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_visit_logs`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `site_visit_logs` WRITE;
/*!40000 ALTER TABLE `site_visit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `site_visit_logs` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `snag_items`
--

DROP TABLE IF EXISTS `snag_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `snag_items` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `visit_id` char(36) DEFAULT NULL,
  `s_no` int(11) NOT NULL,
  `floor` varchar(100) DEFAULT NULL,
  `room` varchar(150) DEFAULT NULL,
  `category` varchar(150) DEFAULT NULL,
  `observation` text NOT NULL,
  `photos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`photos`)),
  `scope` varchar(150) DEFAULT NULL,
  `status` enum('OPEN','IN_PROGRESS','RESOLVED','CLOSED','REOPENED') NOT NULL DEFAULT 'OPEN',
  `remarks` text DEFAULT NULL,
  `closed_at` datetime DEFAULT NULL,
  `closed_by` char(36) DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_snag_project_sno` (`project_id`,`s_no`),
  KEY `idx_snag_status` (`project_id`,`status`),
  KEY `idx_snag_visit` (`visit_id`),
  KEY `idx_snag_closed_by` (`closed_by`),
  KEY `idx_snag_created_by` (`created_by`),
  KEY `idx_snag_updated_by` (`updated_by`),
  CONSTRAINT `fk_snag_closed_by` FOREIGN KEY (`closed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_snag_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_snag_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_snag_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_snag_visit` FOREIGN KEY (`visit_id`) REFERENCES `architect_site_visits` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `snag_items`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `snag_items` WRITE;
/*!40000 ALTER TABLE `snag_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `snag_items` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `snag_list_revisions`
--

DROP TABLE IF EXISTS `snag_list_revisions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `snag_list_revisions` (
  `id` char(36) NOT NULL,
  `snag_list_id` char(36) NOT NULL,
  `revision` int(11) NOT NULL,
  `document` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`document`)),
  `excel_data` longblob NOT NULL,
  `created_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_snag_list_revision` (`snag_list_id`,`revision`),
  CONSTRAINT `fk_snag_list_revision` FOREIGN KEY (`snag_list_id`) REFERENCES `snag_lists` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `snag_list_revisions`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `snag_list_revisions` WRITE;
/*!40000 ALTER TABLE `snag_list_revisions` DISABLE KEYS */;
/*!40000 ALTER TABLE `snag_list_revisions` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `snag_lists`
--

DROP TABLE IF EXISTS `snag_lists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `snag_lists` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `project_name` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `document_date` date NOT NULL,
  `revision` int(11) NOT NULL,
  `items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`items`)),
  `item_count` int(11) NOT NULL,
  `open_count` int(11) NOT NULL,
  `excel_data` longblob NOT NULL,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_snag_lists_project_date` (`project_id`,`document_date`),
  KEY `idx_snag_lists_updated` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `snag_lists`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `snag_lists` WRITE;
/*!40000 ALTER TABLE `snag_lists` DISABLE KEYS */;
/*!40000 ALTER TABLE `snag_lists` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `step_teams`
--

DROP TABLE IF EXISTS `step_teams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `step_teams` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `stepId` int(11) NOT NULL,
  `teamId` char(36) NOT NULL,
  `responsibilityType` enum('OWNER','SUPPORT','APPROVER') NOT NULL DEFAULT 'OWNER',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_step_teams_responsibility` (`stepId`,`teamId`,`responsibilityType`) USING BTREE,
  KEY `idx_step_teams_stepId` (`stepId`) USING BTREE,
  KEY `idx_step_teams_teamId` (`teamId`) USING BTREE,
  CONSTRAINT `fk_step_teams_step` FOREIGN KEY (`stepId`) REFERENCES `steps` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_step_teams_team` FOREIGN KEY (`teamId`) REFERENCES `teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `step_teams`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `step_teams` WRITE;
/*!40000 ALTER TABLE `step_teams` DISABLE KEYS */;
/*!40000 ALTER TABLE `step_teams` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `steps`
--

DROP TABLE IF EXISTS `steps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `steps` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `phaseId` char(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  `code` varchar(60) NOT NULL,
  `order` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `isGate` tinyint(1) NOT NULL DEFAULT 0,
  `gateName` varchar(150) DEFAULT NULL,
  `defaultDurationDays` int(11) NOT NULL DEFAULT 1,
  `dependsOnStepCodes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`dependsOnStepCodes`)),
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_steps_code` (`code`) USING BTREE,
  KEY `idx_steps_phaseId` (`phaseId`) USING BTREE,
  CONSTRAINT `fk_steps_project_phase` FOREIGN KEY (`phaseId`) REFERENCES `project_phases` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `steps`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `steps` WRITE;
/*!40000 ALTER TABLE `steps` DISABLE KEYS */;
/*!40000 ALTER TABLE `steps` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `sync_calendar_events`
--

DROP TABLE IF EXISTS `sync_calendar_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sync_calendar_events` (
  `id` char(36) NOT NULL,
  `local_event_id` char(36) NOT NULL,
  `zoho_event_id` varchar(255) NOT NULL,
  `zoho_calendar_id` varchar(255) NOT NULL,
  `synced_at` datetime DEFAULT NULL,
  `last_modified_local` datetime DEFAULT NULL,
  `last_modified_zoho` datetime DEFAULT NULL,
  `sync_status` enum('pending','synced','failed') NOT NULL DEFAULT 'pending',
  `error_message` text DEFAULT NULL,
  `last_sync_direction` enum('push','pull','merge') NOT NULL DEFAULT 'merge',
  `sync_attempts` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uq_sync_calendar_events_local_event_id` (`local_event_id`) USING BTREE,
  KEY `idx_sync_calendar_events_zoho_event_id` (`zoho_event_id`) USING BTREE,
  KEY `idx_sync_calendar_events_sync_status` (`sync_status`) USING BTREE,
  CONSTRAINT `fk_sync_calendar_events_local_event` FOREIGN KEY (`local_event_id`) REFERENCES `calendar_events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sync_calendar_events`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `sync_calendar_events` WRITE;
/*!40000 ALTER TABLE `sync_calendar_events` DISABLE KEYS */;
/*!40000 ALTER TABLE `sync_calendar_events` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `sync_logs`
--

DROP TABLE IF EXISTS `sync_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sync_logs` (
  `id` char(36) NOT NULL,
  `entity_type` enum('task','calendar') NOT NULL,
  `entity_id` varchar(255) NOT NULL,
  `direction` enum('push','pull') NOT NULL,
  `status` enum('success','failed') NOT NULL DEFAULT 'success',
  `error_message` text DEFAULT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload`)),
  `attempt` int(11) NOT NULL DEFAULT 1,
  `duration_ms` int(11) DEFAULT NULL,
  `triggered_by` char(36) DEFAULT NULL,
  `trigger_type` enum('auto','manual') NOT NULL DEFAULT 'auto',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sync_logs_entity_type` (`entity_type`),
  KEY `idx_sync_logs_status` (`status`),
  KEY `idx_sync_logs_entity_id` (`entity_id`),
  KEY `idx_sync_logs_entity_type_created_at` (`entity_type`,`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sync_logs`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `sync_logs` WRITE;
/*!40000 ALTER TABLE `sync_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `sync_logs` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `sync_tasks`
--

DROP TABLE IF EXISTS `sync_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sync_tasks` (
  `id` char(36) NOT NULL,
  `local_task_id` char(36) NOT NULL,
  `zoho_task_id` varchar(255) DEFAULT NULL,
  `zoho_portal_id` varchar(255) DEFAULT NULL,
  `zoho_project_id` varchar(255) DEFAULT NULL,
  `zoho_tasklist_id` varchar(255) DEFAULT NULL,
  `synced_at` datetime DEFAULT NULL,
  `last_modified_local` datetime DEFAULT NULL,
  `last_modified_zoho` datetime DEFAULT NULL,
  `sync_status` enum('pending','synced','failed') NOT NULL DEFAULT 'pending',
  `error_message` text DEFAULT NULL,
  `last_sync_direction` enum('push','pull','merge') NOT NULL DEFAULT 'merge',
  `sync_attempts` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uq_sync_tasks_local_task_id` (`local_task_id`) USING BTREE,
  KEY `idx_sync_tasks_zoho_task_id` (`zoho_task_id`) USING BTREE,
  KEY `idx_sync_tasks_sync_status` (`sync_status`) USING BTREE,
  CONSTRAINT `fk_sync_tasks_local_task` FOREIGN KEY (`local_task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sync_tasks`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `sync_tasks` WRITE;
/*!40000 ALTER TABLE `sync_tasks` DISABLE KEYS */;
/*!40000 ALTER TABLE `sync_tasks` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `task_definitions`
--

DROP TABLE IF EXISTS `task_definitions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_definitions` (
  `id` char(36) NOT NULL,
  `module` enum('DESIGN','PROCUREMENT','SITE','PROJECT','FINANCE','CRM') NOT NULL,
  `phase_id` char(36) NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('EXEC') NOT NULL DEFAULT 'EXEC',
  `mandatory` tinyint(1) NOT NULL DEFAULT 1,
  `owner_role` varchar(100) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_task_definitions_module_code` (`module`,`code`),
  KEY `idx_task_definitions_phase_id` (`phase_id`),
  CONSTRAINT `fk_task_definitions_phase` FOREIGN KEY (`phase_id`) REFERENCES `project_phases` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_definitions`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `task_definitions` WRITE;
/*!40000 ALTER TABLE `task_definitions` DISABLE KEYS */;
/*!40000 ALTER TABLE `task_definitions` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `task_executions`
--

DROP TABLE IF EXISTS `task_executions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_executions` (
  `id` char(36) NOT NULL,
  `project_id` char(36) NOT NULL,
  `task_definition_id` char(36) NOT NULL,
  `status` enum('PENDING','IN_PROGRESS','COMPLETED','SKIPPED','BLOCKED') NOT NULL DEFAULT 'PENDING',
  `remarks` text DEFAULT NULL,
  `completed_by` char(36) DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_task_executions_project_definition` (`project_id`,`task_definition_id`),
  KEY `idx_task_executions_project_id` (`project_id`),
  KEY `idx_task_executions_task_definition_id` (`task_definition_id`),
  KEY `idx_task_executions_completed_by` (`completed_by`),
  CONSTRAINT `fk_task_executions_completed_by` FOREIGN KEY (`completed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_task_executions_definition` FOREIGN KEY (`task_definition_id`) REFERENCES `task_definitions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_task_executions_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task_executions`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `task_executions` WRITE;
/*!40000 ALTER TABLE `task_executions` DISABLE KEYS */;
/*!40000 ALTER TABLE `task_executions` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `project_id` char(36) DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `assigned_to` char(36) DEFAULT NULL,
  `priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  `status` enum('todo','in_progress','review','blocked','completed') NOT NULL DEFAULT 'todo',
  `start_date` datetime DEFAULT NULL,
  `due_date` datetime DEFAULT NULL,
  `due_bucket` varchar(255) DEFAULT NULL,
  `order_index` int(11) NOT NULL DEFAULT 0,
  `workload_estimate_hours` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_crucial` tinyint(1) NOT NULL DEFAULT 0,
  `crucial_reason` text DEFAULT NULL,
  `crucial_ref` int(10) unsigned NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tasks_crucial_ref_unique` (`crucial_ref`),
  KEY `idx_tasks_project_id` (`project_id`),
  KEY `idx_tasks_created_by` (`created_by`),
  KEY `idx_tasks_assigned_to` (`assigned_to`),
  KEY `idx_tasks_status` (`status`),
  CONSTRAINT `fk_tasks_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_tasks_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tasks`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `tasks` WRITE;
/*!40000 ALTER TABLE `tasks` DISABLE KEYS */;
/*!40000 ALTER TABLE `tasks` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `team_members`
--

DROP TABLE IF EXISTS `team_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `team_members` (
  `id` char(36) NOT NULL,
  `team_id` char(36) DEFAULT NULL,
  `owner_type` enum('PROJECT','PLAN_OF_ACTION','QUOTATION','BOQ') DEFAULT NULL,
  `owner_id` char(36) DEFAULT NULL,
  `user_id` char(36) NOT NULL,
  `role_label` varchar(100) DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_team_members_owner` (`owner_type`,`owner_id`) USING BTREE,
  KEY `idx_team_members_user_id` (`user_id`) USING BTREE,
  KEY `idx_team_members_created_by` (`created_by`) USING BTREE,
  KEY `idx_team_members_deleted_at` (`deleted_at`) USING BTREE,
  KEY `idx_team_members_updated_by` (`updated_by`),
  KEY `fk_team_members_team` (`team_id`),
  CONSTRAINT `fk_team_members_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_team_members_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_team_members_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_team_members_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_members`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `team_members` WRITE;
/*!40000 ALTER TABLE `team_members` DISABLE KEYS */;
/*!40000 ALTER TABLE `team_members` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `team_section_access`
--

DROP TABLE IF EXISTS `team_section_access`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `team_section_access` (
  `id` char(36) NOT NULL,
  `team_id` char(36) NOT NULL,
  `section_id` char(36) NOT NULL,
  `access_level` enum('NONE','VIEW_ONLY','LIMITED','FULL') NOT NULL DEFAULT 'NONE',
  `can_view` tinyint(1) NOT NULL DEFAULT 0,
  `can_create` tinyint(1) NOT NULL DEFAULT 0,
  `can_edit` tinyint(1) NOT NULL DEFAULT 0,
  `can_delete` tinyint(1) NOT NULL DEFAULT 0,
  `can_approve` tinyint(1) NOT NULL DEFAULT 0,
  `scope` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`scope`)),
  `created_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uq_team_section_access_team_section` (`team_id`,`section_id`) USING BTREE,
  KEY `idx_team_section_access_team_id` (`team_id`) USING BTREE,
  KEY `idx_team_section_access_section_id` (`section_id`) USING BTREE,
  KEY `idx_team_section_access_created_by` (`created_by`) USING BTREE,
  CONSTRAINT `fk_team_section_access_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_team_section_access_section` FOREIGN KEY (`section_id`) REFERENCES `team_sections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_team_section_access_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_section_access`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `team_section_access` WRITE;
/*!40000 ALTER TABLE `team_section_access` DISABLE KEYS */;
/*!40000 ALTER TABLE `team_section_access` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `team_sections`
--

DROP TABLE IF EXISTS `team_sections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `team_sections` (
  `id` char(36) NOT NULL,
  `key` varchar(100) NOT NULL,
  `name` varchar(150) NOT NULL,
  `parent_key` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'ACTIVE',
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_team_sections_key` (`key`),
  KEY `idx_team_sections_parent_key` (`parent_key`),
  KEY `idx_team_sections_status` (`status`),
  KEY `idx_team_sections_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_sections`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `team_sections` WRITE;
/*!40000 ALTER TABLE `team_sections` DISABLE KEYS */;
INSERT INTO `team_sections` VALUES
('9ab04088-b0c6-11f1-b327-52540021303b','PROJECTS','Projects',NULL,'Project management and project workspace.','ACTIVE',10,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab04ac2-b0c6-11f1-b327-52540021303b','PROJECTS_OVERVIEW','Project Overview','PROJECTS','Project overview and summary.','ACTIVE',10,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab04d1f-b0c6-11f1-b327-52540021303b','PROJECT_PLANNER','Project Planner','PROJECTS','Project phases, milestones and planning.','ACTIVE',20,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab04e62-b0c6-11f1-b327-52540021303b','CLIENT_BRIEF','Client Brief','PROJECTS','Client requirements and briefing.','ACTIVE',30,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab04f80-b0c6-11f1-b327-52540021303b','DESIGN_STUDIO','Design Studio','PROJECTS','Design and consultancy workspace.','ACTIVE',40,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab050c2-b0c6-11f1-b327-52540021303b','PROJECT_DOCUMENTS','Documents','PROJECTS','Project documents and document versions.','ACTIVE',50,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab051cb-b0c6-11f1-b327-52540021303b','BOQ','BOQ','PROJECTS','Bill of quantities and project quantities.','ACTIVE',60,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab052c6-b0c6-11f1-b327-52540021303b','ESTIMATES','Estimates','PROJECTS','Project estimates and costing.','ACTIVE',70,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab053d9-b0c6-11f1-b327-52540021303b','TASKS','Tasks','PROJECTS','Project tasks and assignments.','ACTIVE',80,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab054dc-b0c6-11f1-b327-52540021303b','CALENDAR','Calendar','PROJECTS','Project calendar and events.','ACTIVE',90,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab055d0-b0c6-11f1-b327-52540021303b','CRM','CRM',NULL,'Customer relationship and business development.','ACTIVE',20,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab05762-b0c6-11f1-b327-52540021303b','CRM_LEADS','Leads','CRM','Lead management.','ACTIVE',10,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab0586a-b0c6-11f1-b327-52540021303b','CRM_SITE_RECCE','Site Recce','CRM','Site reconnaissance and survey information.','ACTIVE',20,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab05a1d-b0c6-11f1-b327-52540021303b','CRM_POA','Plan of Action','CRM','Project plan of action.','ACTIVE',30,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab05b2e-b0c6-11f1-b327-52540021303b','CRM_SCOPE_OF_WORK','Scope of Work','CRM','Scope of work management.','ACTIVE',40,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab05c5e-b0c6-11f1-b327-52540021303b','CRM_BUSINESS_PROPOSAL','Business Proposal','CRM','Business proposals for clients.','ACTIVE',50,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab05d69-b0c6-11f1-b327-52540021303b','SITE_OPERATIONS','Site Operations',NULL,'Site execution and field operations.','ACTIVE',30,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab05e85-b0c6-11f1-b327-52540021303b','SITE_DAILY_REPORTS','Daily Reports','SITE_OPERATIONS','Daily site reports.','ACTIVE',10,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab05fa2-b0c6-11f1-b327-52540021303b','SITE_VISITS','Site Visits','SITE_OPERATIONS','Site visit assignments and records.','ACTIVE',20,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab060e0-b0c6-11f1-b327-52540021303b','SITE_CHECKLISTS','Checklists','SITE_OPERATIONS','Site execution checklists.','ACTIVE',30,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab0751b-b0c6-11f1-b327-52540021303b','SITE_QC','Quality Control','SITE_OPERATIONS','Quality control and inspections.','ACTIVE',40,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab07707-b0c6-11f1-b327-52540021303b','SITE_MOCKUPS','Mockups','SITE_OPERATIONS','Site mockups and approvals.','ACTIVE',50,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab07885-b0c6-11f1-b327-52540021303b','SITE_RFIS','RFIs','SITE_OPERATIONS','Requests for information.','ACTIVE',60,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab079ae-b0c6-11f1-b327-52540021303b','SITE_HANDOVER','Handover','SITE_OPERATIONS','Project handover and signoffs.','ACTIVE',70,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab07ae0-b0c6-11f1-b327-52540021303b','PROCUREMENT','Materials & Procurement',NULL,'Material procurement and purchasing operations.','ACTIVE',40,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab07c2b-b0c6-11f1-b327-52540021303b','MATERIAL_REQUIREMENTS','Material Requirements','PROCUREMENT','Material requirements and planning.','ACTIVE',10,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab07d50-b0c6-11f1-b327-52540021303b','SAMPLE_BOARDS','Sample Boards','PROCUREMENT','Material sample boards.','ACTIVE',20,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab07e77-b0c6-11f1-b327-52540021303b','RATE_SHEETS','Rate Sheets','PROCUREMENT','Material and vendor rate sheets.','ACTIVE',30,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab0806c-b0c6-11f1-b327-52540021303b','QUOTATIONS','Quotations','PROCUREMENT','Supplier quotations.','ACTIVE',40,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab081af-b0c6-11f1-b327-52540021303b','PURCHASE_ORDERS','Purchase Orders','PROCUREMENT','Purchase orders.','ACTIVE',50,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab082ec-b0c6-11f1-b327-52540021303b','DELIVERY_CHALLANS','Delivery Challans','PROCUREMENT','Material delivery challans.','ACTIVE',60,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab083eb-b0c6-11f1-b327-52540021303b','SITE_INVENTORY','Site Inventory','PROCUREMENT','Material inventory at project sites.','ACTIVE',70,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab08524-b0c6-11f1-b327-52540021303b','VENDORS','Vendors',NULL,'Vendor management.','ACTIVE',50,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab086b9-b0c6-11f1-b327-52540021303b','VENDOR_CONTACTS','Vendor Contacts','VENDORS','Vendor contacts and representatives.','ACTIVE',10,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab087ce-b0c6-11f1-b327-52540021303b','VENDOR_PERFORMANCE','Vendor Performance','VENDORS','Vendor performance and evaluation.','ACTIVE',20,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab088fa-b0c6-11f1-b327-52540021303b','FINANCE','Finance & Accounts',NULL,'Financial management.','ACTIVE',60,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab08a06-b0c6-11f1-b327-52540021303b','BUDGET_ESTIMATE','Budget Estimate','FINANCE','Budget estimates.','ACTIVE',10,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab08b0c-b0c6-11f1-b327-52540021303b','PAYMENT_SCHEDULE','Payment Schedule','FINANCE','Project payment schedules.','ACTIVE',20,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab08d2f-b0c6-11f1-b327-52540021303b','LEDGER','Ledger','FINANCE','Financial ledger.','ACTIVE',30,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab08e4f-b0c6-11f1-b327-52540021303b','ADMINISTRATION','Administration',NULL,'System administration.','ACTIVE',70,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab08f6a-b0c6-11f1-b327-52540021303b','ADMIN_USERS','Users','ADMINISTRATION','System users.','ACTIVE',10,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab0905b-b0c6-11f1-b327-52540021303b','ADMIN_CLIENTS','Clients','ADMINISTRATION','Client management.','ACTIVE',20,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab0915c-b0c6-11f1-b327-52540021303b','ADMIN_ROLES','Roles & Permissions','ADMINISTRATION','Roles and permissions.','ACTIVE',30,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab09274-b0c6-11f1-b327-52540021303b','ADMIN_SIGNATURES','Signatures','ADMINISTRATION','Digital signatures.','ACTIVE',40,'2026-09-15 11:00:47','2026-09-15 11:00:47'),
('9ab093c2-b0c6-11f1-b327-52540021303b','ADMIN_LOGS','System Logs','ADMINISTRATION','Administrative and audit logs.','ACTIVE',50,'2026-09-15 11:00:47','2026-09-15 11:00:47');
/*!40000 ALTER TABLE `team_sections` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `teams`
--

DROP TABLE IF EXISTS `teams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `teams` (
  `id` char(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'ACTIVE',
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_teams_name` (`name`),
  KEY `idx_teams_created_by` (`created_by`),
  CONSTRAINT `fk_teams_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teams`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `teams` WRITE;
/*!40000 ALTER TABLE `teams` DISABLE KEYS */;
INSERT INTO `teams` VALUES
('958a9d30-b0c6-11f1-b327-52540021303b','Management','Management, administration and overall project oversight.','ACTIVE',0,'d739bccb-7123-11f1-8bb6-52540021303b','2026-09-15 11:00:38','2026-09-15 11:00:38'),
('958aa45c-b0c6-11f1-b327-52540021303b','Design & Consultancy','Architecture, interior design, consultancy and client documentation.','ACTIVE',0,'d739bccb-7123-11f1-8bb6-52540021303b','2026-09-15 11:00:38','2026-09-15 11:00:38'),
('958aa737-b0c6-11f1-b327-52540021303b','Site Operations','Site execution, site visits, daily reports, QC and handover operations.','ACTIVE',0,'d739bccb-7123-11f1-8bb6-52540021303b','2026-09-15 11:00:38','2026-09-15 11:00:38'),
('958aa892-b0c6-11f1-b327-52540021303b','Procurement & Materials','Material planning, vendor management, quotations, purchase orders and deliveries.','ACTIVE',0,'d739bccb-7123-11f1-8bb6-52540021303b','2026-09-15 11:00:38','2026-09-15 11:00:38'),
('958aa9c5-b0c6-11f1-b327-52540021303b','Finance & Accounts','Budgets, estimates, payment schedules, ledger and financial operations.','ACTIVE',0,'d739bccb-7123-11f1-8bb6-52540021303b','2026-09-15 11:00:38','2026-09-15 11:00:38'),
('e8411729-b0c5-11f1-b327-52540021303b','Project Team','Default team for migrated project-level team members','ACTIVE',0,'d739bccb-7123-11f1-8bb6-52540021303b','2026-09-15 10:55:47','2026-09-15 10:55:47');
/*!40000 ALTER TABLE `teams` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `terms_template_versions`
--

DROP TABLE IF EXISTS `terms_template_versions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `terms_template_versions` (
  `id` char(36) NOT NULL,
  `terms_template_id` char(36) NOT NULL,
  `version` int(11) NOT NULL,
  `content_html` longtext NOT NULL,
  `change_note` varchar(255) DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_terms_template_version` (`terms_template_id`,`version`),
  KEY `idx_terms_template_versions_template` (`terms_template_id`),
  KEY `idx_terms_template_versions_created_by` (`created_by`),
  CONSTRAINT `fk_terms_template_versions_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_terms_template_versions_template` FOREIGN KEY (`terms_template_id`) REFERENCES `terms_templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `terms_template_versions`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `terms_template_versions` WRITE;
/*!40000 ALTER TABLE `terms_template_versions` DISABLE KEYS */;
INSERT INTO `terms_template_versions` VALUES
('73cb4cfc-8520-40ef-b124-1ab296d68523','83e538b3-9a0b-11f1-99c8-52540021303b',2,'<h2>Terms &amp; Conditions</h2>\n\n<h3>1. Basis of this schedule</h3>\n<p>This Payment Schedule is to be read together with the Plan of Action and the signed Agreement for the project.<br />Where a percentage is stated, it is of the total contract value recorded above and is exclusive of GST, variations and client-supplied items.</p>\n\n\n<h3>2. Release before mobilisation</h3>\n<p>Each milestone falls due before the corresponding phase is mobilised at site. In line with the Plan of Action,<br />mobilisation of the next phase is subject to the corresponding milestone payment being cleared.</p>\n\n\n<h3>3. Invoicing and due date</h3>\n<p>Every milestone will be intimated in writing with a stage note and an invoice. Payment is due within three working<br />days of the invoice date. Work already in progress continues uninterrupted only against timely release.</p>\n\n\n<h3>4. Mode of payment</h3>\n<p>All payments are to be made by NEFT, RTGS or cheque in favour of the Rippotai account printed on the invoice.<br />Cash payments, and payments made directly to any worker, supervisor or vendor at site, will not be recognised<br />against this contract.</p>\n\n\n<h3>5. Taxes</h3>\n<p>All figures are exclusive of GST. GST and any other statutory levy will be charged additionally at the rate prevailing<br />on the date of invoice.</p>\n\n\n<h3>6. Mobilisation advance</h3>\n<p>The booking and mobilisation amount is non-refundable and is adjusted against the final milestone.<br />Site mobilisation begins only after it is received in full.</p>\n\n\n<h3>7. Delay in release</h3>\n<p>If a payment is delayed beyond seven days from its due date, work at site may be paused.<br />The timeline will stand extended day for day, together with three days for remobilisation,<br />and the revised handover date will be intimated in writing.</p>\n\n\n<h3>8. Interest on overdue amounts</h3>\n<p>Any amount outstanding beyond fifteen days from its due date will attract interest at 1.5% per month<br />on the overdue amount until cleared.</p>\n\n\n<h3>9. Variations in scope</h3>\n<p>Any change in layout, specification or scope after a phase has commenced is a variation.<br />Its cost and time implication will be shared in writing and, once approved, is billed at 100% in advance<br />of procurement. Variations do not form part of the percentages set out above.</p>\n\n\n<h3>10. Client-supplied items</h3>\n<p>Items procured directly by the Client are to reach site as per the agreed schedule.<br />Delay, shortfall or damage in such items is not attributable to Rippotai and does not affect<br />a milestone that has already been achieved.</p>\n\n\n<h3>11. Retention and snag closure</h3>\n<p>The final 5% is retained until the snag list has been jointly signed off, the premises deep cleaned,<br />and keys, warranty cards, appliance manuals and as-built service drawings handed over.</p>\n\n\n<h3>12. Title of materials</h3>\n<p>Ownership of material delivered at site passes to the Client only on full payment of the corresponding milestone.</p>\n\n\n<h3>13. Suspension by the Client</h3>\n<p>If works are suspended by the Client for more than thirty days, all milestones achieved till that date become<br />immediately payable, along with the cost of material already procured, fabricated or stored for the project.</p>\n\n\n<h3>14. Post-handover defects</h3>\n<p>Issues reported after handover fall under the defect liability terms of the signed Agreement<br />and not under the snagging milestone of this schedule.</p>\n\n\n<h3>15. Circumstances beyond control</h3>\n<p>Statutory construction restrictions, labour strikes, extreme weather, transport disruption and unavailability<br />of specified material are beyond our control. Timelines extend proportionately, with prior intimation;<br />milestones already achieved remain payable.</p>\n\n\n<h3>16. Jurisdiction</h3>\n<p>Any dispute will first be attempted to be settled amicably between the parties, failing which it will be<br />subject to the exclusive jurisdiction of the courts at Delhi.</p>\n<p>The Client confirms having read and accepted the milestones, percentages and terms set out in this schedule,<br />which forms an integral part of the Plan of Action and the signed Agreement for this project.</p>\n',NULL,NULL,'2026-09-29 15:19:40'),
('90d3ea2c-bbbe-11f1-a7ce-52540021303b','4367e34a-b337-11f1-b327-52540021303b',1,'<h3>1. Scope of Work</h3>\r\n<p>The contractor shall execute the work described in this Work Order strictly in accordance with the approved drawings, specifications, BOQ, scope of work and instructions issued by Rippotai Architecture.</p>\r\n\r\n<h3>2. Workmanship & Quality</h3>\r\n<p>All work shall be carried out using good quality materials and workmanship in accordance with approved specifications and applicable standards. Any defective or unacceptable work shall be rectified by the contractor at their own cost.</p>\r\n\r\n<h3>3. Site Coordination</h3>\r\n<p>The contractor shall coordinate with the project team, site supervisor, consultants and other agencies working at the project site and shall ensure that their activities do not unnecessarily interfere with other works.</p>\r\n\r\n<h3>4. Programme & Completion</h3>\r\n<p>The contractor shall complete the work within the agreed completion period. Any anticipated delay shall be immediately communicated to the project team along with the reason and proposed recovery plan.</p>\r\n\r\n<h3>5. Safety</h3>\r\n<p>The contractor shall be responsible for maintaining safe working practices at site and shall provide appropriate safety equipment to their workers. The contractor shall comply with all applicable site safety requirements.</p>\r\n\r\n<h3>6. Labour</h3>\r\n<p>The contractor shall be responsible for the deployment, supervision and conduct of their labour and workforce. All statutory requirements relating to their workers shall be complied with by the contractor.</p>\r\n\r\n<h3>7. Materials</h3>\r\n<p>Materials supplied by the contractor shall conform to the approved specifications. No substitution of specified materials shall be made without prior written approval from the authorised project representative.</p>\r\n\r\n<h3>8. Measurement</h3>\r\n<p>Measurements shall be recorded and verified jointly wherever applicable. Payment shall be based on approved quantities, agreed rates and the applicable terms of this Work Order.</p>\r\n\r\n<h3>9. Payment</h3>\r\n<p>Payments shall be released according to the approved payment stages and subject to satisfactory completion of the relevant work, measurement verification and submission of required documents.</p>\r\n\r\n<h3>10. Defects & Rectification</h3>\r\n<p>The contractor shall rectify defects, damages or incomplete work attributable to their execution within the period specified by the project team without additional cost.</p>\r\n\r\n<h3>11. Housekeeping</h3>\r\n<p>The contractor shall maintain proper housekeeping in their work area and shall remove construction debris, waste and surplus materials as directed by the project team.</p>\r\n\r\n<h3>12. Damage to Property</h3>\r\n<p>Any damage caused to the project property, finished work, fixtures, equipment or third-party property due to the contractor or their workforce shall be repaired or compensated by the contractor.</p>\r\n\r\n<h3>13. Drawings & Instructions</h3>\r\n<p>The contractor shall execute the work based on the latest approved drawings and written instructions. The contractor shall immediately report any discrepancy or ambiguity before proceeding with the affected work.</p>\r\n\r\n<h3>14. Variations</h3>\r\n<p>No additional work or variation shall be undertaken without prior approval from the authorised representative of Rippotai Architecture. Approved variations shall be documented and valued separately where applicable.</p>\r\n\r\n<h3>15. Subcontracting</h3>\r\n<p>The contractor shall not subcontract the whole or substantial part of the assigned work without prior written approval.</p>\r\n\r\n<h3>16. Compliance</h3>\r\n<p>The contractor shall comply with applicable laws, regulations, labour requirements, safety requirements and project-specific rules.</p>\r\n\r\n<h3>17. Cancellation</h3>\r\n<p>Rippotai Architecture may suspend or cancel the Work Order in case of material breach, persistent delay, poor workmanship, non-compliance or other circumstances permitted under the agreed commercial terms.</p>\r\n\r\n<h3>18. Final Handover</h3>\r\n<p>The contractor shall complete all pending works, rectifications, cleaning and documentation required for final handover before the work is considered complete.</p>\r\n\r\n<h3>19. Acceptance</h3>\r\n<p>Commencement of work against this Work Order shall constitute acceptance of the scope, rates, programme and applicable terms unless objections are raised in writing before commencement.</p>',NULL,NULL,'2026-09-29 10:00:57'),
('90d4fdb3-bbbe-11f1-a7ce-52540021303b','83e538b3-9a0b-11f1-99c8-52540021303b',1,'<h2>Terms &amp; Conditions</h2>\r\n\r\n<h3>01 Basis of this schedule</h3>\r\n<p>\r\nThis Payment Schedule is to be read together with the Plan of Action and the signed Agreement for the project.\r\nWhere a percentage is stated, it is of the total contract value recorded above and is exclusive of GST, variations and client-supplied items.\r\n</p>\r\n\r\n<h3>02 Release before mobilisation</h3>\r\n<p>\r\nEach milestone falls due before the corresponding phase is mobilised at site. In line with the Plan of Action,\r\nmobilisation of the next phase is subject to the corresponding milestone payment being cleared.\r\n</p>\r\n\r\n<h3>03 Invoicing and due date</h3>\r\n<p>\r\nEvery milestone will be intimated in writing with a stage note and an invoice. Payment is due within three working\r\ndays of the invoice date. Work already in progress continues uninterrupted only against timely release.\r\n</p>\r\n\r\n<h3>04 Mode of payment</h3>\r\n<p>\r\nAll payments are to be made by NEFT, RTGS or cheque in favour of the Rippotai account printed on the invoice.\r\nCash payments, and payments made directly to any worker, supervisor or vendor at site, will not be recognised\r\nagainst this contract.\r\n</p>\r\n\r\n<h3>05 Taxes</h3>\r\n<p>\r\nAll figures are exclusive of GST. GST and any other statutory levy will be charged additionally at the rate prevailing\r\non the date of invoice.\r\n</p>\r\n\r\n<h3>06 Mobilisation advance</h3>\r\n<p>\r\nThe booking and mobilisation amount is non-refundable and is adjusted against the final milestone.\r\nSite mobilisation begins only after it is received in full.\r\n</p>\r\n\r\n<h3>07 Delay in release</h3>\r\n<p>\r\nIf a payment is delayed beyond seven days from its due date, work at site may be paused.\r\nThe timeline will stand extended day for day, together with three days for remobilisation,\r\nand the revised handover date will be intimated in writing.\r\n</p>\r\n\r\n<h3>08 Interest on overdue amounts</h3>\r\n<p>\r\nAny amount outstanding beyond fifteen days from its due date will attract interest at 1.5% per month\r\non the overdue amount until cleared.\r\n</p>\r\n\r\n<h3>09 Variations in scope</h3>\r\n<p>\r\nAny change in layout, specification or scope after a phase has commenced is a variation.\r\nIts cost and time implication will be shared in writing and, once approved, is billed at 100% in advance\r\nof procurement. Variations do not form part of the percentages set out above.\r\n</p>\r\n\r\n<h3>10 Client-supplied items</h3>\r\n<p>\r\nItems procured directly by the Client are to reach site as per the agreed schedule.\r\nDelay, shortfall or damage in such items is not attributable to Rippotai and does not affect\r\na milestone that has already been achieved.\r\n</p>\r\n\r\n<h3>11 Retention and snag closure</h3>\r\n<p>\r\nThe final 5% is retained until the snag list has been jointly signed off, the premises deep cleaned,\r\nand keys, warranty cards, appliance manuals and as-built service drawings handed over.\r\n</p>\r\n\r\n<h3>12 Title of materials</h3>\r\n<p>\r\nOwnership of material delivered at site passes to the Client only on full payment of the corresponding milestone.\r\n</p>\r\n\r\n<h3>13 Suspension by the Client</h3>\r\n<p>\r\nIf works are suspended by the Client for more than thirty days, all milestones achieved till that date become\r\nimmediately payable, along with the cost of material already procured, fabricated or stored for the project.\r\n</p>\r\n\r\n<h3>14 Post-handover defects</h3>\r\n<p>\r\nIssues reported after handover fall under the defect liability terms of the signed Agreement\r\nand not under the snagging milestone of this schedule.\r\n</p>\r\n\r\n<h3>15 Circumstances beyond control</h3>\r\n<p>\r\nStatutory construction restrictions, labour strikes, extreme weather, transport disruption and unavailability\r\nof specified material are beyond our control. Timelines extend proportionately, with prior intimation;\r\nmilestones already achieved remain payable.\r\n</p>\r\n\r\n<h3>16 Jurisdiction</h3>\r\n<p>\r\nAny dispute will first be attempted to be settled amicably between the parties, failing which it will be\r\nsubject to the exclusive jurisdiction of the courts at Delhi.\r\n</p>\r\n\r\n<p>\r\nThe Client confirms having read and accepted the milestones, percentages and terms set out in this schedule,\r\nwhich forms an integral part of the Plan of Action and the signed Agreement for this project.\r\n</p>',NULL,NULL,'2026-09-29 10:00:57'),
('90d5039e-bbbe-11f1-a7ce-52540021303b','9f8c2a10-4b3e-4c7a-9d21-6a1f0c3e5b71',1,'<h2>Terms & Conditions</h2>\r\n<p>This Plan of Action is prepared based on the agreed project scope, execution sequence, estimated durations, and project requirements.</p>\r\n\r\n<h3>1. Execution Schedule</h3>\r\n<p>The execution schedule and phase durations mentioned in this Plan of Action are indicative and may be adjusted based on site conditions, material availability, approvals, dependencies, and other project requirements.</p>\r\n\r\n<h3>2. Phase Dependencies</h3>\r\n<p>Individual phases may run sequentially or in parallel depending on site conditions, availability of resources, material selections, approvals, and execution requirements.</p>\r\n\r\n<h3>3. Material Selection & Approvals</h3>\r\n<p>Timely selection and approval of materials, finishes, drawings, samples, and other project requirements are necessary to maintain the proposed execution schedule.</p>\r\n\r\n<h3>4. Site Conditions</h3>\r\n<p>Actual execution timelines may vary due to existing site conditions, unforeseen circumstances, access restrictions, statutory requirements, weather conditions, or other factors beyond the reasonable control of the project team.</p>\r\n\r\n<h3>5. Client Responsibilities</h3>\r\n<p>The client shall provide timely approvals, decisions, access, information, and other requirements necessary for the execution of the works.</p>\r\n\r\n<h3>6. Changes & Variations</h3>\r\n<p>Any changes to the approved scope, design, materials, specifications, or execution requirements may affect the project schedule and shall be evaluated accordingly.</p>\r\n\r\n<h3>7. Schedule Validity</h3>\r\n<p>The durations shown in the Plan of Action represent the current planned execution schedule and may be revised as the project progresses.</p>\r\n\r\n<h3>8. General</h3>\r\n<p>This Plan of Action should be read together with the applicable project documents, approved drawings, specifications, quotations, estimates, and other agreed project documentation.</p>',NULL,NULL,'2026-09-29 10:00:57'),
('e018d499-8716-11f1-b721-52540021303b','7e21b4d0-1a9c-4f6b-8e3d-2c5f9a0b6d84',1,'<ol>\r\n        <li>All quantities are approximate and subject to site verification.</li>\r\n        <li>Rates include labour, material, tools, and equipment unless otherwise specified.</li>\r\n        <li>Any variation in scope shall be treated as extra work and charged separately.</li>\r\n        <li>Taxes, duties, and statutory charges shall be applicable as per prevailing regulations.</li>\r\n        <li>Payment shall be made as per mutually agreed payment schedule.</li>\r\n        <li>The contractor shall comply with all applicable safety standards.</li>\r\n        <li>Project completion timeline is subject to timely approvals and site availability.</li>\r\n        <li>Any discrepancy in the BOQ must be reported before execution.</li>\r\n    </ol>','Initial version',NULL,'2026-07-24 09:49:34'),
('e018dd7c-8716-11f1-b721-52540021303b','c3a58f92-6d1e-4b7a-9f0c-3e8d1a2b4c96',1,'<ol>\r\n        <li>This estimate is based on the information available at the time of preparation.</li>\r\n        <li>Prices are valid for 30 days from the date of issue.</li>\r\n        <li>Final pricing may vary based on actual site conditions and approved drawings.</li>\r\n        <li>Materials are subject to market availability.</li>\r\n        <li>Transportation, taxes, and statutory charges shall be extra unless specified.</li>\r\n        <li>Additional work requested after approval will be charged separately.</li>\r\n        <li>The estimate does not constitute a binding contract until accepted by both parties.</li>\r\n        <li>All disputes shall be subject to the jurisdiction of the project location.</li>\r\n    </ol>','Initial version',NULL,'2026-07-24 09:49:34');
/*!40000 ALTER TABLE `terms_template_versions` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `terms_templates`
--

DROP TABLE IF EXISTS `terms_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `terms_templates` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `scope` enum('GLOBAL','PROJECT','CLIENT','BOQ','ESTIMATE','PLAN_OF_ACTION') NOT NULL DEFAULT 'GLOBAL',
  `content_html` longtext NOT NULL,
  `current_version` int(11) NOT NULL DEFAULT 1,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_terms_template_scope` (`scope`),
  KEY `idx_terms_template_active` (`is_active`),
  KEY `idx_terms_template_default` (`is_default`),
  KEY `fk_terms_template_created_by` (`created_by`),
  KEY `fk_terms_template_updated_by` (`updated_by`),
  CONSTRAINT `fk_terms_template_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_terms_template_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `terms_templates`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `terms_templates` WRITE;
/*!40000 ALTER TABLE `terms_templates` DISABLE KEYS */;
INSERT INTO `terms_templates` VALUES
('4367e34a-b337-11f1-b327-52540021303b','Standard Work Order Terms & Conditions','GLOBAL','<h3>1. Scope of Work</h3>\r\n<p>The contractor shall execute the work described in this Work Order strictly in accordance with the approved drawings, specifications, BOQ, scope of work and instructions issued by Rippotai Architecture.</p>\r\n\r\n<h3>2. Workmanship & Quality</h3>\r\n<p>All work shall be carried out using good quality materials and workmanship in accordance with approved specifications and applicable standards. Any defective or unacceptable work shall be rectified by the contractor at their own cost.</p>\r\n\r\n<h3>3. Site Coordination</h3>\r\n<p>The contractor shall coordinate with the project team, site supervisor, consultants and other agencies working at the project site and shall ensure that their activities do not unnecessarily interfere with other works.</p>\r\n\r\n<h3>4. Programme & Completion</h3>\r\n<p>The contractor shall complete the work within the agreed completion period. Any anticipated delay shall be immediately communicated to the project team along with the reason and proposed recovery plan.</p>\r\n\r\n<h3>5. Safety</h3>\r\n<p>The contractor shall be responsible for maintaining safe working practices at site and shall provide appropriate safety equipment to their workers. The contractor shall comply with all applicable site safety requirements.</p>\r\n\r\n<h3>6. Labour</h3>\r\n<p>The contractor shall be responsible for the deployment, supervision and conduct of their labour and workforce. All statutory requirements relating to their workers shall be complied with by the contractor.</p>\r\n\r\n<h3>7. Materials</h3>\r\n<p>Materials supplied by the contractor shall conform to the approved specifications. No substitution of specified materials shall be made without prior written approval from the authorised project representative.</p>\r\n\r\n<h3>8. Measurement</h3>\r\n<p>Measurements shall be recorded and verified jointly wherever applicable. Payment shall be based on approved quantities, agreed rates and the applicable terms of this Work Order.</p>\r\n\r\n<h3>9. Payment</h3>\r\n<p>Payments shall be released according to the approved payment stages and subject to satisfactory completion of the relevant work, measurement verification and submission of required documents.</p>\r\n\r\n<h3>10. Defects & Rectification</h3>\r\n<p>The contractor shall rectify defects, damages or incomplete work attributable to their execution within the period specified by the project team without additional cost.</p>\r\n\r\n<h3>11. Housekeeping</h3>\r\n<p>The contractor shall maintain proper housekeeping in their work area and shall remove construction debris, waste and surplus materials as directed by the project team.</p>\r\n\r\n<h3>12. Damage to Property</h3>\r\n<p>Any damage caused to the project property, finished work, fixtures, equipment or third-party property due to the contractor or their workforce shall be repaired or compensated by the contractor.</p>\r\n\r\n<h3>13. Drawings & Instructions</h3>\r\n<p>The contractor shall execute the work based on the latest approved drawings and written instructions. The contractor shall immediately report any discrepancy or ambiguity before proceeding with the affected work.</p>\r\n\r\n<h3>14. Variations</h3>\r\n<p>No additional work or variation shall be undertaken without prior approval from the authorised representative of Rippotai Architecture. Approved variations shall be documented and valued separately where applicable.</p>\r\n\r\n<h3>15. Subcontracting</h3>\r\n<p>The contractor shall not subcontract the whole or substantial part of the assigned work without prior written approval.</p>\r\n\r\n<h3>16. Compliance</h3>\r\n<p>The contractor shall comply with applicable laws, regulations, labour requirements, safety requirements and project-specific rules.</p>\r\n\r\n<h3>17. Cancellation</h3>\r\n<p>Rippotai Architecture may suspend or cancel the Work Order in case of material breach, persistent delay, poor workmanship, non-compliance or other circumstances permitted under the agreed commercial terms.</p>\r\n\r\n<h3>18. Final Handover</h3>\r\n<p>The contractor shall complete all pending works, rectifications, cleaning and documentation required for final handover before the work is considered complete.</p>\r\n\r\n<h3>19. Acceptance</h3>\r\n<p>Commencement of work against this Work Order shall constitute acceptance of the scope, rates, programme and applicable terms unless objections are raised in writing before commencement.</p>',1,1,1,NULL,NULL,'2026-09-18 13:32:16','2026-09-18 13:32:16',NULL),
('7e21b4d0-1a9c-4f6b-8e3d-2c5f9a0b6d84','Default BOQ Terms & Conditions','BOQ','<ol>\r\n        <li>All quantities are approximate and subject to site verification.</li>\r\n        <li>Rates include labour, material, tools, and equipment unless otherwise specified.</li>\r\n        <li>Any variation in scope shall be treated as extra work and charged separately.</li>\r\n        <li>Taxes, duties, and statutory charges shall be applicable as per prevailing regulations.</li>\r\n        <li>Payment shall be made as per mutually agreed payment schedule.</li>\r\n        <li>The contractor shall comply with all applicable safety standards.</li>\r\n        <li>Project completion timeline is subject to timely approvals and site availability.</li>\r\n        <li>Any discrepancy in the BOQ must be reported before execution.</li>\r\n    </ol>',1,1,1,NULL,NULL,'2026-07-24 09:49:26','2026-08-31 17:46:40','2026-08-31 17:46:40'),
('83e538b3-9a0b-11f1-99c8-52540021303b','Payment Schedule Terms','PLAN_OF_ACTION','<h3>1. Basis of this schedule</h3>\\n<p>This Payment Schedule is to be read together with the Plan of Action and the signed Agreement for the project.<br />Where a percentage is stated, it is of the total contract value recorded above and is exclusive of GST, variations and client-supplied items.</p>\\n\\n<h3>2. Release before mobilisation</h3>\\n<p>Each milestone falls due before the corresponding phase is mobilised at site. In line with the Plan of Action,<br />mobilisation of the next phase is subject to the corresponding milestone payment being cleared.</p>\\n\\n<h3>3. Invoicing and due date</h3>\\n<p>Every milestone will be intimated in writing with a stage note and an invoice. Payment is due within three working<br />days of the invoice date. Work already in progress continues uninterrupted only against timely release.</p>\\n\\n<h3>4. Mode of payment</h3>\\n<p>All payments are to be made by NEFT, RTGS or cheque in favour of the Rippotai account printed on the invoice.<br />Cash payments, and payments made directly to any worker, supervisor or vendor at site, will not be recognised<br />against this contract.</p>\\n\\n<h3>5. Taxes</h3>\\n<p>All figures are exclusive of GST. GST and any other statutory levy will be charged additionally at the rate prevailing<br />on the date of invoice.</p>\\n\\n<h3>6. Mobilisation advance</h3>\\n<p>The booking and mobilisation amount is non-refundable and is adjusted against the final milestone.<br />Site mobilisation begins only after it is received in full.</p>\\n\\n<h3>7. Delay in release</h3>\\n<p>If a payment is delayed beyond seven days from its due date, work at site may be paused.<br />The timeline will stand extended day for day, together with three days for remobilisation,<br />and the revised handover date will be intimated in writing.</p>\\n\\n<h3>8. Interest on overdue amounts</h3>\\n<p>Any amount outstanding beyond fifteen days from its due date will attract interest at 1.5% per month<br />on the overdue amount until cleared.</p>\\n\\n<h3>9. Variations in scope</h3>\\n<p>Any change in layout, specification or scope after a phase has commenced is a variation.<br />Its cost and time implication will be shared in writing and, once approved, is billed at 100% in advance<br />of procurement. Variations do not form part of the percentages set out above.</p>\\n\\n<h3>10. Client-supplied items</h3>\\n<p>Items procured directly by the Client are to reach site as per the agreed schedule.<br />Delay, shortfall or damage in such items is not attributable to Rippotai and does not affect<br />a milestone that has already been achieved.</p>\\n\\n<h3>11. Retention and snag closure</h3>\\n<p>The final 5% is retained until the snag list has been jointly signed off, the premises deep cleaned,<br />and keys, warranty cards, appliance manuals and as-built service drawings handed over.</p>\\n\\n<h3>12. Title of materials</h3>\\n<p>Ownership of material delivered at site passes to the Client only on full payment of the corresponding milestone.</p>\\n\\n<h3>13. Suspension by the Client</h3>\\n<p>If works are suspended by the Client for more than thirty days, all milestones achieved till that date become<br />immediately payable, along with the cost of material already procured, fabricated or stored for the project.</p>\\n\\n<h3>14. Post-handover defects</h3>\\n<p>Issues reported after handover fall under the defect liability terms of the signed Agreement<br />and not under the snagging milestone of this schedule.</p>\\n\\n<h3>15. Circumstances beyond control</h3>\\n<p>Statutory construction restrictions, labour strikes, extreme weather, transport disruption and unavailability<br />of specified material are beyond our control. Timelines extend proportionately, with prior intimation;<br />milestones already achieved remain payable.</p>\\n\\n<h3>16. Jurisdiction</h3>\\n<p>Any dispute will first be attempted to be settled amicably between the parties, failing which it will be<br />subject to the exclusive jurisdiction of the courts at Delhi.</p>\\n\\n<p>The Client confirms having read and accepted the milestones, percentages and terms set out in this schedule,<br />which forms an integral part of the Plan of Action and the signed Agreement for this project.</p>',2,1,1,NULL,NULL,'2026-08-17 12:46:07','2026-09-29 15:24:05',NULL),
('9f8c2a10-4b3e-4c7a-9d21-6a1f0c3e5b71','Standard Plan of Action Terms & Conditions','PLAN_OF_ACTION','<h2>Terms & Conditions</h2>\r\n<p>This Plan of Action is prepared based on the agreed project scope, execution sequence, estimated durations, and project requirements.</p>\r\n\r\n<h3>1. Execution Schedule</h3>\r\n<p>The execution schedule and phase durations mentioned in this Plan of Action are indicative and may be adjusted based on site conditions, material availability, approvals, dependencies, and other project requirements.</p>\r\n\r\n<h3>2. Phase Dependencies</h3>\r\n<p>Individual phases may run sequentially or in parallel depending on site conditions, availability of resources, material selections, approvals, and execution requirements.</p>\r\n\r\n<h3>3. Material Selection & Approvals</h3>\r\n<p>Timely selection and approval of materials, finishes, drawings, samples, and other project requirements are necessary to maintain the proposed execution schedule.</p>\r\n\r\n<h3>4. Site Conditions</h3>\r\n<p>Actual execution timelines may vary due to existing site conditions, unforeseen circumstances, access restrictions, statutory requirements, weather conditions, or other factors beyond the reasonable control of the project team.</p>\r\n\r\n<h3>5. Client Responsibilities</h3>\r\n<p>The client shall provide timely approvals, decisions, access, information, and other requirements necessary for the execution of the works.</p>\r\n\r\n<h3>6. Changes & Variations</h3>\r\n<p>Any changes to the approved scope, design, materials, specifications, or execution requirements may affect the project schedule and shall be evaluated accordingly.</p>\r\n\r\n<h3>7. Schedule Validity</h3>\r\n<p>The durations shown in the Plan of Action represent the current planned execution schedule and may be revised as the project progresses.</p>\r\n\r\n<h3>8. General</h3>\r\n<p>This Plan of Action should be read together with the applicable project documents, approved drawings, specifications, quotations, estimates, and other agreed project documentation.</p>',1,1,1,NULL,NULL,'2026-08-14 13:08:22','2026-08-14 13:36:58',NULL),
('c3a58f92-6d1e-4b7a-9f0c-3e8d1a2b4c96','Default Estimate Terms & Conditions','ESTIMATE','<ol>\r\n        <li>This estimate is based on the information available at the time of preparation.</li>\r\n        <li>Prices are valid for 30 days from the date of issue.</li>\r\n        <li>Final pricing may vary based on actual site conditions and approved drawings.</li>\r\n        <li>Materials are subject to market availability.</li>\r\n        <li>Transportation, taxes, and statutory charges shall be extra unless specified.</li>\r\n        <li>Additional work requested after approval will be charged separately.</li>\r\n        <li>The estimate does not constitute a binding contract until accepted by both parties.</li>\r\n        <li>All disputes shall be subject to the jurisdiction of the project location.</li>\r\n    </ol>',1,1,1,NULL,NULL,'2026-07-24 09:49:26','2026-08-31 17:46:44','2026-08-31 17:46:44');
/*!40000 ALTER TABLE `terms_templates` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `units`
--

DROP TABLE IF EXISTS `units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `units` (
  `id` char(36) NOT NULL,
  `name` varchar(50) NOT NULL,
  `code` varchar(20) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_units_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `units`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `units` WRITE;
/*!40000 ALTER TABLE `units` DISABLE KEYS */;
INSERT INTO `units` VALUES
('0bde830f-194e-4ff2-90ef-76a9b7c9435b','Pascal','ps',NULL,1,'2026-07-20 17:14:48','2026-07-20 17:14:48'),
('1a520798-e982-463d-a969-6646c24d2be0','Cubic Feet','CFT.',NULL,1,'2026-07-23 17:04:07','2026-07-23 17:04:07'),
('328f54cc-e46f-4c9f-a8ea-04a4376bd563','CBM','CBM',NULL,1,'2026-07-23 16:19:04','2026-07-23 16:19:04'),
('bb27df14-910d-4f81-a663-006a2d254c0f','Lumsum','L.S',NULL,1,'2026-07-23 17:11:34','2026-07-23 17:11:34'),
('bd2e16ef-6e09-40b3-b9cc-d304d9ac4f1a','MT','MT',NULL,1,'2026-07-23 17:08:21','2026-07-23 17:08:21'),
('c7409da9-746e-11f1-8bb6-52540021303b','Number','Nos','Pieces / Countable items',1,'2026-06-30 16:00:56','2026-06-30 16:00:56'),
('c740a20b-746e-11f1-8bb6-52540021303b','Kilogram','Kg','Weight measurement',1,'2026-06-30 16:00:56','2026-06-30 16:00:56'),
('c740a386-746e-11f1-8bb6-52540021303b','Gram','Gm','Small weight unit',1,'2026-06-30 16:00:56','2026-06-30 16:00:56'),
('c740a403-746e-11f1-8bb6-52540021303b','Meter','Mtr','Length measurement',1,'2026-06-30 16:00:56','2026-06-30 16:00:56'),
('c740a478-746e-11f1-8bb6-52540021303b','Square Meter','SqM','Area measurement',1,'2026-06-30 16:00:56','2026-06-30 16:00:56'),
('c740a4fb-746e-11f1-8bb6-52540021303b','Cubic Meter','CuM','Volume measurement',1,'2026-06-30 16:00:56','2026-06-30 16:00:56'),
('c740a56d-746e-11f1-8bb6-52540021303b','Liter','Ltr','Liquid volume',1,'2026-06-30 16:00:56','2026-06-30 16:00:56'),
('c740a5d1-746e-11f1-8bb6-52540021303b','Feet','Ft','Imperial length unit',1,'2026-06-30 16:00:56','2026-06-30 16:00:56'),
('c740a643-746e-11f1-8bb6-52540021303b','Hour','Hr','Time-based work unit',1,'2026-06-30 16:00:56','2026-06-30 16:00:56'),
('c740a6a9-746e-11f1-8bb6-52540021303b','Day','Day','Daily labour/work unit',1,'2026-06-30 16:00:56','2026-06-30 16:00:56'),
('c740a70d-746e-11f1-8bb6-52540021303b','Kilometer','Km','Long distance measurement',1,'2026-06-30 16:00:56','2026-06-30 16:00:56'),
('c740a76c-746e-11f1-8bb6-52540021303b','Bundle','Bdl','Grouped items',1,'2026-06-30 16:00:56','2026-06-30 16:00:56'),
('c740a7cc-746e-11f1-8bb6-52540021303b','Box','Box','Packaged items',1,'2026-06-30 16:00:56','2026-06-30 16:00:56'),
('c740a828-746e-11f1-8bb6-52540021303b','Bag','Bag','Material packaging unit',1,'2026-06-30 16:00:56','2026-06-30 16:00:56'),
('cf4d3bfc-fdaa-4a30-934b-1654b1bcbaad','Square feet','SQFT',NULL,1,'2026-07-23 16:31:01','2026-07-23 16:31:01');
/*!40000 ALTER TABLE `units` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `user_dashboard_layouts`
--

DROP TABLE IF EXISTS `user_dashboard_layouts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_dashboard_layouts` (
  `user_id` char(36) NOT NULL,
  `app_key` varchar(64) NOT NULL,
  `layout` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`layout`)),
  `hidden_keys` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`hidden_keys`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`user_id`,`app_key`),
  CONSTRAINT `fk_dashboard_layout_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_dashboard_layouts`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `user_dashboard_layouts` WRITE;
/*!40000 ALTER TABLE `user_dashboard_layouts` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_dashboard_layouts` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `user_signatures`
--

DROP TABLE IF EXISTS `user_signatures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_signatures` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `signature_url` varchar(500) DEFAULT NULL,
  `signature_file_name` varchar(255) DEFAULT NULL,
  `signature_file_type` varchar(100) DEFAULT NULL,
  `signature_file_size` bigint(20) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_user_signature` (`user_id`),
  KEY `idx_signature_user` (`user_id`),
  KEY `idx_signature_created_by` (`created_by`),
  CONSTRAINT `fk_signature_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_signature_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_signatures`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `user_signatures` WRITE;
/*!40000 ALTER TABLE `user_signatures` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_signatures` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `job_title` varchar(150) DEFAULT NULL,
  `avatar_url` text DEFAULT NULL,
  `role_id` char(36) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `email_verified_at` datetime DEFAULT NULL,
  `email_verified_address` varchar(255) DEFAULT NULL,
  `pending_email` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `created_by` (`created_by`),
  KEY `idx_users_email` (`email`),
  KEY `idx_users_role` (`role_id`),
  KEY `idx_users_is_active` (`is_active`),
  CONSTRAINT `users_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
('c4af5469-bbd1-11f1-9c80-02fc00000001','Ajay Chhabra','ajay@rocklime.com','$2b$10$P0auA2spAYLpO7lv8Ha7UOQtMxT8g00Ghhyxn62iWjHYfuqzMzAc2',NULL,'Founder',NULL,'90e34b7b-7123-11f1-8bb6-52540021303b',1,'2026-10-29 19:53:53',NULL,'2026-10-29 13:01:15','2026-10-29 19:53:53','2026-10-29 18:31:15','ajay@rocklime.com',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `vendor_business_types`
--

DROP TABLE IF EXISTS `vendor_business_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendor_business_types` (
  `id` char(36) NOT NULL,
  `category_id` char(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_category_business` (`category_id`,`name`),
  CONSTRAINT `fk_vendor_business_category` FOREIGN KEY (`category_id`) REFERENCES `vendor_categories` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendor_business_types`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `vendor_business_types` WRITE;
/*!40000 ALTER TABLE `vendor_business_types` DISABLE KEYS */;
INSERT INTO `vendor_business_types` VALUES
('01deb2c1-da81-44a2-b223-37b700803dd7','b260aa81-7134-11f1-8bb6-52540021303b','cctv camera',1,'2026-07-01 05:14:03','2026-07-01 05:14:03'),
('038225dd-1f0b-48b9-99f7-08d47365c4e1','b260aa81-7134-11f1-8bb6-52540021303b','Boards',1,'2026-07-01 05:14:03','2026-07-01 05:14:03'),
('04d54824-48e3-45b1-aa24-4f625a94fdb4','b260aa81-7134-11f1-8bb6-52540021303b','home decor items',1,'2026-07-01 05:14:03','2026-07-01 05:14:03'),
('08efd6d0-7aba-43d0-a16c-a8b416aadfdd','b260aa81-7134-11f1-8bb6-52540021303b','WPC Door, PVC Sheet, Modular Kitchen Indore Maica Plastiwood & Group',1,'2026-07-01 05:14:03','2026-07-01 05:14:03'),
('09768620-32e2-4ed5-9948-3101023ec746','b260aa81-7134-11f1-8bb6-52540021303b','Adhesive',1,'2026-07-01 05:14:03','2026-07-01 05:14:03'),
('112b7e09-74b8-4c1b-bde6-e3c860faed23','b260aa81-7134-11f1-8bb6-52540021303b','SP FITTINGS',1,'2026-07-01 05:14:03','2026-07-01 05:14:03'),
('13d31a93-70ca-45a6-b073-32eb79ee57ca','b260aa81-7134-11f1-8bb6-52540021303b','Rodi,Dust,Rait,Bricks & Cement',1,'2026-07-01 05:14:03','2026-07-01 05:14:03'),
('15a69e2e-7257-4d6f-9344-b254882c618a','b260aff1-7134-11f1-8bb6-52540021303b','PLUMBING',1,'2026-07-01 07:40:48','2026-07-01 07:40:48'),
('15a8cb27-f2a0-42c6-b832-34fcd94468ea','b260aa81-7134-11f1-8bb6-52540021303b','Kajaria And Other Tiles',1,'2026-07-01 05:14:03','2026-07-01 05:14:03'),
('29bc6b4d-40ee-4bda-b3f5-5785793e7aa7','b260aa81-7134-11f1-8bb6-52540021303b','Elctrical supply',1,'2026-07-01 05:14:03','2026-07-01 05:14:03'),
('2cf55b02-8372-4c1f-ae7c-af13077ffc93','b260aa81-7134-11f1-8bb6-52540021303b','Fusion of Light and Design',1,'2026-07-01 05:14:03','2026-07-01 05:14:03'),
('2d805721-eb85-45ca-b30d-cbd0dfc6605c','b260aa81-7134-11f1-8bb6-52540021303b','Paints',1,'2026-07-01 05:14:03','2026-07-01 05:14:03'),
('3c26cb79-6a7d-4290-8065-5d6626d8966f','b260aa81-7134-11f1-8bb6-52540021303b','Lights',1,'2026-07-01 05:14:03','2026-07-01 05:14:03'),
('40e58e78-6eb9-4fd3-a427-47b62a8d2e49','b260aff1-7134-11f1-8bb6-52540021303b','POP',1,'2026-07-01 07:40:48','2026-07-01 07:40:48'),
('440237fb-5886-41a6-9943-075e68006357','b260aa81-7134-11f1-8bb6-52540021303b','Mattress',1,'2026-07-01 05:14:03','2026-07-01 05:14:03'),
('471eb735-1648-4a95-be2e-214d5cec78af','b260aff1-7134-11f1-8bb6-52540021303b','CCTV',1,'2026-07-01 07:40:48','2026-07-01 07:40:48'),
('491bb6d6-f210-4951-bd31-331456e0f870','b260aff1-7134-11f1-8bb6-52540021303b','ELECTRICIAN',1,'2026-07-01 07:40:48','2026-07-01 07:40:48'),
('52ec4bd4-6a5b-43d8-bcba-ad47ad02cc1b','b260aff1-7134-11f1-8bb6-52540021303b','CIVIL',1,'2026-07-01 07:40:48','2026-07-01 07:40:48'),
('530dab08-ff5c-49a0-a35a-f96e1a76f533','b260aa81-7134-11f1-8bb6-52540021303b','Electrical supply',1,'2026-07-01 05:14:03','2026-07-01 05:14:03'),
('59c2c964-588a-41ab-a7ff-18a216f48371','b260aa81-7134-11f1-8bb6-52540021303b','Accessories',1,'2026-07-01 05:14:03','2026-07-01 05:14:03'),
('5cd981a7-1d17-4898-b0fc-25139152ea50','b260aa81-7134-11f1-8bb6-52540021303b','Marble',1,'2026-07-01 05:14:03','2026-07-01 05:14:03'),
('6468bf21-5335-4e9e-a319-447252b043ec','b260aa81-7134-11f1-8bb6-52540021303b','Tape',1,'2026-07-01 05:14:03','2026-07-01 05:14:03'),
('66c92b56-80c5-43a0-bd8d-e1e42fd64f12','b260aa81-7134-11f1-8bb6-52540021303b','Plumbing Material',1,'2026-07-01 05:14:03','2026-07-01 05:14:03'),
('6d4f49eb-138f-4ad0-ae24-0578b4025350','b260aa81-7134-11f1-8bb6-52540021303b','Ceramic Tiles Designer Vanity Besin C.P Fitting Bathroom Fitting',1,'2026-07-01 05:14:03','2026-07-01 05:14:03'),
('6e3347a8-1caa-42db-96be-7b01d0216cf9','b260aa81-7134-11f1-8bb6-52540021303b','Fire Fighting Gases',1,'2026-07-01 05:14:03','2026-07-01 05:14:03'),
('73862e3a-c354-496a-8761-19b952688501','b260aa81-7134-11f1-8bb6-52540021303b','Lighting - Decor - Furniture',1,'2026-07-01 05:14:03','2026-07-01 05:14:03'),
('7bb1f9fb-7df9-4815-b1b2-e45c5f626646','b260aff1-7134-11f1-8bb6-52540021303b','CARPENTER',1,'2026-07-01 07:40:48','2026-07-01 07:40:48'),
('86c4b5e2-ceb1-4d67-926c-7824c7005a6a','b260aa81-7134-11f1-8bb6-52540021303b','Tiles',1,'2026-07-01 05:14:03','2026-07-01 05:14:03'),
('95073fe2-8795-46a9-a5f6-b733713e4f74','b260aff1-7134-11f1-8bb6-52540021303b','METAL',1,'2026-07-01 07:40:48','2026-07-01 07:40:48'),
('9653d801-be17-427f-962a-7ea89c50b43c','b260aff1-7134-11f1-8bb6-52540021303b','PAINTER',1,'2026-07-01 07:40:48','2026-07-01 07:40:48'),
('a2955f6e-401b-4606-81d2-8c38748eaa9c','b260aa81-7134-11f1-8bb6-52540021303b','CERAMIC',1,'2026-07-01 05:14:03','2026-07-01 05:14:03'),
('aaae0390-32be-4722-9ecd-36a1e6c31437','b260aa81-7134-11f1-8bb6-52540021303b','Floor Drain',1,'2026-07-01 05:14:03','2026-07-01 05:14:03'),
('ad976bd5-024d-46a4-bbec-a7c8a8ffc0ae','b260aa81-7134-11f1-8bb6-52540021303b','Woods.ply.FlushDoor.Board.Vineer.Margins',1,'2026-07-01 05:14:03','2026-07-01 05:14:03'),
('b2613f10-3e67-490c-82c0-d5a115d995f9','b260aa81-7134-11f1-8bb6-52540021303b','Bath Faucets',1,'2026-07-01 05:14:03','2026-07-01 05:14:03'),
('b678e480-020d-4f96-baf6-c644f0880846','b260aa81-7134-11f1-8bb6-52540021303b','TIMBER & PLYWOOD',1,'2026-07-01 05:14:03','2026-07-01 05:14:03'),
('bbe1720d-a55b-4e0a-bbaf-9c4ddeddb941','b260aa81-7134-11f1-8bb6-52540021303b','WELDING MACHINE',1,'2026-07-01 05:14:03','2026-07-01 05:14:03'),
('c05f86d2-cefa-4637-a141-0072fab88d95','b260aff1-7134-11f1-8bb6-52540021303b','GRINDING',1,'2026-07-01 07:40:48','2026-07-01 07:40:48'),
('c3fd87fd-782d-4af5-ba2f-5ff49074f5bc','b260aff1-7134-11f1-8bb6-52540021303b','new',1,'2026-07-14 11:35:06','2026-07-14 11:35:06'),
('d8a416a3-170a-4108-b9fb-1474bcc81827','b260aa81-7134-11f1-8bb6-52540021303b','Laminates',1,'2026-07-01 05:14:03','2026-07-01 05:14:03'),
('db44a2ee-dc91-41b8-84da-630721e425c5','b260aa81-7134-11f1-8bb6-52540021303b','light',1,'2026-07-01 05:14:03','2026-07-01 05:14:03'),
('de09d796-44d0-4c51-9909-fd3f9d8b7b66','b260aa81-7134-11f1-8bb6-52540021303b','Chemical manufacturer in New Delhi',1,'2026-07-01 05:14:03','2026-07-01 05:14:03'),
('e0561222-1f2e-43a1-b4ce-6adf40db40b5','b260aa81-7134-11f1-8bb6-52540021303b','Steel Kitchen Sinks',1,'2026-07-01 05:14:03','2026-07-01 05:14:03'),
('e2847cac-4883-4846-8409-b35a97ddf50e','b260aa81-7134-11f1-8bb6-52540021303b','Hardware',1,'2026-07-01 05:14:03','2026-07-01 05:14:03'),
('e3a56191-4983-4864-a908-b686a5a9e599','b260aa81-7134-11f1-8bb6-52540021303b','Tile Collections',1,'2026-07-01 05:14:03','2026-07-01 05:14:03'),
('eb1979d0-d106-4aba-b523-f4a89745d01c','b260aa81-7134-11f1-8bb6-52540021303b','TIMBER PLYWOOD VENEERS LAMINATES DOORS',1,'2026-07-01 05:14:03','2026-07-01 05:14:03'),
('eca4c5ea-0421-4b66-80cc-bf8f1af9b14f','b260aff1-7134-11f1-8bb6-52540021303b','GLASS',1,'2026-07-01 07:40:48','2026-07-01 07:40:48'),
('f9c7cc3b-feee-412d-8caa-84af596a1dcb','b260aff1-7134-11f1-8bb6-52540021303b','MEP CONST.',1,'2026-07-01 07:40:48','2026-07-01 07:40:48'),
('fa252b52-5015-4f97-92c2-e90240faba89','b260aff1-7134-11f1-8bb6-52540021303b','INTERIOR',1,'2026-07-01 07:40:48','2026-07-01 07:40:48'),
('fde68222-cd7e-41ef-bb0d-b2c7eec409d6','b260aa81-7134-11f1-8bb6-52540021303b','WALL COVERINGS WALLPAPERS I WALL DECALS I WALL ARTS I EMBROIDERED WALL ARTS',1,'2026-07-01 05:14:03','2026-07-01 05:14:03');
/*!40000 ALTER TABLE `vendor_business_types` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `vendor_categories`
--

DROP TABLE IF EXISTS `vendor_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendor_categories` (
  `id` char(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendor_categories`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `vendor_categories` WRITE;
/*!40000 ALTER TABLE `vendor_categories` DISABLE KEYS */;
INSERT INTO `vendor_categories` VALUES
('b260aa81-7134-11f1-8bb6-52540021303b','Material',1,'2026-06-26 13:27:37','2026-06-26 13:27:37'),
('b260aff1-7134-11f1-8bb6-52540021303b','Contractor',1,'2026-06-26 13:27:37','2026-06-26 13:27:37');
/*!40000 ALTER TABLE `vendor_categories` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `vendor_rate_comparisons`
--

DROP TABLE IF EXISTS `vendor_rate_comparisons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendor_rate_comparisons` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `project_id` char(36) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `boq_id` char(36) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `notes` text DEFAULT NULL,
  `snapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`snapshot`)),
  `revision` int(11) NOT NULL DEFAULT 1,
  `created_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_rate_comparison_project` (`project_id`),
  KEY `idx_rate_comparison_boq` (`boq_id`),
  KEY `idx_rate_comparison_updated` (`updated_at`),
  CONSTRAINT `fk_rate_comparison_boq` FOREIGN KEY (`boq_id`) REFERENCES `boqs` (`id`),
  CONSTRAINT `fk_rate_comparison_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendor_rate_comparisons`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `vendor_rate_comparisons` WRITE;
/*!40000 ALTER TABLE `vendor_rate_comparisons` DISABLE KEYS */;
/*!40000 ALTER TABLE `vendor_rate_comparisons` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `vendors`
--

DROP TABLE IF EXISTS `vendors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendors` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `vendor_category_id` char(36) DEFAULT NULL,
  `business_type_id` char(36) DEFAULT NULL,
  `contact_number` varchar(20) NOT NULL,
  `alternate_contact` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('active','inactive','blacklisted','blocked') NOT NULL DEFAULT 'active',
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendors`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `vendors` WRITE;
/*!40000 ALTER TABLE `vendors` DISABLE KEYS */;
/*!40000 ALTER TABLE `vendors` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `verification_tokens`
--

DROP TABLE IF EXISTS `verification_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `verification_tokens` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `token` varchar(255) NOT NULL,
  `type` enum('email_verification','password_reset') NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `email` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `verification_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `verification_tokens`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `verification_tokens` WRITE;
/*!40000 ALTER TABLE `verification_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `verification_tokens` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `visit_assignments`
--

DROP TABLE IF EXISTS `visit_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `visit_assignments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` char(36) NOT NULL,
  `visitor_type` enum('INTERNAL','EXTERNAL') NOT NULL,
  `team_id` int(11) DEFAULT NULL,
  `external_party_name` varchar(150) DEFAULT NULL,
  `frequency` enum('DAILY','WEEKLY','FIXED_SCHEDULE','AD_HOC') DEFAULT NULL,
  `schedule_days` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`schedule_days`)),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `stage_id` char(36) DEFAULT NULL,
  `scheduled_date` date DEFAULT NULL,
  `stage_name` varchar(255) DEFAULT NULL,
  `checks_purpose` text DEFAULT NULL,
  `visit_type` varchar(40) DEFAULT NULL,
  `purpose` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_visit_assignments_project_id` (`project_id`),
  KEY `idx_visit_assignments_team_id` (`team_id`),
  KEY `idx_visit_assignments_is_active` (`is_active`),
  KEY `visit_assignments_project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visit_assignments`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `visit_assignments` WRITE;
/*!40000 ALTER TABLE `visit_assignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `visit_assignments` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `work_order_items`
--

DROP TABLE IF EXISTS `work_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_order_items` (
  `id` char(36) NOT NULL,
  `work_order_id` char(36) NOT NULL,
  `sort_order` int(11) NOT NULL,
  `item_type` enum('SERVICE','DELIVERABLE') NOT NULL DEFAULT 'SERVICE',
  `description` text NOT NULL,
  `quantity` decimal(15,3) NOT NULL DEFAULT 0.000,
  `unit_id` char(36) NOT NULL,
  `rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `remarks` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_work_order_items_work_order_id` (`work_order_id`),
  KEY `idx_work_order_items_sort_order` (`work_order_id`,`sort_order`),
  KEY `idx_work_order_items_unit_id` (`unit_id`) USING BTREE,
  CONSTRAINT `fk_work_order_items_unit` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_work_order_items_work_order` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `work_order_items`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `work_order_items` WRITE;
/*!40000 ALTER TABLE `work_order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `work_order_items` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `work_order_payment_stages`
--

DROP TABLE IF EXISTS `work_order_payment_stages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_order_payment_stages` (
  `id` char(36) NOT NULL,
  `work_order_id` char(36) NOT NULL,
  `sort_order` int(11) NOT NULL,
  `stage_name` varchar(255) NOT NULL,
  `due_date` date DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `paid_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `status` enum('PENDING','DUE','PARTIALLY_PAID','PAID','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `remarks` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_work_order_payment_stages_work_order_id` (`work_order_id`),
  KEY `idx_work_order_payment_stages_sort_order` (`work_order_id`,`sort_order`),
  KEY `idx_work_order_payment_stages_status` (`status`),
  CONSTRAINT `fk_work_order_payment_stages_work_order` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `work_order_payment_stages`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `work_order_payment_stages` WRITE;
/*!40000 ALTER TABLE `work_order_payment_stages` DISABLE KEYS */;
/*!40000 ALTER TABLE `work_order_payment_stages` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `work_order_terms`
--

DROP TABLE IF EXISTS `work_order_terms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_order_terms` (
  `id` char(36) NOT NULL,
  `work_order_id` char(36) NOT NULL,
  `terms_template_id` char(36) DEFAULT NULL,
  `sort_order` int(11) NOT NULL,
  `description` text NOT NULL,
  `is_mandatory` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_work_order_terms_work_order_id` (`work_order_id`),
  KEY `idx_work_order_terms_sort_order` (`work_order_id`,`sort_order`),
  KEY `idx_work_order_terms_terms_template_id` (`terms_template_id`) USING BTREE,
  CONSTRAINT `fk_work_order_terms_terms_template` FOREIGN KEY (`terms_template_id`) REFERENCES `terms_templates` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_work_order_terms_work_order` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `work_order_terms`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `work_order_terms` WRITE;
/*!40000 ALTER TABLE `work_order_terms` DISABLE KEYS */;
/*!40000 ALTER TABLE `work_order_terms` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `work_orders`
--

DROP TABLE IF EXISTS `work_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_orders` (
  `id` char(36) NOT NULL,
  `wo_id` varchar(50) NOT NULL,
  `work_order_date` date NOT NULL,
  `target_completion_date` date DEFAULT NULL,
  `status` enum('DRAFT','PENDING_APPROVAL','APPROVED','ISSUED','ACKNOWLEDGED','IN_PROGRESS','COMPLETED','CANCELLED','CLOSED') NOT NULL DEFAULT 'DRAFT',
  `project_id` char(36) NOT NULL,
  `vendor_id` char(36) NOT NULL,
  `contractor_name` varchar(255) DEFAULT NULL,
  `contractor_company_name` varchar(255) DEFAULT NULL,
  `contractor_position` varchar(255) DEFAULT NULL,
  `contractor_phone` varchar(20) DEFAULT NULL,
  `contractor_email` varchar(255) DEFAULT NULL,
  `contractor_address` text DEFAULT NULL,
  `contractor_gstin` varchar(20) DEFAULT NULL,
  `contractor_pan` varchar(20) DEFAULT NULL,
  `agency` varchar(255) DEFAULT NULL,
  `project_name` varchar(255) DEFAULT NULL,
  `site_address` text DEFAULT NULL,
  `site_contact_person` varchar(255) DEFAULT NULL,
  `site_lead` varchar(255) DEFAULT NULL,
  `site_phone` varchar(20) DEFAULT NULL,
  `site_email` varchar(255) DEFAULT NULL,
  `site_gstin` varchar(20) DEFAULT NULL,
  `working_hours` varchar(100) DEFAULT NULL,
  `subtotal` decimal(15,2) NOT NULL DEFAULT 0.00,
  `discount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `gst_percentage` decimal(5,2) NOT NULL DEFAULT 0.00,
  `gst_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `cartage` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `payment_terms` text DEFAULT NULL,
  `contractor_signatory_name` varchar(255) DEFAULT NULL,
  `rippotai_signatory_name` varchar(255) DEFAULT NULL,
  `contractor_signed_at` datetime DEFAULT NULL,
  `rippotai_signed_at` datetime DEFAULT NULL,
  `contractor_signature_url` text DEFAULT NULL,
  `rippotai_signature_url` text DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_work_orders_wo_id` (`wo_id`),
  KEY `idx_work_orders_project_id` (`project_id`),
  KEY `idx_work_orders_vendor_id` (`vendor_id`),
  KEY `idx_work_orders_status` (`status`),
  KEY `idx_work_orders_created_by` (`created_by`),
  KEY `idx_work_orders_updated_by` (`updated_by`),
  CONSTRAINT `fk_work_orders_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_work_orders_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_work_orders_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_work_orders_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `work_orders`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `work_orders` WRITE;
/*!40000 ALTER TABLE `work_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `work_orders` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `zoho_tokens`
--

DROP TABLE IF EXISTS `zoho_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `zoho_tokens` (
  `id` char(36) NOT NULL,
  `userId` char(36) NOT NULL,
  `accessToken` text NOT NULL,
  `refreshToken` text DEFAULT NULL,
  `scope` text DEFAULT NULL,
  `apiDomain` varchar(255) DEFAULT NULL,
  `expiresAt` datetime NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `zoho_tokens_userId_unique` (`userId`),
  CONSTRAINT `fk_zoho_tokens_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `zoho_tokens`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `zoho_tokens` WRITE;
/*!40000 ALTER TABLE `zoho_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `zoho_tokens` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-10-31  8:21:45
