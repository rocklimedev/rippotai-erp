-- CRM pipeline on INOS data (Bigin-style deals). Idempotent (MariaDB).
ALTER TABLE leads
  MODIFY phone varchar(255) NULL,
  ADD COLUMN IF NOT EXISTS deal_name varchar(255) NULL AFTER name,
  ADD COLUMN IF NOT EXISTS company varchar(255) NULL AFTER deal_name,
  ADD COLUMN IF NOT EXISTS client_id char(36) NULL AFTER company,
  ADD COLUMN IF NOT EXISTS project_id char(36) NULL AFTER client_id,
  ADD COLUMN IF NOT EXISTS amount decimal(15,2) NULL AFTER budget,
  ADD COLUMN IF NOT EXISTS expected_close date NULL AFTER amount,
  ADD COLUMN IF NOT EXISTS owner_id char(36) NULL AFTER owner,
  ADD COLUMN IF NOT EXISTS lost_reason varchar(500) NULL,
  ADD COLUMN IF NOT EXISTS closed_at datetime NULL,
  ADD COLUMN IF NOT EXISTS zoho_id varchar(64) NULL,
  ADD COLUMN IF NOT EXISTS description text NULL;
CREATE INDEX IF NOT EXISTS idx_leads_client ON leads (client_id);
CREATE INDEX IF NOT EXISTS idx_leads_zoho ON leads (zoho_id);

ALTER TABLE lead_activity
  ADD COLUMN IF NOT EXISTS kind varchar(32) NOT NULL DEFAULT 'update' AFTER lead_id,
  ADD COLUMN IF NOT EXISTS author varchar(255) NULL AFTER kind;

CREATE TABLE IF NOT EXISTS lead_tasks (
  id char(36) NOT NULL PRIMARY KEY,
  lead_id char(36) NOT NULL,
  title varchar(255) NOT NULL,
  due_date date NULL,
  done tinyint(1) NOT NULL DEFAULT 0,
  created_by varchar(255) NULL,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  KEY idx_lead_tasks_lead (lead_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
