-- Apply before deploying the visit/calendar integration.
-- Idempotent: the column and key are only added when missing, so it can run again.
SET @visit_cal_ddl = IF(
  EXISTS (SELECT 1 FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'calendar_events'
             AND COLUMN_NAME = 'visit_assignment_id'),
  'DO 0',
  'ALTER TABLE calendar_events ADD COLUMN visit_assignment_id INT NULL'
);
PREPARE visit_cal_stmt FROM @visit_cal_ddl;
EXECUTE visit_cal_stmt;
DEALLOCATE PREPARE visit_cal_stmt;

SET @visit_cal_key = IF(
  EXISTS (SELECT 1 FROM information_schema.STATISTICS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'calendar_events'
             AND INDEX_NAME = 'uk_calendar_visit_assignment'),
  'DO 0',
  'ALTER TABLE calendar_events ADD UNIQUE KEY uk_calendar_visit_assignment (visit_assignment_id)'
);
PREPARE visit_key_stmt FROM @visit_cal_key;
EXECUTE visit_key_stmt;
DEALLOCATE PREPARE visit_key_stmt;

-- Backfill dated, active allocations. Existing undated recurrence rows are excluded.
-- Explicit UTC conversion matches application Asia/Kolkata all-day boundaries.
INSERT INTO calendar_events
  (id, visit_assignment_id, title, type, starts_at, ends_at, all_day,
   project_id, description, attendees, created_by, created_at, updated_at)
SELECT UUID(), va.id,
  LEFT(CONCAT('Site visit: ', COALESCE(NULLIF(va.stage_name, ''), NULLIF(va.purpose, ''), va.visitor_type)), 255),
  'site_visit',
  DATE_SUB(TIMESTAMP(va.scheduled_date), INTERVAL 330 MINUTE),
  DATE_SUB(TIMESTAMP(va.scheduled_date, '23:59:59'), INTERVAL 330 MINUTE),
  1, va.project_id,
  CONCAT_WS('\n', CONCAT('Visit assignment #', va.id),
    CONCAT('Visitor type: ', va.visitor_type),
    COALESCE(CONCAT('Visitor: ', va.external_party_name), CONCAT('Team: ', va.team_id)),
    va.purpose, va.checks_purpose, CONCAT('Visit type: ', va.visit_type)),
  JSON_ARRAY(), NULL, NOW(), NOW()
FROM visit_assignments va
WHERE va.is_active = 1 AND va.scheduled_date IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM calendar_events ce WHERE ce.visit_assignment_id = va.id);
