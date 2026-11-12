-- Apply before deploying the visit/calendar integration. Run once.
ALTER TABLE calendar_events
  ADD COLUMN visit_assignment_id INT NULL,
  ADD UNIQUE KEY uk_calendar_visit_assignment (visit_assignment_id);

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
