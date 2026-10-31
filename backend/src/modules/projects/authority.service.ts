import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { QueryTypes } from 'sequelize';

/**
 * Super-authority (ADMIN / SUPERADMIN) dashboard for the Command Center.
 * Two halves:
 *  - review: everything waiting on the owner's decision or attention
 *  - private: numbers and access information only the super authority should see
 * Every section is computed independently so one failing query never blanks the page.
 */
export const AUTHORITY_ROLES = ['ADMIN', 'SUPERADMIN', 'SUPER_ADMIN'];

export interface QueueItem {
  id: string;
  title: string;
  sub?: string | null;
  amount?: number | null;
  date?: string | null;
  tone?: 'bad' | 'warn' | 'info' | 'ok' | 'mute';
  link: string;
}

export interface ReviewQueue {
  key: string;
  label: string;
  description: string;
  group: 'approvals' | 'risks' | 'commercial';
  count: number;
  value: number | null;
  link: string;
  items: QueueItem[];
}

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

@Injectable()
export class AuthorityService {
  private readonly logger = new Logger(AuthorityService.name);

  constructor(@InjectConnection() private readonly sequelize: Sequelize) {}

  private async rows<T = any>(
    sql: string,
    replacements: Record<string, unknown> = {},
  ): Promise<T[]> {
    try {
      return (await this.sequelize.query(sql, {
        type: QueryTypes.SELECT,
        replacements,
      })) as T[];
    } catch (e) {
      this.logger.warn(
        `authority query failed: ${(e as Error).message.slice(0, 200)}`,
      );
      return [];
    }
  }

  private async queue(
    meta: Omit<ReviewQueue, 'count' | 'value' | 'items'>,
    sql: string,
    linkFor: (r: any) => string,
    toneFor?: (r: any) => QueueItem['tone'],
  ): Promise<ReviewQueue> {
    const all = await this.rows(`${sql} LIMIT 500`);
    const amounts = all
      .map((r) => num(r.amount))
      .filter((v): v is number => v !== null);
    return {
      ...meta,
      count: all.length,
      value: amounts.length ? amounts.reduce((a, b) => a + b, 0) : null,
      items: all.slice(0, 8).map((r) => ({
        id: String(r.id),
        title: r.title || '—',
        sub: r.sub ?? null,
        amount: num(r.amount),
        date: r.date ? new Date(r.date).toISOString() : null,
        tone: toneFor ? toneFor(r) : undefined,
        link: linkFor(r),
      })),
    };
  }

  async reviewQueues(): Promise<ReviewQueue[]> {
    const P = `LEFT JOIN projects p ON p.id = x.project_id`;
    const queues = await Promise.all([
      this.queue(
        {
          key: 'boqs',
          label: 'BOQs awaiting approval',
          description: 'Client BOQs submitted for your sign-off.',
          group: 'approvals',
          link: '/ledger/boq/all',
        },
        `SELECT x.id, COALESCE(x.title, x.boq_number) title, CONCAT_WS(' · ', p.name, x.boq_number) sub, x.total_value amount, x.updated_at date
           FROM boqs x ${P} WHERE x.deleted_at IS NULL AND x.status = 'awaiting_approval' ORDER BY x.updated_at`,
        (r) => `/ledger/boq/${r.id}`,
      ),
      this.queue(
        {
          key: 'purchase_orders',
          label: 'Purchase orders to approve',
          description:
            'POs raised by procurement, waiting for approval before they go to the vendor.',
          group: 'approvals',
          link: '/procurement/purchase-orders',
        },
        `SELECT x.id, x.po_number title, CONCAT_WS(' · ', x.agency_name, p.name) sub, x.total_amount amount, x.created_at date
           FROM purchase_orders x ${P} WHERE x.status = 'PENDING_APPROVAL' ORDER BY x.created_at`,
        (r) => `/procurement/purchase-orders/${r.id}`,
      ),
      this.queue(
        {
          key: 'work_orders',
          label: 'Work orders to approve',
          description: 'Contractor work orders waiting for approval.',
          group: 'approvals',
          link: '/procurement/work-order/all',
        },
        `SELECT x.id, x.wo_id title, CONCAT_WS(' · ', COALESCE(x.contractor_company_name, x.contractor_name), COALESCE(p.name, x.project_name)) sub, x.total_amount amount, x.created_at date
           FROM work_orders x ${P} WHERE x.status = 'PENDING_APPROVAL' ORDER BY x.created_at`,
        (r) => `/procurement/work-order/${r.id}`,
      ),
      this.queue(
        {
          key: 'quotations',
          label: 'Vendor quotations submitted',
          description: 'Vendor quotations submitted for review and selection.',
          group: 'approvals',
          link: '/procurement/estimates/all',
        },
        `SELECT x.id, x.quotation_number title, CONCAT_WS(' · ', v.name, p.name) sub, x.total_amount amount, x.submitted_at date
           FROM quotations x ${P} LEFT JOIN vendors v ON v.id = x.vendor_id
          WHERE x.deleted_at IS NULL AND x.status = 'submitted' ORDER BY x.submitted_at`,
        (r) => `/procurement/estimates/${r.id}`,
      ),
      this.queue(
        {
          key: 'budget_estimates',
          label: 'Budget estimates to approve',
          description:
            'Estimates submitted for approval before they are shared with the client.',
          group: 'approvals',
          link: '/ledger/budget-estimates/all',
        },
        `SELECT x.id, COALESCE(x.title, x.estimate_number) title, CONCAT_WS(' · ', p.name, x.estimate_number) sub, x.total_amount amount, x.updated_at date
           FROM budget_estimates x ${P} WHERE x.status = 'submitted' ORDER BY x.updated_at`,
        (r) => `/ledger/budget-estimate/${r.id}`,
      ),
      this.queue(
        {
          key: 'gates',
          label: 'Phase gates ready to sign off',
          description:
            'All evidence is in — the project can move to its next phase once you clear the gate.',
          group: 'approvals',
          link: '/command-center',
        },
        `SELECT x.id, CONCAT(p.name, ' — ', g.name) title, CONCAT('Gate ', g.code) sub, NULL amount, x.updated_at date, p.id project_id
           FROM project_gates x JOIN projects p ON p.id = x.project_id AND p.deleted_at IS NULL
           JOIN gate_definitions g ON g.id = x.gate_definition_id
          WHERE x.status = 'READY' ORDER BY x.updated_at`,
        (r) => `/projects/${r.project_id}`,
      ),
      this.queue(
        {
          key: 'documents',
          label: 'Documents waiting for review',
          description: 'Uploaded project documents submitted or under review.',
          group: 'approvals',
          link: '/command-center',
        },
        `SELECT x.id, x.title, CONCAT_WS(' · ', p.name, REPLACE(x.status, '_', ' ')) sub, NULL amount, x.updated_at date, x.project_id
           FROM documents x ${P} WHERE x.status IN ('submitted', 'under_review') ORDER BY x.updated_at`,
        (r) => `/projects/${r.project_id}`,
        (r) => ((r.sub || '').includes('under review') ? 'info' : 'warn'),
      ),
      this.queue(
        {
          key: 'payments_overdue',
          label: 'Client payments overdue',
          description:
            'Milestones past their due date that the client has not fully paid.',
          group: 'risks',
          link: '/ledger/payment-schedule/all',
        },
        `SELECT m.id, CONCAT(p.name, ' — ', m.title) title, CONCAT('Due ', DATE_FORMAT(m.due_date, '%d %b %Y'), ' · ', DATEDIFF(CURDATE(), m.due_date), ' days late') sub,
                (m.amount - m.paid_amount) amount, m.due_date date
           FROM payment_schedule_milestones m JOIN payment_schedules s ON s.id = m.payment_schedule_id AND s.deleted_at IS NULL
           JOIN projects p ON p.id = s.project_id
          WHERE m.status NOT IN ('PAID', 'WAIVED') AND m.due_date < CURDATE() AND m.amount > m.paid_amount
          ORDER BY m.due_date`,
        () => `/ledger/payment-schedule/all`,
        () => 'bad',
      ),
      this.queue(
        {
          key: 'escalations',
          label: 'Open escalations',
          description:
            'Problems raised by automation rules that nobody has resolved yet.',
          group: 'risks',
          link: '/automation/escalations',
        },
        `SELECT x.id, x.title, CONCAT_WS(' · ', p.name, CONCAT('Level ', x.level), x.priority) sub, NULL amount, x.opened_at date, x.priority
           FROM automation_escalations x ${P} WHERE x.status IN ('OPEN', 'ACKNOWLEDGED')
          ORDER BY FIELD(x.priority, 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'), x.opened_at`,
        () => `/automation/escalations`,
        (r) =>
          ['CRITICAL', 'HIGH'].includes(String(r.priority).toUpperCase())
            ? 'bad'
            : 'warn',
      ),
      this.queue(
        {
          key: 'qc_failures',
          label: 'Site QC failures',
          description: 'Checks whose latest attempt failed or needs rework.',
          group: 'risks',
          link: '/site-operations/qc/history',
        },
        `SELECT q.id, CONCAT(p.name, ' — QC ', q.result) title, CONCAT('Attempt ', q.attempt_number, COALESCE(CONCAT(' · ', LEFT(q.notes, 80)), '')) sub,
                NULL amount, q.checked_at date
           FROM qc_sign_offs q JOIN projects p ON p.id = q.project_id
          WHERE q.result IN ('FAIL', 'REWORK')
            AND q.attempt_number = (SELECT MAX(q2.attempt_number) FROM qc_sign_offs q2
                                     WHERE q2.project_id = q.project_id AND q2.step_id = q.step_id AND q2.trade_team_id = q.trade_team_id)
          ORDER BY q.checked_at DESC`,
        () => `/site-operations/qc/history`,
        () => 'bad',
      ),
      this.queue(
        {
          key: 'rfis',
          label: 'RFIs open more than 3 days',
          description:
            'Site questions waiting on an answer — these hold up work on site.',
          group: 'risks',
          link: '/site-operations/rfis',
        },
        `SELECT x.id, CONCAT_WS(' — ', x.rfi_number, x.subject) title, CONCAT_WS(' · ', p.name, x.priority, CONCAT(DATEDIFF(CURDATE(), x.raised_at), ' days open')) sub,
                NULL amount, x.raised_at date
           FROM rfis x ${P} WHERE x.status = 'OPEN' AND x.raised_at < (NOW() - INTERVAL 3 DAY) ORDER BY x.raised_at`,
        () => `/site-operations/rfis`,
        () => 'warn',
      ),
      this.queue(
        {
          key: 'big_deals',
          label: 'Big deals at the closing stage',
          description:
            'Deals of ₹50 lakh or more in negotiation or contract — usually need the founder in the room.',
          group: 'commercial',
          link: '/crm/pipeline',
        },
        `SELECT x.id, COALESCE(x.deal_name, x.name) title, CONCAT_WS(' · ', x.company, IF(x.stage = 'nego', 'Negotiation', 'Contract'), x.owner) sub,
                x.amount amount, x.expected_close date
           FROM leads x WHERE x.stage IN ('nego', 'contract') AND x.amount >= 5000000 ORDER BY x.amount DESC`,
        () => `/crm/pipeline`,
        () => 'info',
      ),
    ]);
    return queues;
  }

  /** Money picture across live projects — only the super authority sees margins. */
  async money() {
    const projects = await this.rows(`
      SELECT p.id, p.name, p.status,
             COALESCE(NULLIF(p.approved_value, 0), ps.contract, 0) contract,
             COALESCE(ps.collected, 0) collected,
             COALESCE(ps.billed, 0) billed,
             COALESCE(po.committed, 0) + COALESCE(wo.committed, 0) committed
        FROM projects p
        LEFT JOIN (SELECT s.project_id, SUM(s.total_payable) contract,
                          SUM(m.paid) collected, SUM(m.billed) billed
                     FROM payment_schedules s
                     LEFT JOIN (SELECT payment_schedule_id, SUM(paid_amount) paid,
                                       SUM(IF(due_date <= CURDATE() OR status IN ('DUE','INVOICED','PARTIALLY_PAID','PAID','OVERDUE'), amount, 0)) billed
                                  FROM payment_schedule_milestones GROUP BY payment_schedule_id) m ON m.payment_schedule_id = s.id
                    WHERE s.deleted_at IS NULL GROUP BY s.project_id) ps ON ps.project_id = p.id
        LEFT JOIN (SELECT project_id, SUM(total_amount) committed FROM purchase_orders
                    WHERE status NOT IN ('DRAFT', 'PENDING_APPROVAL', 'CANCELLED') GROUP BY project_id) po ON po.project_id = p.id
        LEFT JOIN (SELECT project_id, SUM(total_amount) committed FROM work_orders
                    WHERE status NOT IN ('DRAFT', 'PENDING_APPROVAL', 'CANCELLED') GROUP BY project_id) wo ON wo.project_id = p.id
       WHERE p.deleted_at IS NULL AND p.archived_at IS NULL
       ORDER BY contract DESC`);
    const list = projects.map((r) => {
      const contract = Number(r.contract) || 0,
        committed = Number(r.committed) || 0;
      const collected = Number(r.collected) || 0,
        billed = Number(r.billed) || 0;
      return {
        id: r.id,
        name: r.name,
        status: r.status,
        contract,
        committed,
        collected,
        outstanding: Math.max(billed - collected, 0),
        margin: contract ? contract - committed : null,
        marginPct: contract
          ? Math.round(((contract - committed) / contract) * 1000) / 10
          : null,
      };
    });
    const sum = (k: string) =>
      list.reduce((a, r: any) => a + (Number(r[k]) || 0), 0);
    const [pipe] = await this.rows(`
      SELECT SUM(IF(stage NOT IN ('handoff','lost','nurture'), amount, 0)) open_value,
             SUM(IF(stage NOT IN ('handoff','lost','nurture'), 1, 0)) open_count,
             SUM(IF(stage = 'handoff', amount, 0)) won_value,
             SUM(IF(stage = 'lost', amount, 0)) lost_value FROM leads`);
    return {
      totals: {
        contract: sum('contract'),
        committed: sum('committed'),
        collected: sum('collected'),
        outstanding: sum('outstanding'),
        margin: sum('contract') - sum('committed'),
        pipelineOpen: Number(pipe?.open_value) || 0,
        pipelineOpenCount: Number(pipe?.open_count) || 0,
        pipelineWon: Number(pipe?.won_value) || 0,
        pipelineLost: Number(pipe?.lost_value) || 0,
      },
      projects: list,
    };
  }

  /** Who can get in, who is getting in, and what is shared outside the firm. */
  async access() {
    const users = await this.rows(`
      SELECT u.id, u.name, u.email, u.job_title, u.is_active, u.last_login_at, u.created_at, r.name role
        FROM users u LEFT JOIN roles r ON r.id = u.role_id
       ORDER BY u.last_login_at IS NULL, u.last_login_at DESC`);
    const [logins] = await this.rows(`
      SELECT SUM(created_at >= NOW() - INTERVAL 1 DAY) today, SUM(created_at >= NOW() - INTERVAL 7 DAY) week,
             COUNT(DISTINCT IF(created_at >= NOW() - INTERVAL 7 DAY, user_id, NULL)) people_week
        FROM activity_logs WHERE action = 'login'`);
    const clientLinks = await this.rows(`
      SELECT c.id, p.name project, p.id project_id, c.purpose, c.client_name, c.client_email, c.open_count,
             c.last_opened_at, c.expires_at, c.created_at, u.name created_by
        FROM client_links c LEFT JOIN projects p ON p.id = c.project_id LEFT JOIN users u ON u.id = c.created_by
       WHERE c.revoked_at IS NULL AND c.expires_at > NOW() ORDER BY c.created_at DESC LIMIT 50`);
    const sensitive = await this.rows(`
      SELECT a.id, a.action, a.entity_type, a.entity_label, a.user_email, a.user_role, a.ip_address, a.created_at
        FROM activity_logs a
       WHERE a.action REGEXP 'approved|declined|rejected|deleted|status_changed|role|permission|override|unlock|revoked|password'
       ORDER BY a.created_at DESC LIMIT 40`);
    const overrides = await this.rows(`
      SELECT x.id, p.name project, p.id project_id, g.name gate, x.cleared_at, u.name cleared_by, x.remarks
        FROM project_gates x JOIN projects p ON p.id = x.project_id JOIN gate_definitions g ON g.id = x.gate_definition_id
        LEFT JOIN users u ON u.id = x.cleared_by
       WHERE x.overridden = 1 ORDER BY x.cleared_at DESC LIMIT 20`);
    const now = Date.now();
    return {
      summary: {
        users: users.length,
        active: users.filter((u) => Number(u.is_active) === 1).length,
        admins: users.filter((u) => /ADMIN/i.test(u.role || '')).length,
        neverLoggedIn: users.filter(
          (u) => !u.last_login_at && Number(u.is_active) === 1,
        ).length,
        dormant: users.filter(
          (u) =>
            Number(u.is_active) === 1 &&
            u.last_login_at &&
            now - new Date(u.last_login_at).getTime() > 30 * 864e5,
        ).length,
        loginsToday: Number(logins?.today) || 0,
        loginsWeek: Number(logins?.week) || 0,
        peopleWeek: Number(logins?.people_week) || 0,
        clientLinks: clientLinks.length,
      },
      users,
      clientLinks,
      sensitive,
      overrides,
    };
  }

  async overview() {
    const [review, money, access] = await Promise.all([
      this.reviewQueues(),
      this.money(),
      this.access(),
    ]);
    return { generatedAt: new Date().toISOString(), review, money, access };
  }
}
