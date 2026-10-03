-- Automation engine (rules / runs / escalations / audit) and client magic links.
-- Idempotent: safe to re-run.
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS automation_rules (
  id CHAR(36) NOT NULL PRIMARY KEY,
  code VARCHAR(60) NOT NULL,
  name VARCHAR(160) NOT NULL,
  description TEXT NULL,
  phase VARCHAR(60) NULL,
  trigger_type VARCHAR(60) NOT NULL,
  trigger_json LONGTEXT NULL COMMENT '{ params: { graceDays, days, cooldownHours } }',
  conditions_json LONGTEXT NULL COMMENT '[{ field, operator, value }] — all must match',
  actions_json LONGTEXT NULL COMMENT '[{ type: NOTIFY|TASK|ESCALATE, recipient, title, message, priority, dueInDays }]',
  project_types LONGTEXT NULL,
  status ENUM('ACTIVE','DRAFT','DISABLED') NOT NULL DEFAULT 'DRAFT',
  last_run_at DATETIME NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT current_timestamp(),
  updated_at DATETIME NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  UNIQUE KEY uq_automation_rules_code (code),
  KEY ix_automation_rules_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS automation_runs (
  id CHAR(36) NOT NULL PRIMARY KEY,
  seq INT NOT NULL AUTO_INCREMENT,
  rule_id CHAR(36) NULL,
  rule_name VARCHAR(160) NULL,
  trigger_type VARCHAR(60) NULL,
  source ENUM('manual','schedule','event','test') NOT NULL DEFAULT 'manual',
  project_id CHAR(36) NULL,
  entity_type VARCHAR(40) NULL,
  entity_id VARCHAR(64) NULL,
  entity_label VARCHAR(255) NULL,
  status ENUM('SUCCESS','FAILED','SKIPPED') NOT NULL,
  duration_ms INT NULL,
  payload_json LONGTEXT NULL,
  conditions_json LONGTEXT NULL,
  actions_json LONGTEXT NULL,
  error TEXT NULL,
  triggered_by CHAR(36) NULL,
  started_at DATETIME(3) NOT NULL,
  completed_at DATETIME(3) NULL,
  UNIQUE KEY uq_automation_runs_seq (seq),
  KEY ix_automation_runs_rule_entity (rule_id, entity_type, entity_id, started_at),
  KEY ix_automation_runs_started (started_at),
  CONSTRAINT fk_automation_runs_rule FOREIGN KEY (rule_id) REFERENCES automation_rules(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS automation_escalations (
  id CHAR(36) NOT NULL PRIMARY KEY,
  rule_id CHAR(36) NULL,
  run_id CHAR(36) NULL,
  project_id CHAR(36) NULL,
  entity_type VARCHAR(40) NULL,
  entity_id VARCHAR(64) NULL,
  title VARCHAR(255) NOT NULL,
  details TEXT NULL,
  priority ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  level INT NOT NULL DEFAULT 1,
  assigned_to CHAR(36) NULL,
  assigned_role VARCHAR(80) NULL,
  status ENUM('OPEN','ACKNOWLEDGED','RESOLVED') NOT NULL DEFAULT 'OPEN',
  resolution_notes TEXT NULL,
  opened_at DATETIME NOT NULL DEFAULT current_timestamp(),
  acknowledged_at DATETIME NULL,
  resolved_at DATETIME NULL,
  resolved_by CHAR(36) NULL,
  updated_at DATETIME NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  KEY ix_automation_escalations_status (status),
  KEY ix_automation_escalations_entity (rule_id, entity_type, entity_id),
  CONSTRAINT fk_automation_escalations_rule FOREIGN KEY (rule_id) REFERENCES automation_rules(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS automation_audit_logs (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NULL,
  user_name VARCHAR(255) NULL,
  action VARCHAR(40) NOT NULL,
  rule_id CHAR(36) NULL,
  target VARCHAR(160) NULL,
  description TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT current_timestamp(),
  KEY ix_automation_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Client magic links ("Share with client", handover delivery). Only the SHA-256 of the token is stored.
CREATE TABLE IF NOT EXISTS client_links (
  id CHAR(36) NOT NULL PRIMARY KEY,
  token_hash CHAR(64) NOT NULL,
  token_hint VARCHAR(12) NULL,
  project_id CHAR(36) NOT NULL,
  purpose ENUM('project_view','boq_approval','quotation_selection','handover_acceptance') NOT NULL DEFAULT 'project_view',
  target_id CHAR(36) NULL,
  client_name VARCHAR(255) NULL,
  client_email VARCHAR(255) NULL,
  options_json LONGTEXT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  revoked_by CHAR(36) NULL,
  last_opened_at DATETIME NULL,
  open_count INT NOT NULL DEFAULT 0,
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT current_timestamp(),
  UNIQUE KEY uq_client_links_token (token_hash),
  KEY ix_client_links_project (project_id),
  KEY ix_client_links_email (client_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- What clients did through a link: BOQ approvals/change requests, vendor selection, handover acceptance, snags.
CREATE TABLE IF NOT EXISTS client_link_responses (
  id CHAR(36) NOT NULL PRIMARY KEY,
  link_id CHAR(36) NOT NULL,
  project_id CHAR(36) NOT NULL,
  kind ENUM('boq_approved','boq_changes_requested','quotation_selected','handover_accepted','snag_reported') NOT NULL,
  target_id CHAR(36) NULL,
  signatory_name VARCHAR(255) NULL,
  signatory_email VARCHAR(255) NULL,
  comments TEXT NULL,
  data_json LONGTEXT NULL,
  signature_png LONGTEXT NULL,
  created_at DATETIME NOT NULL DEFAULT current_timestamp(),
  KEY ix_client_link_responses_project (project_id, kind),
  CONSTRAINT fk_client_link_responses_link FOREIGN KEY (link_id) REFERENCES client_links(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Handover package bookkeeping (prepared ZIP + delivery).
CREATE TABLE IF NOT EXISTS handover_packages (
  id CHAR(36) NOT NULL PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  url VARCHAR(1000) NULL,
  size BIGINT NULL,
  manifest_json LONGTEXT NULL,
  link_id CHAR(36) NULL,
  delivered_at DATETIME NULL,
  prepared_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT current_timestamp(),
  KEY ix_handover_packages_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
