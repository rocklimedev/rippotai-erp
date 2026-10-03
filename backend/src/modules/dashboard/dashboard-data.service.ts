import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { QueryTypes, Sequelize } from 'sequelize';

/**
 * Aggregated data feeds for the editable app dashboards (AppDashboard widgets).
 *
 * GET /dashboards/data/:app  (app = crm | ledger | materials | site-ops | design-studio | admin)
 *
 * Every query is isolated: a missing table / column only blanks that part of the
 * payload instead of failing the whole dashboard.
 */
type Row = Record<string, any>;

const n = (v: any) => (v == null || v === '' ? 0 : Number(v) || 0);

const humanize = (s?: string | null) =>
  String(s || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (c) => c.toUpperCase());

function relTime(d: any): string {
  if (!d) return '';
  const t = new Date(d).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Date.now() - t;
  const abs = Math.abs(diff);
  const m = Math.round(abs / 60000);
  const fmt = (v: number, u: string) => (diff >= 0 ? `${v}${u} ago` : `in ${v}${u}`);
  if (m < 1) return 'just now';
  if (m < 60) return fmt(m, 'm');
  const h = Math.round(m / 60);
  if (h < 24) return fmt(h, 'h');
  const dd = Math.round(h / 24);
  if (dd < 30) return fmt(dd, 'd');
  return new Date(t).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

/** Day-granular label for due dates: Today / Tomorrow / in 5d / 3d overdue. */
function relDay(d: any): string {
  if (!d) return '';
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const diff = Math.round((day.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff > 1) return `in ${diff}d`;
  return `${-diff}d overdue`;
}

function isoDate(d: any): string | null {
  if (!d) return null;
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return String(d);
  return x.toISOString().slice(0, 10);
}

const LEAD_STAGE_LABEL: Record<string, string> = {
  capture: 'Capture',
  qual: 'Qualification',
  disc: 'Discovery',
  prop: 'Proposal',
  nego: 'Negotiation',
  contract: 'Contract',
  handoff: 'Handoff',
  nurture: 'Nurture',
  lost: 'Lost',
};

@Injectable()
export class DashboardDataService {
  private readonly logger = new Logger(DashboardDataService.name);

  constructor(@InjectConnection() private readonly db: Sequelize) {}

  private async q(sql: string, replacements: Row = {}): Promise<Row[]> {
    try {
      return (await this.db.query(sql, {
        type: QueryTypes.SELECT,
        replacements,
      })) as Row[];
    } catch (e: any) {
      this.logger.warn(`dashboard query failed: ${e?.message?.slice(0, 160)}`);
      return [];
    }
  }

  private async one(sql: string, replacements: Row = {}): Promise<Row> {
    return (await this.q(sql, replacements))[0] || {};
  }

  async getData(app: string) {
    switch (app) {
      case 'crm':
        return this.crm();
      case 'ledger':
        return this.ledger();
      case 'materials':
      case 'procurement':
        return this.materials();
      case 'site-ops':
      case 'siteOperations':
        return this.siteOps();
      case 'design-studio':
      case 'design_studio':
        return this.designStudio();
      case 'admin':
      case 'adminConsole':
        return this.admin();
      default:
        throw new NotFoundException(`No dashboard data feed for "${app}"`);
    }
  }

  /* ------------------------------------------------------------ shared */

  private async leadStats() {
    const r = await this.one(`
      SELECT COUNT(*) total,
        SUM(created_at >= NOW() - INTERVAL 30 DAY) new_30,
        SUM(stage IN ('contract','handoff')) won,
        SUM(stage = 'lost') lost
      FROM leads`);
    const total = n(r.total);
    const won = n(r.won);
    const lost = n(r.lost);
    return {
      total,
      new: n(r.new_30),
      active: Math.max(0, total - won - lost),
      won,
      lost,
      conversion_rate: total ? Math.round((won / total) * 100) : 0,
    };
  }

  private async projectStats() {
    const r = await this.one(`
      SELECT COUNT(*) total,
        SUM(status = 'active') active,
        SUM(status IN ('inactive','on_hold')) upcoming,
        SUM(status = 'completed') completed
      FROM projects WHERE deleted_at IS NULL AND archived_at IS NULL`);
    return {
      total: n(r.total),
      active: n(r.active),
      upcoming: n(r.upcoming),
      completed: n(r.completed),
    };
  }

  private async activity(entityTypes: string[] | null, limit = 8) {
    const where = entityTypes?.length
      ? `WHERE a.action NOT IN ('login','logout','login_failed','token_refreshed') AND a.entity_type IN (:types)`
      : `WHERE a.action NOT IN ('login','logout','login_failed','token_refreshed')`;
    const rows = await this.q(
      `SELECT a.id, a.action, a.entity_type, a.entity_label, a.created_at,
              COALESCE(u.name, a.user_email) user_name
       FROM activity_logs a LEFT JOIN users u ON u.id = a.user_id
       ${where} ORDER BY a.created_at DESC LIMIT ${Number(limit)}`,
      { types: entityTypes || [] },
    );
    return rows.map((a) => ({
      id: a.id,
      type: a.entity_type,
      title: humanize(a.action),
      description: a.entity_label || humanize(a.entity_type),
      user: a.user_name || 'System',
      time: relTime(a.created_at),
      date: a.created_at,
    }));
  }

  /** Map cleared-gate progress to a design pipeline stage. */
  private async projectStages() {
    const rows = await this.q(`
      SELECT p.id, p.name, p.status, p.progress_pct, p.current_phase, p.priority,
             p.expected_completion_date, p.updated_at, c.name client,
             u.name manager,
             (SELECT MAX(gd.sequence_order) FROM project_gates pg
                JOIN gate_definitions gd ON gd.id = pg.gate_definition_id
               WHERE pg.project_id = p.id AND pg.status IN ('CLEARED','OVERRIDDEN','PASSED','COMPLETED')) cleared_seq
      FROM projects p
      LEFT JOIN clients c ON c.id = p.client_id
      LEFT JOIN users u ON u.id = p.created_by
      WHERE p.deleted_at IS NULL AND p.archived_at IS NULL
      ORDER BY p.updated_at DESC`);
    return rows.map((p) => {
      const seq = n(p.cleared_seq);
      let stage = 'concept';
      if (p.status === 'completed' || seq >= 12) stage = 'completed';
      else if (seq >= 8) stage = 'working_drawings';
      else if (seq >= 5) stage = 'design_development';
      const stageLabel: Record<string, string> = {
        concept: 'Concept',
        design_development: 'Design development',
        working_drawings: 'Working drawings',
        completed: 'Completed',
      };
      return {
        id: p.id,
        name: p.name,
        client: p.client,
        manager: p.manager,
        status: humanize(p.status),
        raw_status: p.status,
        stage_key: stage,
        stage: p.current_phase || stageLabel[stage],
        progress: p.progress_pct != null ? Math.round(n(p.progress_pct)) : null,
        priority: p.priority ? humanize(String(p.priority).toLowerCase()) : null,
        due_date: isoDate(p.expected_completion_date),
        updated_at: p.updated_at,
      };
    });
  }

  /* ------------------------------------------------------------ CRM */

  private async crm() {
    const [leads, projects, briefs, recce, poa, sow, pay, deadlines, activity] =
      await Promise.all([
        this.leadStats(),
        this.projectStats(),
        this.one(`SELECT COUNT(*) total, SUM(status='DRAFT') drafts,
                    SUM(status='READY_FOR_DESIGN') under_review, SUM(status='SIGNED_OFF') approved
                  FROM project_briefs WHERE deleted_at IS NULL`),
        this.one(`SELECT COUNT(*) total, SUM(recce_date >= CURDATE()) pending,
                    SUM(recce_date < CURDATE()) completed
                  FROM site_recces WHERE deleted_at IS NULL`),
        this.one(`SELECT COUNT(*) total, SUM(status='published') active,
                    SUM(status='archived') completed, SUM(status='draft') drafts
                  FROM plan_of_actions WHERE deleted_at IS NULL`),
        this.one(`SELECT COUNT(*) total, SUM(LOWER(status) LIKE 'draft%') drafts,
                    SUM(LOWER(status) LIKE '%review%' OR LOWER(status) LIKE 'submitted%') review,
                    SUM(LOWER(status) IN ('accepted','approved','signed','signed_off')) approved
                  FROM scope_of_work WHERE deleted_at IS NULL`),
        this.one(`SELECT
                    (SELECT COUNT(*) FROM payment_schedules WHERE deleted_at IS NULL) total,
                    (SELECT COUNT(*) FROM payment_schedules WHERE deleted_at IS NULL AND status='ACTIVE') active,
                    SUM(GREATEST(m.amount - COALESCE(m.paid_amount,0),0)) payable_amount,
                    COUNT(m.id) pending_milestones
                  FROM payment_schedule_milestones m
                  JOIN payment_schedules s ON s.id = m.payment_schedule_id AND s.deleted_at IS NULL AND s.status <> 'CANCELLED'
                  WHERE m.status NOT IN ('PAID','WAIVED')`),
        this.q(`
          SELECT * FROM (
            SELECT m.id, m.title, p.name project_name, m.due_date date, 'Milestone' type
              FROM milestones m JOIN projects p ON p.id = m.project_id
             WHERE m.deleted_at IS NULL AND m.status IN ('PENDING','IN_PROGRESS') AND m.due_date >= CURDATE()
            UNION ALL
            SELECT pm.id, pm.title, p.name, pm.due_date, 'Payment'
              FROM payment_schedule_milestones pm
              JOIN payment_schedules s ON s.id = pm.payment_schedule_id AND s.deleted_at IS NULL
              JOIN projects p ON p.id = s.project_id
             WHERE pm.status NOT IN ('PAID','WAIVED') AND pm.due_date >= CURDATE()
            UNION ALL
            SELECT l.id, CONCAT('Follow up: ', COALESCE(l.deal_name, l.name)), l.company, l.follow_up, 'Lead'
              FROM leads l WHERE l.follow_up >= CURDATE() AND l.stage <> 'lost'
          ) x ORDER BY date ASC LIMIT 8`),
        this.activity(
          ['lead', 'leads', 'project', 'projects', 'client', 'clients', 'brief', 'project_brief', 'site_recce', 'scope_of_work', 'plan_of_action'],
          8,
        ),
      ]);

    return {
      leads,
      projects,
      project_briefs: {
        total: n(briefs.total),
        drafts: n(briefs.drafts),
        under_review: n(briefs.under_review),
        approved: n(briefs.approved),
      },
      site_recce: {
        total: n(recce.total),
        pending: n(recce.pending),
        completed: n(recce.completed),
      },
      plans_of_action: {
        total: n(poa.total),
        active: n(poa.active),
        completed: n(poa.completed),
        overdue_phases: 0,
      },
      scope_of_work: {
        total: n(sow.total),
        drafts: n(sow.drafts),
        review: n(sow.review),
        approved: n(sow.approved),
      },
      payment_schedules: {
        total: n(pay.total),
        active: n(pay.active),
        payable_amount: n(pay.payable_amount),
        pending_milestones: n(pay.pending_milestones),
      },
      upcoming_deadlines: deadlines.map((d) => ({
        id: d.id,
        title: d.title,
        project_name: d.project_name,
        date: isoDate(d.date),
        type: d.type,
        priority: relDay(d.date),
      })),
      activity,
    };
  }

  /* ------------------------------------------------------------ Ledger */

  private async ledger() {
    const [sum, msum, schedules, upcoming, overdue, recent, activity] =
      await Promise.all([
        this.one(`SELECT SUM(total_contract_value) tcv, SUM(total_payable) payable,
                    SUM(status='ACTIVE') active, SUM(status='COMPLETED') completed
                  FROM payment_schedules WHERE deleted_at IS NULL AND status <> 'CANCELLED'`),
        this.one(`SELECT SUM(COALESCE(m.paid_amount,0)) paid,
                    SUM(m.status IN ('PENDING','DUE','INVOICED','PARTIALLY_PAID','OVERDUE')) pending,
                    SUM(m.status NOT IN ('PAID','WAIVED') AND (m.status='OVERDUE' OR m.due_date < CURDATE())) overdue
                  FROM payment_schedule_milestones m
                  JOIN payment_schedules s ON s.id = m.payment_schedule_id AND s.deleted_at IS NULL AND s.status <> 'CANCELLED'`),
        this.q(`SELECT s.id, s.title, s.status, s.total_contract_value, s.total_payable, p.name project_name,
                  (SELECT SUM(COALESCE(paid_amount,0)) FROM payment_schedule_milestones WHERE payment_schedule_id = s.id) paid
                FROM payment_schedules s LEFT JOIN projects p ON p.id = s.project_id
                WHERE s.deleted_at IS NULL ORDER BY s.updated_at DESC LIMIT 8`),
        this.q(`SELECT m.id, m.title milestone, m.due_date, GREATEST(m.amount - COALESCE(m.paid_amount,0),0) amount, p.name project_name
                FROM payment_schedule_milestones m
                JOIN payment_schedules s ON s.id = m.payment_schedule_id AND s.deleted_at IS NULL AND s.status <> 'CANCELLED'
                LEFT JOIN projects p ON p.id = s.project_id
                WHERE m.status NOT IN ('PAID','WAIVED','OVERDUE') AND m.due_date >= CURDATE()
                ORDER BY m.due_date ASC LIMIT 8`),
        this.q(`SELECT m.id, m.title milestone, m.due_date, GREATEST(m.amount - COALESCE(m.paid_amount,0),0) amount,
                  p.name project_name, DATEDIFF(CURDATE(), m.due_date) days_overdue
                FROM payment_schedule_milestones m
                JOIN payment_schedules s ON s.id = m.payment_schedule_id AND s.deleted_at IS NULL AND s.status <> 'CANCELLED'
                LEFT JOIN projects p ON p.id = s.project_id
                WHERE m.status NOT IN ('PAID','WAIVED') AND (m.status='OVERDUE' OR m.due_date < CURDATE())
                ORDER BY m.due_date ASC LIMIT 8`),
        this.q(`SELECT m.id, m.title milestone, COALESCE(m.paid_amount, m.amount) amount, m.paid_at date, p.name project_name
                FROM payment_schedule_milestones m
                JOIN payment_schedules s ON s.id = m.payment_schedule_id AND s.deleted_at IS NULL
                LEFT JOIN projects p ON p.id = s.project_id
                WHERE m.paid_at IS NOT NULL OR m.status IN ('PAID','PARTIALLY_PAID')
                ORDER BY COALESCE(m.paid_at, m.updated_at) DESC LIMIT 8`),
        this.activity(['payment_schedule', 'payment', 'invoice', 'budget_estimate'], 8),
      ]);

    const payable = n(sum.payable);
    const paid = n(msum.paid);
    return {
      summary: {
        total_contract_value: n(sum.tcv),
        total_payable: payable,
        total_paid: paid,
        outstanding: Math.max(0, payable - paid),
        active_schedules: n(sum.active),
        completed_schedules: n(sum.completed),
        pending_milestones: n(msum.pending),
        overdue_payments: n(msum.overdue),
        collection_rate: payable ? Math.round((paid / payable) * 1000) / 10 : 0,
      },
      payment_schedules: schedules.map((s) => ({
        id: s.id,
        title: s.title,
        project_name: s.project_name,
        contract_value: n(s.total_contract_value),
        payable: n(s.total_payable),
        paid: n(s.paid),
        status: humanize(String(s.status || '').toLowerCase()),
      })),
      upcoming_payments: upcoming.map((p) => ({
        ...p,
        due_date: isoDate(p.due_date),
        amount: n(p.amount),
        priority: relDay(p.due_date),
      })),
      overdue_payments: overdue.map((p) => ({
        ...p,
        due_date: isoDate(p.due_date),
        amount: n(p.amount),
        days_overdue: n(p.days_overdue),
      })),
      recent_payments: recent.map((p) => ({
        ...p,
        amount: n(p.amount),
        date: isoDate(p.date),
        method: p.date ? `Paid ${relTime(p.date)}` : 'Recorded',
      })),
      activity,
    };
  }

  /* ------------------------------------------------------------ Materials */

  private async materials() {
    const stockSql = `
      SELECT mm.id, mm.name, mm.category,
        SUM(CASE WHEN t.direction='IN' THEN t.quantity ELSE 0 END) inward,
        SUM(CASE WHEN t.direction='IN' THEN t.quantity ELSE -t.quantity END) net,
        MAX(t.unit) unit, MAX(t.storage_location) location,
        (SELECT AVG(poi.rate) FROM purchase_order_items poi WHERE poi.material_id = mm.id) rate
      FROM material_masters mm
      JOIN inventory_transactions t ON t.material_id = mm.id
      GROUP BY mm.id, mm.name, mm.category`;
    const [counts, stock, po, req, today, requests, pos, moves, activity] =
      await Promise.all([
        this.one(`SELECT COUNT(*) total FROM material_masters WHERE is_active = 1 OR is_active IS NULL`),
        this.q(stockSql),
        this.one(`SELECT SUM(status IN ('APPROVED','SENT','PARTIALLY_RECEIVED')) active,
                    SUM(status IN ('SENT','PARTIALLY_RECEIVED')) pending_grn,
                    SUM(status = 'PENDING_APPROVAL') pending_approval
                  FROM purchase_orders`),
        this.one(`SELECT SUM(status IN ('DRAFT','READY')) pending, SUM(status='IN_PROGRESS') approved
                  FROM material_requirements`),
        this.one(`SELECT SUM(direction='IN') inward, SUM(direction='OUT') outward
                  FROM inventory_transactions WHERE transaction_date = CURDATE()`),
        this.q(`SELECT r.id, r.itemName item_name, r.status, r.requirementDate date, r.category, p.name project_name
                FROM material_requirements r LEFT JOIN projects p ON p.id = r.projectId
                WHERE r.status IN ('DRAFT','READY','IN_PROGRESS')
                ORDER BY r.updatedAt DESC LIMIT 8`),
        this.q(`SELECT po.id, po.po_number, po.total_amount amount, po.status, po.target_delivery_date,
                  COALESCE(v.company_name, v.name, po.agency_name) vendor, p.name project_name
                FROM purchase_orders po LEFT JOIN vendors v ON v.id = po.vendor_id
                LEFT JOIN projects p ON p.id = po.project_id
                WHERE po.status NOT IN ('CANCELLED','CLOSED')
                ORDER BY po.updated_at DESC LIMIT 8`),
        this.q(`SELECT t.id, t.direction, t.quantity, t.unit, t.storage_location, t.transaction_date, t.created_at,
                  mm.name material, p.name project_name
                FROM inventory_transactions t LEFT JOIN material_masters mm ON mm.id = t.material_id
                LEFT JOIN projects p ON p.id = t.project_id
                ORDER BY t.created_at DESC LIMIT 8`),
        this.activity(['material', 'material_requirement', 'purchase_order', 'delivery_challan', 'inventory', 'quotation', 'vendor'], 8),
      ]);

    let stockValue = 0;
    let stockUnits = 0;
    let low = 0;
    let out = 0;
    const lowItems: Row[] = [];
    const catMap = new Map<string, Row>();
    for (const s of stock) {
      const net = n(s.net);
      const inward = n(s.inward);
      const min = Math.max(1, Math.round(inward * 0.2));
      stockUnits += Math.max(0, net);
      stockValue += Math.max(0, net) * n(s.rate);
      if (net <= 0) out++;
      else if (net < min) low++;
      if (net < min) {
        lowItems.push({
          id: s.id,
          name: s.name,
          category: s.category || 'Uncategorised',
          current: Math.max(0, Math.round(net * 100) / 100),
          minimum: min,
          unit: s.unit,
          warehouse: s.location,
        });
      }
      const key = s.category || 'Uncategorised';
      const c = catMap.get(key) || { id: key, name: key, items: 0, stock: 0, value: 0, low_stock: 0 };
      c.items += 1;
      c.stock += Math.max(0, net);
      c.value += Math.max(0, net) * n(s.rate);
      if (net < min) c.low_stock += 1;
      catMap.set(key, c);
    }
    lowItems.sort((a, b) => a.current / a.minimum - b.current / b.minimum);

    return {
      stats: {
        total_materials: n(counts.total),
        total_stock_units: Math.round(stockUnits),
        stock_value: Math.round(stockValue),
        low_stock: low,
        out_of_stock: out,
        pending_requests: n(req.pending),
        approved_requests: n(req.approved),
        active_purchase_orders: n(po.active),
        pending_deliveries: n(po.pending_grn),
        pending_grn: n(po.pending_grn),
        inward_today: n(today.inward),
        outward_today: n(today.outward),
      },
      categories: [...catMap.values()]
        .sort((a, b) => b.value - a.value || b.items - a.items)
        .map((c) => ({ ...c, stock: Math.round(c.stock), value: Math.round(c.value) })),
      low_stock_items: lowItems.slice(0, 8),
      requests: requests.map((r) => ({
        id: r.item_name || r.id,
        project_name: r.project_name,
        items: 1,
        status: humanize(String(r.status || '').toLowerCase()),
        date: isoDate(r.date),
      })),
      purchase_orders: pos.map((p) => ({
        id: p.po_number || p.id,
        vendor: p.vendor || 'Vendor',
        project_name: p.project_name,
        amount: n(p.amount),
        status: humanize(String(p.status || '').toLowerCase()),
        expected_date: isoDate(p.target_delivery_date),
      })),
      movements: moves.map((m) => ({
        id: m.id,
        type: m.direction === 'IN' ? 'INWARD' : 'OUTWARD',
        material: m.material || 'Material',
        quantity: Math.round(n(m.quantity) * 100) / 100,
        unit: m.unit,
        location: m.storage_location || m.project_name,
        time: relTime(m.created_at),
      })),
      activity,
    };
  }

  /* ------------------------------------------------------------ Site Ops */

  private async siteOps() {
    const [rep, rfi, mock, qc, visits, reports, visitRows, rfis, mockups] =
      await Promise.all([
        this.one(`SELECT COUNT(*) total, SUM(report_date = CURDATE()) today, SUM(report_date = CURDATE() AND is_shared = 1) today_shared
                  FROM daily_site_reports`),
        this.one(`SELECT SUM(status='OPEN') open FROM rfis`),
        this.one(`SELECT SUM(status IN ('PROPOSED','UNDER_REVIEW')) pending FROM mockups`),
        this.one(`SELECT SUM(result='PASS') pass, SUM(result IN ('FAIL','REWORK')) fail, COUNT(*) total FROM qc_sign_offs`),
        this.one(`SELECT COUNT(*) today FROM site_visit_logs WHERE scheduled_date = CURDATE() AND status <> 'CANCELLED'`),
        this.q(`SELECT id, report_date, work_completed, is_shared, created_at FROM daily_site_reports ORDER BY report_date DESC, id DESC LIMIT 6`),
        this.q(`SELECT id, visitor_name, visitor_type, scheduled_date, purpose, status FROM site_visit_logs ORDER BY scheduled_date DESC, id DESC LIMIT 6`),
        this.q(`SELECT r.id, r.rfi_number, r.subject, r.status, r.priority, r.raised_at, t.name routed_to_team_name
                FROM rfis r LEFT JOIN teams t ON t.id = CAST(r.routed_to_team_id AS CHAR)
                ORDER BY (r.status='OPEN') DESC, r.raised_at DESC LIMIT 8`),
        this.q(`SELECT id, name, finish_type, status, proposed_at FROM mockups ORDER BY (status IN ('PROPOSED','UNDER_REVIEW')) DESC, updated_at DESC LIMIT 8`),
      ]);
    const qcTotal = n(qc.total);
    const activity = [
      ...reports.map((r) => ({
        id: `rep-${r.id}`,
        type: 'report',
        title: `Daily report · ${isoDate(r.report_date)}`,
        description: r.is_shared ? 'Shared with client' : 'Draft',
        date: r.created_at,
      })),
      ...rfis.map((r) => ({
        id: `rfi-${r.id}`,
        type: 'rfi',
        title: `RFI-${String(r.rfi_number).padStart(3, '0')} ${r.subject || ''}`.trim(),
        description: humanize(String(r.status || '').toLowerCase()),
        date: r.raised_at,
      })),
      ...mockups.map((m) => ({
        id: `mock-${m.id}`,
        type: 'mockup',
        title: m.name,
        description: `Mockup ${humanize(String(m.status || '').toLowerCase())}`,
        date: m.proposed_at,
      })),
    ]
      .filter((a) => a.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);

    return {
      stats: {
        today_report_ready: n(rep.today) > 0,
        today_report_shared: n(rep.today_shared) > 0,
        total_reports: n(rep.total),
        open_rfis: n(rfi.open),
        pending_mockups: n(mock.pending),
        passed_qc: n(qc.pass),
        failed_qc: n(qc.fail),
        qc_pass_rate: qcTotal ? Math.round((n(qc.pass) / qcTotal) * 100) : null,
        handoff_blocked: n(qc.fail),
        today_visits: n(visits.today),
      },
      reports: reports.map((r) => ({
        id: r.id,
        report_date: isoDate(r.report_date),
        work_completed: r.work_completed,
        is_shared: !!r.is_shared,
      })),
      visits: visitRows.map((v) => ({
        ...v,
        visitor_type: humanize(String(v.visitor_type || '').toLowerCase()),
        scheduled_date: isoDate(v.scheduled_date),
        status: humanize(String(v.status || '').toLowerCase()),
      })),
      rfis: rfis.map((r) => ({ ...r, status: r.status, priority: humanize(String(r.priority || '').toLowerCase()) })),
      mockups: mockups.map((m) => ({ ...m, status: m.status })),
      activity,
    };
  }

  /* ------------------------------------------------------------ Design Studio */

  private async designStudio() {
    const [projects, tasks, approvals, team, upcoming, activity] = await Promise.all([
      this.projectStages(),
      this.q(`SELECT t.id, t.title, t.priority, t.status, t.due_date, p.name project_name, u.name assignee
              FROM tasks t LEFT JOIN projects p ON p.id = t.project_id LEFT JOIN users u ON u.id = t.created_by
              WHERE t.status <> 'completed' ORDER BY (t.due_date IS NULL), t.due_date ASC LIMIT 20`),
      this.q(`SELECT d.id, d.title, d.drawing_number, d.status, d.updated_at, p.name project_name, u.name submitted_by, d.discipline
              FROM drawings d LEFT JOIN projects p ON p.id = d.project_id LEFT JOIN users u ON u.id = d.drawn_by
              WHERE LOWER(COALESCE(d.status,'')) IN ('submitted','for_approval','pending_approval','under_review','review','in_review')
              ORDER BY d.updated_at DESC LIMIT 20`),
      this.q(`SELECT u.id, u.name, u.job_title role,
                (SELECT COUNT(*) FROM milestones m WHERE m.assignee_id = u.id AND m.deleted_at IS NULL AND m.status IN ('PENDING','IN_PROGRESS')) active_tasks,
                (SELECT COUNT(*) FROM milestones m WHERE m.assignee_id = u.id AND m.deleted_at IS NULL AND m.status = 'COMPLETED') completed
              FROM users u WHERE u.is_active = 1 ORDER BY u.name LIMIT 50`),
      this.q(`SELECT * FROM (
                SELECT m.id, m.title, m.due_date date, 'Milestone' type, p.name project_name
                  FROM milestones m JOIN projects p ON p.id = m.project_id
                 WHERE m.deleted_at IS NULL AND m.status IN ('PENDING','IN_PROGRESS') AND m.due_date >= CURDATE()
                UNION ALL
                SELECT e.id, e.title, e.starts_at, e.type, NULL FROM calendar_events e
                 WHERE e.starts_at >= CURDATE() AND e.type IN ('presentation','client_meeting','milestone_due','handover')
              ) x ORDER BY date ASC LIMIT 8`),
      this.activity(['drawing', 'drawings', 'project', 'projects', 'brief', 'project_brief', 'task', 'tasks'], 8),
    ]);
    const active = projects.filter((p) => p.raw_status === 'active');
    const teamRows = team.map((m) => {
      const a = n(m.active_tasks);
      const c = n(m.completed);
      return {
        id: m.id,
        name: m.name,
        role: m.role,
        active_tasks: a,
        completed: c,
        utilization: Math.min(100, a * 20),
      };
    });
    const busy = teamRows.filter((m) => m.active_tasks > 0).length;
    const stats = { concept: 0, design_development: 0, working_drawings: 0, completed: 0 } as Record<string, number>;
    for (const p of projects) stats[p.stage_key] = (stats[p.stage_key] || 0) + 1;

    return {
      overview: {
        active_projects: active.length,
        design_tasks: tasks.length,
        pending_approvals: approvals.length,
        team_utilization: teamRows.length ? Math.round((busy / teamRows.length) * 100) : 0,
      },
      project_stats: stats,
      projects: (active.length ? active : projects).slice(0, 8),
      approvals: approvals.map((a) => ({
        id: a.id,
        title: a.title || a.drawing_number,
        project_name: a.project_name,
        type: a.discipline || 'Drawing',
        submitted_by: a.submitted_by,
        submitted_at: a.updated_at,
        status: a.status,
      })),
      tasks: tasks.map((t) => ({
        ...t,
        due_date: isoDate(t.due_date),
        priority: humanize(t.priority),
      })),
      upcoming: upcoming.map((u) => ({
        id: u.id,
        title: u.title,
        date: isoDate(u.date),
        type: humanize(u.type),
        priority: relDay(u.date),
      })),
      team: teamRows.sort((a, b) => b.active_tasks - a.active_tasks).slice(0, 8),
      activity: activity.map((a) => ({
        id: a.id,
        user: a.user,
        action: a.title.toLowerCase(),
        target: a.description,
        project_name: '',
        time: a.time,
      })),
    };
  }

  /* ------------------------------------------------------------ Admin */

  private async admin() {
    const [projects, leads, pipeline, users, team, activity, approvalsRaw, snapshot] =
      await Promise.all([
        this.projectStages(),
        this.leadStats(),
        this.q(`SELECT stage, COUNT(*) c FROM leads GROUP BY stage`),
        this.one(`SELECT SUM(is_active = 1) active FROM users`),
        this.q(`SELECT u.id, u.name, COALESCE(u.job_title, r.name) role,
                  (SELECT COUNT(*) FROM projects p WHERE p.created_by = u.id AND p.deleted_at IS NULL) projects,
                  (SELECT COUNT(*) FROM tasks t WHERE t.created_by = u.id AND t.status <> 'completed') tasks
                FROM users u LEFT JOIN roles r ON r.id = u.role_id
                WHERE u.is_active = 1 ORDER BY u.last_login_at DESC LIMIT 8`),
        this.activity(null, 8),
        this.q(`
          SELECT * FROM (
            SELECT q.id, CONCAT('Quotation ', COALESCE(q.quotation_number,'')) title, p.name description, 'High' priority, q.created_at at
              FROM quotations q LEFT JOIN projects p ON p.id = q.project_id WHERE q.status = 'submitted'
            UNION ALL
            SELECT po.id, CONCAT('PO ', COALESCE(po.po_number,'')), COALESCE(po.agency_name, p.name), 'Medium', po.created_at
              FROM purchase_orders po LEFT JOIN projects p ON p.id = po.project_id WHERE po.status = 'PENDING_APPROVAL'
            UNION ALL
            SELECT m.id, CONCAT('Mockup: ', m.name), COALESCE(m.finish_type,'Finish mockup'), 'Medium', m.created_at
              FROM mockups m WHERE m.status IN ('PROPOSED','UNDER_REVIEW')
            UNION ALL
            SELECT b.id, 'Brief ready for design', p.name, 'Low', b.updated_at
              FROM project_briefs b LEFT JOIN projects p ON p.id = b.project_id
             WHERE b.deleted_at IS NULL AND b.status = 'READY_FOR_DESIGN'
          ) x ORDER BY at DESC LIMIT 20`),
        this.one(`SELECT
            (SELECT COUNT(*) FROM project_briefs WHERE deleted_at IS NULL AND status='SIGNED_OFF') briefs,
            (SELECT COUNT(*) FROM project_gates WHERE status IN ('CLEARED','OVERRIDDEN','PASSED','COMPLETED')) gates,
            (SELECT COUNT(*) FROM purchase_orders WHERE status IN ('APPROVED','SENT','PARTIALLY_RECEIVED','RECEIVED','CLOSED')) pos,
            (SELECT COUNT(*) FROM drawings) drawings`),
      ]);

    const pipeMap = Object.fromEntries(pipeline.map((p) => [p.stage, n(p.c)]));
    const totalLeads = pipeline.reduce((s, p) => s + n(p.c), 0);
    const pipe = ['capture', 'qual', 'disc', 'prop', 'nego', 'contract', 'handoff']
      .map((k) => ({
        label: LEAD_STAGE_LABEL[k],
        value: pipeMap[k] || 0,
        percentage: totalLeads ? Math.round(((pipeMap[k] || 0) / totalLeads) * 100) : 0,
      }));

    return {
      stats: {
        active_projects: projects.filter((p) => p.raw_status === 'active').length,
        open_leads: leads.active,
        pending_approvals: approvalsRaw.length,
        team_members: n(users.active),
      },
      projects: projects.slice(0, 8).map((p) => ({ ...p, updated_at: relTime(p.updated_at) })),
      approvals: approvalsRaw.slice(0, 8).map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description || '—',
        priority: a.priority,
      })),
      pipeline: pipe,
      activity: activity.map((a) => ({
        id: a.id,
        title: a.title,
        description: `${a.description} · ${a.user}`,
        time: a.time,
        type: a.type,
      })),
      team: team.map((t) => ({ ...t, projects: n(t.projects), tasks: n(t.tasks) })),
      workflow_snapshot: [
        { title: 'Briefs signed off', value: n(snapshot.briefs) },
        { title: 'Gates cleared', value: n(snapshot.gates) },
        { title: 'POs approved', value: n(snapshot.pos) },
        { title: 'Drawings issued', value: n(snapshot.drawings) },
      ],
    };
  }
}
