/**
 * Trigger catalogue for the automation engine. Each trigger scans the DB for
 * matching entities (optionally just one, when fired by an event hook) and
 * returns a flat payload per entity that conditions and message templates use.
 */
export interface TriggerField {
  key: string;
  label: string;
  type: 'number' | 'text' | 'enum';
  options?: string[];
}

export interface TriggerParam {
  key: string;
  label: string;
  default: number;
  unit?: string;
}

export interface TriggerDef {
  type: string;
  label: string;
  entity: string;
  phase: string;
  description: string;
  fields: TriggerField[];
  params: TriggerParam[];
  /** SQL returning rows with at least entity_id, project_id, entity_label. `?` #1 = main param, then optional entity filter. */
  sql: (hasFilter: boolean) => string;
  mainParam: string;
  /** true when the entity-filter placeholder comes before the main param in `sql`. */
  filterFirst?: boolean;
  eventHook?: boolean;
}

export const TRIGGERS: TriggerDef[] = [
  {
    type: 'PAYMENT_MILESTONE_OVERDUE',
    label: 'Payment milestone overdue',
    entity: 'PAYMENT',
    phase: 'Finance',
    description: 'A client payment milestone is past its due date and not fully paid.',
    eventHook: true,
    mainParam: 'graceDays',
    params: [
      { key: 'graceDays', label: 'Grace period', default: 0, unit: 'days' },
      { key: 'cooldownHours', label: 'Repeat at most every', default: 72, unit: 'hours' },
    ],
    fields: [
      { key: 'daysOverdue', label: 'Days overdue', type: 'number' },
      { key: 'outstanding', label: 'Outstanding amount (₹)', type: 'number' },
      { key: 'status', label: 'Milestone status', type: 'enum', options: ['DUE', 'INVOICED', 'PARTIALLY_PAID', 'OVERDUE'] },
      { key: 'projectName', label: 'Project', type: 'text' },
    ],
    sql: (f) => `
      SELECT m.id AS entity_id, p.id AS project_id,
             CONCAT(COALESCE(m.milestone_code, ''), IF(m.milestone_code IS NULL, '', ' · '), m.title) AS entity_label,
             m.title, m.milestone_code AS code, m.status, m.due_date AS dueDate,
             m.amount, COALESCE(m.paid_amount, 0) AS paid,
             m.amount - COALESCE(m.paid_amount, 0) AS outstanding,
             DATEDIFF(CURDATE(), m.due_date) AS daysOverdue,
             p.name AS projectName, c.name AS clientName
        FROM payment_schedule_milestones m
        JOIN payment_schedules s ON s.id = m.payment_schedule_id AND s.deleted_at IS NULL
        JOIN projects p ON p.id = s.project_id AND p.deleted_at IS NULL
        LEFT JOIN clients c ON c.id = p.client_id
       WHERE m.status IN ('DUE', 'INVOICED', 'PARTIALLY_PAID', 'OVERDUE')
         AND m.due_date IS NOT NULL
         AND m.due_date < CURDATE() - INTERVAL ? DAY
         AND COALESCE(m.paid_amount, 0) < m.amount
         ${f ? 'AND m.id = ?' : ''}
       ORDER BY m.due_date`,
  },
  {
    type: 'PHASE_STALLED',
    label: 'Project phase stalled',
    entity: 'PROJECT',
    phase: 'Projects',
    description: 'An active project has not moved phase or cleared a gate for a while.',
    mainParam: 'days',
    filterFirst: true,
    params: [
      { key: 'days', label: 'No movement for', default: 21, unit: 'days' },
      { key: 'cooldownHours', label: 'Repeat at most every', default: 168, unit: 'hours' },
    ],
    fields: [
      { key: 'daysInPhase', label: 'Days since last movement', type: 'number' },
      { key: 'currentPhase', label: 'Current phase', type: 'text' },
      { key: 'priority', label: 'Project priority', type: 'enum', options: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
      { key: 'progress', label: 'Progress %', type: 'number' },
    ],
    sql: (f) => `
      SELECT * FROM (
        SELECT p.id AS entity_id, p.id AS project_id, p.name AS entity_label, p.name AS projectName,
               p.current_phase AS currentPhase, p.priority, COALESCE(p.progress_pct, 0) AS progress,
               DATEDIFF(NOW(), COALESCE(
                 (SELECT MAX(g.created_at) FROM gate_transition_logs g WHERE g.project_id = p.id),
                 p.updated_at, p.created_at)) AS daysInPhase
          FROM projects p
         WHERE p.deleted_at IS NULL AND p.archived_at IS NULL AND p.status = 'active'
           AND p.current_phase IS NOT NULL
           ${f ? 'AND p.id = ?' : ''}
      ) x WHERE x.daysInPhase >= ?
      ORDER BY x.daysInPhase DESC`,
  },
  {
    type: 'QC_FAILED',
    label: 'QC inspection failed',
    entity: 'QC',
    phase: 'Site operations',
    description: 'A site QC sign-off came back FAIL or REWORK and has not been re-passed.',
    eventHook: true,
    mainParam: 'lookbackDays',
    params: [
      { key: 'lookbackDays', label: 'Look at inspections from the last', default: 30, unit: 'days' },
      { key: 'cooldownHours', label: 'Repeat at most every', default: 720, unit: 'hours' },
    ],
    fields: [
      { key: 'result', label: 'Result', type: 'enum', options: ['FAIL', 'REWORK'] },
      { key: 'attemptNumber', label: 'Attempt number', type: 'number' },
      { key: 'stepName', label: 'Stage', type: 'text' },
      { key: 'projectName', label: 'Project', type: 'text' },
    ],
    sql: (f) => `
      SELECT q.id AS entity_id, q.project_id, CONCAT(COALESCE(st.name, 'QC'), ' — ', q.result) AS entity_label,
             q.result, q.attempt_number AS attemptNumber, q.checked_by AS checkedBy, q.checked_at AS checkedAt,
             q.notes, st.name AS stepName, p.name AS projectName
        FROM qc_sign_offs q
        JOIN projects p ON p.id = q.project_id AND p.deleted_at IS NULL
        LEFT JOIN steps st ON st.id = q.step_id
       WHERE q.result IN ('FAIL', 'REWORK')
         AND q.checked_at >= NOW() - INTERVAL ? DAY
         AND NOT EXISTS (
           SELECT 1 FROM qc_sign_offs q2
            WHERE q2.project_id = q.project_id AND q2.step_id = q.step_id
              AND q2.trade_team_id <=> q.trade_team_id
              AND q2.result = 'PASS' AND q2.attempt_number > q.attempt_number)
         ${f ? 'AND q.id = ?' : ''}
       ORDER BY q.checked_at DESC`,
  },
  {
    type: 'TASK_OVERDUE',
    label: 'Task overdue',
    entity: 'TASK',
    phase: 'Execution',
    description: 'An open task has passed its due date.',
    mainParam: 'graceDays',
    params: [
      { key: 'graceDays', label: 'Grace period', default: 1, unit: 'days' },
      { key: 'cooldownHours', label: 'Repeat at most every', default: 72, unit: 'hours' },
    ],
    fields: [
      { key: 'daysOverdue', label: 'Days overdue', type: 'number' },
      { key: 'priority', label: 'Priority', type: 'enum', options: ['low', 'medium', 'high', 'critical'] },
      { key: 'status', label: 'Status', type: 'enum', options: ['todo', 'in_progress', 'review', 'blocked'] },
    ],
    sql: (f) => `
      SELECT t.id AS entity_id, t.project_id, t.title AS entity_label, t.title, t.priority, t.status,
             t.assigned_to AS assigneeId, u.name AS assigneeName, p.name AS projectName,
             DATEDIFF(NOW(), t.due_date) AS daysOverdue
        FROM tasks t
        LEFT JOIN projects p ON p.id = t.project_id
        LEFT JOIN users u ON u.id = t.assigned_to
       WHERE t.status <> 'completed' AND t.due_date IS NOT NULL
         AND t.due_date < NOW() - INTERVAL ? DAY
         ${f ? 'AND t.id = ?' : ''}
       ORDER BY t.due_date`,
  },
  {
    type: 'RFI_OVERDUE',
    label: 'RFI unanswered',
    entity: 'RFI',
    phase: 'Site operations',
    description: 'A site RFI is still open after the response SLA.',
    mainParam: 'hours',
    filterFirst: true,
    params: [
      { key: 'hours', label: 'Response SLA', default: 24, unit: 'hours' },
      { key: 'cooldownHours', label: 'Repeat at most every', default: 24, unit: 'hours' },
    ],
    fields: [
      { key: 'ageHours', label: 'Age in hours', type: 'number' },
      { key: 'priority', label: 'Priority', type: 'enum', options: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] },
    ],
    sql: (f) => `
      SELECT * FROM (
        SELECT r.id AS entity_id, r.project_id, CONCAT('RFI-', LPAD(r.rfi_number, 3, '0'), ' ', r.subject) AS entity_label,
               r.subject, r.priority, r.status, p.name AS projectName,
               TIMESTAMPDIFF(HOUR, r.raised_at, NOW()) AS ageHours
          FROM rfis r JOIN projects p ON p.id = r.project_id AND p.deleted_at IS NULL
         WHERE r.status = 'OPEN' ${f ? 'AND r.id = ?' : ''}
      ) x WHERE x.ageHours >= ?
      ORDER BY x.ageHours DESC`,
  },
];

export const triggerByType = (t: string) => TRIGGERS.find((x) => x.type === t);

/** Recipients an action can target → how users are resolved. */
export const RECIPIENTS: { key: string; label: string; jobTitle?: string[]; role?: string }[] = [
  { key: 'project_manager', label: 'Project manager', jobTitle: ['%Project Manager%'] },
  { key: 'site_engineer', label: 'Site engineer', jobTitle: ['%Site Engineer%', '%Site Supervisor%'] },
  { key: 'designer', label: 'Design team', jobTitle: ['%Designer%', '%Architect%'] },
  { key: 'procurement', label: 'Procurement', jobTitle: ['%Procurement%'] },
  { key: 'accounts', label: 'Accounts', jobTitle: ['%Accounts%'] },
  { key: 'admins', label: 'Admins', role: 'ADMIN' },
  { key: 'assignee', label: 'Task assignee' },
];

export const ACTION_TYPES = [
  { value: 'NOTIFY', label: 'Send in-app notification' },
  { value: 'TASK', label: 'Create task' },
  { value: 'ESCALATE', label: 'Open escalation' },
];

export const OPERATORS = ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'in'];
