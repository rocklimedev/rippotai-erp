import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { QueryTypes, Sequelize } from 'sequelize';

/** app key (frontend appNav) -> activity_logs.entity_type values (case-insensitive) */
export const APP_ENTITY_TYPES: Record<string, string[]> = {
  projects: ['project', 'project_gate', 'gate_condition', 'milestone', 'document', 'project_member'],
  design_studio: ['drawing'],
  crm: ['lead', 'client', 'site_recce', 'brief', 'project_brief', 'plan_of_action', 'scope_of_work'],
  ledger: ['boq', 'budget_estimate', 'payment_schedule', 'invoice', 'payment'],
  procurement: ['quotation', 'vendor', 'work_order', 'delivery_challan', 'purchase_order', 'material', 'material_requirement'],
  inventory: ['inventory', 'inventory_transaction', 'stock'],
  siteOperations: ['daily_report', 'daily_site_report', 'site_visit', 'qc', 'qc_sign_off', 'rfi', 'mockup'],
  tasks: ['task'],
  calendar: ['calendar_event'],
  adminConsole: ['user', 'role', 'settings', 'permission'],
};

const toDate = (s?: string, fallback?: Date) => {
  if (!s) return fallback as Date;
  const d = new Date(s);
  return isNaN(d.getTime()) ? (fallback as Date) : d;
};

@Injectable()
export class WorkspaceService {
  constructor(@InjectConnection() private readonly db: Sequelize) {}

  private q<T = any>(sql: string, replacements: any = {}): Promise<T[]> {
    return this.db.query(sql, { replacements, type: QueryTypes.SELECT }) as any;
  }

  /* ------------------------------------------------------------ clients */

  async clientsSummary() {
    return this.q(`
      SELECT c.id,
             COUNT(DISTINCT p.id) AS project_count,
             SUM(CASE WHEN p.status = 'active' THEN 1 ELSE 0 END) AS active_projects,
             COALESCE(SUM(p.approved_value), 0) AS approved_value,
             MAX(p.updated_at) AS last_activity
      FROM clients c
      LEFT JOIN projects p ON p.client_id = c.id AND p.deleted_at IS NULL
      WHERE c.deleted_at IS NULL
      GROUP BY c.id`);
  }

  async clientOverview(id: string) {
    const [client] = await this.q(`SELECT * FROM clients WHERE id = :id`, { id });
    if (!client) throw new NotFoundException('Client not found');
    const projects = await this.q(
      `SELECT id, name, site_location, status, priority, current_phase, progress_pct,
              approved_value, expected_completion_date, created_at, updated_at
       FROM projects WHERE client_id = :id AND deleted_at IS NULL ORDER BY updated_at DESC`,
      { id },
    );
    const ids = projects.map((p: any) => p.id);
    if (!ids.length) {
      return { client, projects, documents: [], payment_schedules: [], milestones: [], quotations: [], notes: await this.notesFor(id, ids) };
    }
    const documents = await this.q(
      `SELECT d.id, d.project_id, d.title, d.category, d.doc_type, d.doc_no, d.status, d.mime, d.url,
              d.source_app, d.created_at, d.updated_at, p.name AS project_name
       FROM documents d JOIN projects p ON p.id = d.project_id
       WHERE d.project_id IN (:ids) ORDER BY d.updated_at DESC LIMIT 100`,
      { ids },
    );
    const payment_schedules = await this.q(
      `SELECT s.id, s.project_id, s.title, s.status, s.total_contract_value, s.total_payable,
              p.name AS project_name,
              (SELECT COALESCE(SUM(m.paid_amount),0) FROM payment_schedule_milestones m WHERE m.payment_schedule_id = s.id) AS paid_amount
       FROM payment_schedules s JOIN projects p ON p.id = s.project_id
       WHERE s.project_id IN (:ids) AND s.deleted_at IS NULL ORDER BY s.created_at DESC`,
      { ids },
    );
    const milestones = await this.q(
      `SELECT m.id, m.payment_schedule_id, m.title, m.percentage, m.amount, m.status, m.due_date,
              m.paid_amount, m.paid_at, s.project_id, p.name AS project_name
       FROM payment_schedule_milestones m
       JOIN payment_schedules s ON s.id = m.payment_schedule_id
       JOIN projects p ON p.id = s.project_id
       WHERE s.project_id IN (:ids) AND s.deleted_at IS NULL
       ORDER BY m.due_date IS NULL, m.due_date ASC, m.sort_order ASC`,
      { ids },
    );
    const quotations = await this.q(
      `SELECT q.id, q.quotation_number, q.status, q.total_amount, q.quotation_date, q.expiry_date,
              q.project_id, p.name AS project_name
       FROM quotations q JOIN projects p ON p.id = q.project_id
       WHERE q.project_id IN (:ids) AND q.deleted_at IS NULL ORDER BY q.created_at DESC LIMIT 50`,
      { ids },
    );
    return { client, projects, documents, payment_schedules, milestones, quotations, notes: await this.notesFor(id, ids) };
  }

  private async notesFor(clientId: string, projectIds: string[]) {
    try {
      return await this.q(
        `SELECT id, title, body, category, tone, pinned, project_id, client_id, updated_at FROM notes
         WHERE client_id = :clientId ${projectIds.length ? 'OR project_id IN (:projectIds)' : ''}
         ORDER BY pinned DESC, updated_at DESC LIMIT 50`,
        { clientId, projectIds },
      );
    } catch {
      return [];
    }
  }

  /* ------------------------------------------------------------ calendar */

  async calendarFeed({ from, to, mine, user }: { from?: string; to?: string; mine?: boolean; user?: any }) {
    const now = new Date();
    const start = toDate(from, new Date(now.getFullYear(), now.getMonth(), 1));
    const end = toDate(to, new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59));
    const r = { start, end, uid: user?.id ?? '', email: user?.email ?? '' };
    const items: any[] = [];

    const events = await this.q(
      `SELECT e.id, e.title, e.type, e.starts_at, e.ends_at, e.all_day, e.location, e.description,
              e.project_id, e.attendees, e.created_by, p.name AS project_name
       FROM calendar_events e LEFT JOIN projects p ON p.id = e.project_id
       WHERE e.starts_at BETWEEN :start AND :end
       ${mine ? `AND (e.created_by = :uid OR JSON_CONTAINS(e.attendees, JSON_QUOTE(:email)) OR JSON_CONTAINS(e.attendees, JSON_QUOTE(:uid)))` : ''}
       ORDER BY e.starts_at`,
      r,
    );
    for (const e of events)
      items.push({ ...e, key: `event:${e.id}`, source: 'event', kind: e.type, date: e.starts_at, end: e.ends_at, editable: true,
        attendees: typeof e.attendees === 'string' ? safeJson(e.attendees) : e.attendees });

    const tasks = await this.q(
      `SELECT t.id, t.title, t.status, t.priority, t.due_date, t.project_id, p.name AS project_name,
              u.name AS assignee_name
       FROM tasks t LEFT JOIN projects p ON p.id = t.project_id LEFT JOIN users u ON u.id = t.assigned_to
       WHERE t.due_date BETWEEN :start AND :end
       ${mine ? 'AND (t.created_by = :uid OR t.assigned_to = :uid)' : ''}`,
      r,
    );
    for (const t of tasks)
      items.push({ key: `task:${t.id}`, id: t.id, source: 'task', kind: 'task', title: t.title, date: t.due_date, all_day: true,
        status: t.status, priority: t.priority, project_id: t.project_id, project_name: t.project_name, assignee_name: t.assignee_name });

    if (!mine) {
      const ms = await this.q(
        `SELECT m.id, m.title, m.due_date, m.status, m.project_id, p.name AS project_name
         FROM milestones m JOIN projects p ON p.id = m.project_id
         WHERE m.deleted_at IS NULL AND m.due_date BETWEEN :start AND :end`,
        r,
      );
      for (const m of ms)
        items.push({ key: `milestone:${m.id}`, id: m.id, source: 'milestone', kind: 'milestone_due', title: m.title, date: m.due_date,
          all_day: true, status: m.status, project_id: m.project_id, project_name: m.project_name });

      const pay = await this.q(
        `SELECT m.id, m.title, m.due_date, m.status, m.amount, s.project_id, p.name AS project_name
         FROM payment_schedule_milestones m JOIN payment_schedules s ON s.id = m.payment_schedule_id
         JOIN projects p ON p.id = s.project_id
         WHERE s.deleted_at IS NULL AND m.due_date BETWEEN :start AND :end`,
        r,
      );
      for (const m of pay)
        items.push({ key: `payment:${m.id}`, id: m.id, source: 'payment', kind: 'payment_due', title: `Payment: ${m.title}`, date: m.due_date,
          all_day: true, status: m.status, amount: m.amount, project_id: m.project_id, project_name: m.project_name });

      const qts = await this.q(
        `SELECT q.id, q.quotation_number, q.expiry_date, q.status, q.project_id, p.name AS project_name
         FROM quotations q LEFT JOIN projects p ON p.id = q.project_id
         WHERE q.deleted_at IS NULL AND q.expiry_date BETWEEN :start AND :end`,
        r,
      );
      for (const x of qts)
        items.push({ key: `quotation:${x.id}`, id: x.id, source: 'quotation', kind: 'quotation_deadline', title: `Quotation ${x.quotation_number} expires`,
          date: x.expiry_date, all_day: true, status: x.status, project_id: x.project_id, project_name: x.project_name });

      try {
        const visits = await this.q(
          `SELECT l.id, l.visitor_name, l.visitor_type, l.scheduled_date, l.status, l.purpose, l.project_id, p.name AS project_name
           FROM site_visit_logs l LEFT JOIN projects p ON p.id = l.project_id
           WHERE l.scheduled_date BETWEEN DATE(:start) AND DATE(:end)`,
          r,
        );
        for (const v of visits)
          items.push({ key: `visit:${v.id}`, id: v.id, source: 'site_visit', kind: 'site_visit',
            title: `Site visit — ${v.visitor_name}`, date: v.scheduled_date, all_day: true, status: v.status,
            description: v.purpose, visitor_type: v.visitor_type, project_id: v.project_id, project_name: v.project_name });
      } catch {
        /* site ops tables optional */
      }
    }

    items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return { from: start, to: end, items };
  }

  /* ------------------------------------------------------------ site visits (list views) */

  async visitAssignments({ projectId, status }: { projectId?: string; status?: string }) {
    const where: string[] = ['1=1'];
    const r: any = {};
    if (projectId) { where.push('va.project_id = :pid'); r.pid = String(projectId); }
    if (status === 'active') where.push('va.is_active = 1');
    if (status === 'inactive') where.push('va.is_active = 0');
    const rows = await this.q(
      `SELECT va.id, va.project_id AS projectId, p.name AS projectName, va.visitor_type AS visitorType, va.team_id AS teamId,
              t.name AS teamName, va.external_party_name AS externalPartyName, va.frequency, va.schedule_days AS scheduleDays,
              va.is_active AS isActive, va.created_at AS createdAt, va.updated_at AS updatedAt
       FROM visit_assignments va LEFT JOIN projects p ON p.id = va.project_id LEFT JOIN teams t ON t.id = CAST(va.team_id AS CHAR)
       WHERE ${where.join(' AND ')} ORDER BY va.is_active DESC, p.name, va.id`,
      r,
    );
    return rows.map((x: any) => ({
      ...x,
      isActive: !!x.isActive,
      scheduleDays: typeof x.scheduleDays === 'string' ? safeJson(x.scheduleDays) : x.scheduleDays,
    }));
  }

  async visitLog(q: any) {
    const where: string[] = ['1=1'];
    const r: any = {};
    if (q.projectId) { where.push('l.project_id = :pid'); r.pid = String(q.projectId); }
    if (q.status) { where.push('l.status = :st'); r.st = String(q.status).toUpperCase(); }
    if (q.from) { where.push('l.scheduled_date >= :from'); r.from = q.from; }
    if (q.to) { where.push('l.scheduled_date <= :to'); r.to = q.to; }
    return this.q(
      `SELECT l.id, l.project_id AS projectId, p.name AS projectName, l.visit_assignment_id AS visitAssignmentId,
              l.visitor_type AS visitorType, l.visitor_name AS visitorName, l.scheduled_date AS scheduledDate,
              l.actual_visit_at AS actualVisitAt, l.status, l.purpose, l.notes, l.logged_by AS loggedBy, l.created_at AS createdAt
       FROM site_visit_logs l LEFT JOIN projects p ON p.id = l.project_id
       WHERE ${where.join(' AND ')} ORDER BY l.scheduled_date DESC LIMIT 500`,
      r,
    );
  }

  /* ------------------------------------------------------------ inventory */

  async inventoryOverview(projectId?: string) {
    const r: any = {};
    const w = projectId ? 'WHERE t.project_id = :pid' : '';
    if (projectId) r.pid = projectId;
    const stock = await this.q(
      `SELECT t.project_id, p.name AS project_name, t.material_id, m.name AS material_name, m.material_code,
              m.category, COALESCE(u.code, u.name, MAX(t.unit)) AS unit,
              SUM(CASE WHEN t.direction = 'IN' THEN t.quantity ELSE 0 END) AS received,
              SUM(CASE WHEN t.direction = 'OUT' THEN t.quantity ELSE 0 END) AS issued,
              SUM(CASE WHEN t.direction = 'IN' THEN t.quantity ELSE -t.quantity END) AS balance,
              MAX(t.transaction_date) AS last_movement, COUNT(*) AS movements
       FROM inventory_transactions t
       JOIN material_masters m ON m.id = t.material_id
       LEFT JOIN units u ON u.id = COALESCE(t.unit_id, m.unit_id)
       LEFT JOIN projects p ON p.id = t.project_id
       ${w}
       GROUP BY t.project_id, p.name, t.material_id, m.name, m.material_code, m.category, u.code, u.name
       ORDER BY p.name, m.name`,
      r,
    );
    const movements = await this.q(
      `SELECT t.id, t.transaction_date, t.transaction_type, t.direction, t.quantity, t.reference_type,
              t.storage_location, t.issued_to, t.trade, t.remarks, t.project_id, p.name AS project_name,
              m.name AS material_name, m.material_code, COALESCE(u.code, u.name, t.unit) AS unit
       FROM inventory_transactions t
       JOIN material_masters m ON m.id = t.material_id
       LEFT JOIN units u ON u.id = COALESCE(t.unit_id, m.unit_id)
       LEFT JOIN projects p ON p.id = t.project_id
       ${w}
       ORDER BY t.transaction_date DESC, t.created_at DESC LIMIT 300`,
      r,
    );
    const projects = await this.q(
      `SELECT DISTINCT t.project_id AS id, p.name FROM inventory_transactions t JOIN projects p ON p.id = t.project_id ORDER BY p.name`,
    );
    return { stock, movements, projects };
  }

  /* ------------------------------------------------------------ activity */

  async activityFeed(q: any) {
    const where: string[] = ['1=1'];
    const r: any = {};
    const app = q.app && q.app !== 'all' ? String(q.app) : null;
    if (app === 'adminConsole') {
      where.push(`(LOWER(a.entity_type) IN (:types) OR a.entity_type IS NULL)`);
      r.types = APP_ENTITY_TYPES.adminConsole;
    } else if (app && APP_ENTITY_TYPES[app]) {
      where.push(`LOWER(a.entity_type) IN (:types)`);
      r.types = APP_ENTITY_TYPES[app];
    }
    if (q.entity_type) { where.push('LOWER(a.entity_type) = LOWER(:et)'); r.et = q.entity_type; }
    if (q.entity_id) { where.push('a.entity_id = :eid'); r.eid = q.entity_id; }
    if (q.action) { where.push('a.action = :action'); r.action = q.action; }
    if (q.verb) { where.push('a.action LIKE :verb'); r.verb = `%${q.verb}`; }
    if (q.user_id) { where.push('a.user_id = :uid'); r.uid = q.user_id; }
    if (q.q) { where.push('(a.entity_label LIKE :q OR a.user_email LIKE :q OR a.action LIKE :q)'); r.q = `%${q.q}%`; }
    if (q.from) { where.push('a.created_at >= :from'); r.from = toDate(q.from); }
    if (q.to) { where.push('a.created_at <= :to'); r.to = toDate(q.to); }
    const limit = Math.min(Number(q.limit) || 50, 200);
    const offset = Math.max(Number(q.offset) || 0, 0);
    const w = where.join(' AND ');
    const rows = await this.q(
      `SELECT a.id, a.user_id, a.user_email, a.user_role, a.action, a.entity_type, a.entity_id, a.entity_label,
              a.changes, a.created_at, u.name AS user_name
       FROM activity_logs a LEFT JOIN users u ON u.id = a.user_id
       WHERE ${w} ORDER BY a.created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      r,
    );
    const [{ total }] = await this.q<{ total: number }>(`SELECT COUNT(*) AS total FROM activity_logs a WHERE ${w}`, r);
    const types = await this.q(
      `SELECT LOWER(entity_type) AS entity_type, COUNT(*) AS n FROM activity_logs a WHERE ${w} AND entity_type IS NOT NULL GROUP BY LOWER(entity_type) ORDER BY n DESC`,
      r,
    );
    return {
      total: Number(total),
      limit,
      offset,
      entity_types: types,
      rows: rows.map((x: any) => ({ ...x, changes: typeof x.changes === 'string' ? safeJson(x.changes) : x.changes })),
    };
  }
}

function safeJson(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
