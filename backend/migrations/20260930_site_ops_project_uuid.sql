-- Site operations: key projects by UUID (projects.id) instead of the legacy integer ids.
-- Covers rfis, mockups, qc_sign_offs, visit_assignments, site_visit_logs (daily_site_reports was
-- migrated in 20260929_daily_site_reports_v2.sql). Legacy integer ids are mapped to the real projects:
-- 1 Kapoor Farmhouse, 2 Malhotra Residence, 3 Chhabra Marble Flagship Store, 4 Bhatia Kothi,
-- 5 Oberoi Apartment, 6 Rocklime Experience Centre, 7 Singhania Penthouse.
-- Idempotent: MODIFY to CHAR(36) is a no-op the second time and the UPDATEs only touch numeric values.

CREATE TEMPORARY TABLE _site_ops_pid_map (legacy_id VARCHAR(36) PRIMARY KEY, project_id CHAR(36) NOT NULL);
INSERT INTO _site_ops_pid_map VALUES
  ('1', 'c14f9e90-bcdb-419b-abf4-e3a3002d6283'),
  ('2', 'bbbe795e-3a69-4ba7-8918-da5647d100c3'),
  ('3', '8b4849cb-e919-486a-a956-20f7bf931eeb'),
  ('4', '5be67ce2-a25d-59a0-91df-9e3cbb46afdf'),
  ('5', '8e2e3483-39bb-50c5-9d17-ea0aae013ede'),
  ('6', '12a28dd3-0d5a-552f-a5a4-43cce35ff88e'),
  ('7', '951c359f-12b1-5292-be69-ba1686ef6c17');

ALTER TABLE rfis MODIFY project_id CHAR(36) NOT NULL;
ALTER TABLE mockups MODIFY project_id CHAR(36) NOT NULL;
ALTER TABLE qc_sign_offs MODIFY project_id CHAR(36) NOT NULL;
ALTER TABLE visit_assignments MODIFY project_id CHAR(36) NOT NULL;
ALTER TABLE site_visit_logs MODIFY project_id CHAR(36) NOT NULL;

UPDATE rfis t JOIN _site_ops_pid_map m ON m.legacy_id = t.project_id SET t.project_id = m.project_id;
UPDATE mockups t JOIN _site_ops_pid_map m ON m.legacy_id = t.project_id SET t.project_id = m.project_id;
UPDATE qc_sign_offs t JOIN _site_ops_pid_map m ON m.legacy_id = t.project_id SET t.project_id = m.project_id;
UPDATE visit_assignments t JOIN _site_ops_pid_map m ON m.legacy_id = t.project_id SET t.project_id = m.project_id;
UPDATE site_visit_logs t JOIN _site_ops_pid_map m ON m.legacy_id = t.project_id SET t.project_id = m.project_id;

CREATE INDEX IF NOT EXISTS rfis_project_id ON rfis (project_id);
CREATE INDEX IF NOT EXISTS mockups_project_id ON mockups (project_id);
CREATE INDEX IF NOT EXISTS qc_sign_offs_project_id ON qc_sign_offs (project_id);
CREATE INDEX IF NOT EXISTS visit_assignments_project_id ON visit_assignments (project_id);
CREATE INDEX IF NOT EXISTS site_visit_logs_project_id ON site_visit_logs (project_id);

DROP TEMPORARY TABLE _site_ops_pid_map;
