import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, QueryTypes, WhereOptions } from 'sequelize';

import { ZohoCrmService } from '../zoho/crm/zoho-crm.service';
import { ClientsService } from '../clients/clients.service';

import { Lead } from './models/lead.model';
import { LeadNote } from './models/lead-note.model';
import { LeadActivity } from './models/lead-activity.model';
import { LeadTask } from './models/lead-task.model';

import {
  LeadStage,
  LeadType,
  LeadTag,
  LeadColor,
  STAGE_ORDER,
} from '@/common/enums/leads.enums';

// ------------------------------------------------------------------
// INOS runs its own Bigin-style pipeline on local data (`leads`).
// Zoho Bigin is optional: when the acting user has connected Zoho,
// writes are mirrored to Bigin's Pipelines module (best-effort) and
// POST /leads/sync/zoho imports Bigin deals into INOS.
// ------------------------------------------------------------------

export const PIPELINE_STAGES: {
  id: LeadStage;
  label: string;
  closed?: boolean;
}[] = [
  { id: LeadStage.CAPTURE, label: 'Lead Capture' },
  { id: LeadStage.QUAL, label: 'Qualification' },
  { id: LeadStage.DISC, label: 'Discovery / Site Visit' },
  { id: LeadStage.PROP, label: 'Proposal' },
  { id: LeadStage.NEGO, label: 'Negotiation' },
  { id: LeadStage.CONTRACT, label: 'Contract Signed' },
  { id: LeadStage.HANDOFF, label: 'Handoff to Execution' },
  { id: LeadStage.NURTURE, label: 'Nurture', closed: true },
  { id: LeadStage.LOST, label: 'Closed Lost', closed: true },
];

const STAGE_LABEL = new Map<string, string>(
  PIPELINE_STAGES.map((s) => [s.id, s.label]),
);
const OPEN_STAGES = new Set<string>([
  LeadStage.CAPTURE,
  LeadStage.QUAL,
  LeadStage.DISC,
  LeadStage.PROP,
  LeadStage.NEGO,
]);
const WON_STAGES = new Set<string>([LeadStage.CONTRACT, LeadStage.HANDOFF]);

// Accept Bigin stage names too (older clients / Zoho sync).
const BIGIN_TO_LOCAL: Record<string, LeadStage> = {
  qualification: LeadStage.QUAL,
  'needs analysis': LeadStage.DISC,
  'site visit': LeadStage.DISC,
  'proposal/price quote': LeadStage.PROP,
  'negotiation/review': LeadStage.NEGO,
  'closed won': LeadStage.CONTRACT,
  'closed lost': LeadStage.LOST,
};
const LOCAL_TO_BIGIN: Record<string, string> = {
  capture: 'Qualification',
  qual: 'Qualification',
  disc: 'Site Visit',
  prop: 'Proposal/Price Quote',
  nego: 'Negotiation/Review',
  contract: 'Closed Won',
  handoff: 'Closed Won',
  lost: 'Closed Lost',
};

export const LEAD_SOURCES = [
  'Referral',
  'Website',
  'Social Media',
  'Google Ads',
  'Walk-in',
  'Architect partner',
  'Existing client',
  'Exhibition',
  'Other',
];

const STUCK_AFTER_DAYS = 14;
const DAY = 86400000;

function normaliseStage(stage?: string | null): LeadStage | null {
  if (!stage) return null;
  const s = String(stage).trim();
  if ((Object.values(LeadStage) as string[]).includes(s)) return s as LeadStage;
  const lower = s.toLowerCase();
  if (BIGIN_TO_LOCAL[lower]) return BIGIN_TO_LOCAL[lower];
  const byLabel = PIPELINE_STAGES.find((x) => x.label.toLowerCase() === lower);
  return byLabel ? byLabel.id : null;
}

function parseINR(token: string): number | null {
  const match = token
    .trim()
    .match(/^₹?\s*([\d.,]+)\s*(l|lakh|lac|cr|crore)?$/i);
  if (!match) return null;
  const value = parseFloat(match[1].replace(/,/g, ''));
  if (!Number.isFinite(value)) return null;
  const unit = (match[2] || '').toLowerCase();
  const mult = unit.startsWith('c') ? 1e7 : unit.startsWith('l') ? 1e5 : 1;
  return value * mult;
}

function parseBudgetRange(range?: string | null): number | null {
  if (!range) return null;
  const clean = String(range)
    .replace(/under\s*/i, '')
    .replace('+', '');
  const nums = clean
    .split(/[–-]/)
    .map((p) => parseINR(p))
    .filter((n): n is number => n != null);
  if (!nums.length) return null;
  return nums.length === 1 ? nums[0] : (nums[0] + nums[1]) / 2;
}

const toNum = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n =
    typeof v === 'number' ? v : Number(String(v).replace(/[₹,\s]/g, ''));
  return Number.isFinite(n) ? n : null;
};

const daysBetween = (from?: Date | string | null) => {
  if (!from) return 0;
  const t = new Date(from).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / DAY));
};

const fmtINR = (n: number | null) => {
  if (n == null) return '—';
  const trim = (x: number) => x.toFixed(2).replace(/\.?0+$/, '');
  if (n >= 1e7) return `₹${trim(n / 1e7)} Cr`;
  if (n >= 1e5) return `₹${trim(n / 1e5)} L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
};

export interface LeadFilters {
  q?: string;
  owner?: string;
  source?: string;
  stage?: string;
  type?: string;
  minValue?: string | number;
  maxValue?: string | number;
  from?: string;
  to?: string;
  closeFrom?: string;
  closeTo?: string;
  sort?: string;
}

export interface Actor {
  id: string;
  name?: string;
}

type Deal = ReturnType<LeadsService['toDeal']>;

@Injectable()
export class LeadsService implements OnModuleInit {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    private readonly zohoCrmService: ZohoCrmService,
    private readonly clientsService: ClientsService,
    @InjectModel(Lead) private readonly leadModel: typeof Lead,
    @InjectModel(LeadNote) private readonly noteModel: typeof LeadNote,
    @InjectModel(LeadActivity)
    private readonly activityModel: typeof LeadActivity,
    @InjectModel(LeadTask) private readonly taskModel: typeof LeadTask,
  ) {}

  onModuleInit() {
    for (const modelName of [
      'SiteRecce',
      'BusinessProposal',
      'BudgetEstimate',
      'ProjectBrief',
      'ScopeOfWork',
      'PlanOfAction',
      'Document',
      'Lead',
    ]) {
      const model = this.db.models[modelName];
      model?.addHook(
        'afterSave',
        'lead-document-stage',
        async (record: any, options: any) => {
          if (modelName === 'Lead' && !record.changed('projectId')) return;
          const projectId = record.project_id || record.projectId;
          if (!projectId) return;
          const sync = async () => {
            try {
              await this.syncProjectStage(projectId, {
                id:
                  record.updated_by ||
                  record.created_by ||
                  record.uploadedBy ||
                  '',
                name: record.uploadedByName || 'Project documents',
              });
            } catch (error) {
              this.logger.error(
                `Lead document stage update failed for ${projectId}: ${error.message}`,
              );
            }
          };
          if (options.transaction) options.transaction.afterCommit(sync);
          else await sync();
        },
      );
    }
  }

  async syncProjectStage(projectId: string, actor: Actor) {
    const [evidence] = await this.select<Record<string, number>>(
      `
      SELECT
        EXISTS(SELECT 1 FROM site_recces WHERE project_id = ? AND deleted_at IS NULL) AS recce,
        EXISTS(SELECT 1 FROM project_briefs WHERE project_id = ? AND deleted_at IS NULL) AS brief,
        (EXISTS(SELECT 1 FROM business_proposals WHERE project_id = ?) OR
         EXISTS(SELECT 1 FROM budget_estimates WHERE project_id = ? AND status NOT IN ('rejected', 'cancelled')) OR
         EXISTS(SELECT 1 FROM scope_of_work WHERE project_id = ? AND deleted_at IS NULL AND UPPER(status) NOT IN ('REJECTED', 'ARCHIVED')) OR
         EXISTS(SELECT 1 FROM documents d JOIN document_types t ON t.id = d.document_type_id
           WHERE d.project_id = ? AND d.url IS NOT NULL AND d.url <> ''
           AND d.status NOT IN ('rejected', 'archived')
           AND (LOWER(t.name) = 'business proposal' OR LOWER(t.code) IN ('business_proposal', 'business-proposal')))) AS proposal,
        EXISTS(SELECT 1 FROM budget_estimates WHERE project_id = ? AND status IN ('submitted', 'revised', 'approved')) AS negotiation,
        EXISTS(SELECT 1 FROM documents d JOIN document_types t ON t.id = d.document_type_id
          WHERE d.project_id = ? AND d.url IS NOT NULL AND d.url <> '' AND d.status = 'approved'
          AND (LOWER(REPLACE(t.code, '_', '-')) IN ('agreement-consultancy', 'contract-execution')
            OR LOWER(t.name) IN ('agreement-consultancy', 'contract-execution'))) AS contract,
        EXISTS(SELECT 1 FROM plan_of_actions WHERE project_id = ? AND deleted_at IS NULL AND status = 'PUBLISHED') AS handoff
    `,
      Array(9).fill(projectId),
    );
    const stage =
      Number(evidence?.handoff) && Number(evidence?.contract)
        ? LeadStage.HANDOFF
        : Number(evidence?.contract)
          ? LeadStage.CONTRACT
          : Number(evidence?.negotiation)
            ? LeadStage.NEGO
            : Number(evidence?.proposal)
              ? LeadStage.PROP
              : Number(evidence?.recce)
                ? LeadStage.DISC
                : Number(evidence?.brief)
                  ? LeadStage.QUAL
                  : null;
    if (!stage) return;
    const leads = await this.leadModel.findAll({ where: { projectId } });
    for (const lead of leads) {
      if (
        (OPEN_STAGES.has(lead.stage) || lead.stage === LeadStage.CONTRACT) &&
        STAGE_ORDER.indexOf(lead.stage) < STAGE_ORDER.indexOf(stage)
      ) {
        await this.moveStage(
          { ...actor, id: actor.id || lead.ownerId || '' },
          lead.id,
          stage,
        );
      }
    }
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private get db() {
    return this.leadModel.sequelize!;
  }

  private async select<T = any>(
    sql: string,
    replacements: any[] = [],
  ): Promise<T[]> {
    return this.db.query(sql, {
      replacements,
      type: QueryTypes.SELECT,
    }) as Promise<T[]>;
  }

  private async zohoConnected(userId: string): Promise<boolean> {
    try {
      const rows = await this.select<{ n: number }>(
        'SELECT COUNT(*) AS n FROM zoho_tokens WHERE userId = ?',
        [userId],
      );
      return Number(rows?.[0]?.n || 0) > 0;
    } catch {
      return false;
    }
  }

  private async log(leadId: string, kind: string, text: string, actor?: Actor) {
    await this.activityModel.create({
      leadId,
      kind,
      text,
      author: actor?.name || null,
    } as any);
  }

  private async findOr404(id: string) {
    const lead = await this.leadModel.findByPk(id);
    if (!lead) throw new NotFoundException('Deal not found');
    return lead;
  }

  private buildWhere(f: LeadFilters): WhereOptions {
    const and: any[] = [];

    if (f.q?.trim()) {
      const like = `%${f.q.trim()}%`;
      and.push({
        [Op.or]: [
          { name: { [Op.like]: like } },
          { dealName: { [Op.like]: like } },
          { company: { [Op.like]: like } },
          { phone: { [Op.like]: like } },
          { email: { [Op.like]: like } },
          { location: { [Op.like]: like } },
          { owner: { [Op.like]: like } },
        ],
      });
    }
    if (f.owner)
      and.push(f.owner === '__none' ? { owner: null } : { owner: f.owner });
    if (f.source) and.push({ source: f.source });
    if (f.type) and.push({ type: f.type });
    if (f.stage) {
      const stages = String(f.stage)
        .split(',')
        .map((s) => normaliseStage(s))
        .filter(Boolean);
      if (stages.length) and.push({ stage: { [Op.in]: stages } });
    }
    const min = toNum(f.minValue);
    const max = toNum(f.maxValue);
    if (min != null) and.push({ amount: { [Op.gte]: min } });
    if (max != null) and.push({ amount: { [Op.lte]: max } });
    if (f.from) and.push({ created_at: { [Op.gte]: new Date(f.from) } });
    if (f.to) {
      const end = new Date(f.to);
      end.setHours(23, 59, 59, 999);
      and.push({ created_at: { [Op.lte]: end } });
    }
    if (f.closeFrom) and.push({ expectedClose: { [Op.gte]: f.closeFrom } });
    if (f.closeTo) and.push({ expectedClose: { [Op.lte]: f.closeTo } });

    return and.length ? { [Op.and]: and } : {};
  }

  private comparator(sort?: string) {
    const str = (v: any) => String(v ?? '').toLowerCase();
    const iso = (v: any) => (v ? new Date(v).toISOString() : '');
    switch (sort) {
      case 'value-desc':
        return (a: Deal, b: Deal) => (b.amount ?? -1) - (a.amount ?? -1);
      case 'value-asc':
        return (a: Deal, b: Deal) =>
          (a.amount ?? Infinity) - (b.amount ?? Infinity);
      case 'close':
        return (a: Deal, b: Deal) =>
          str(a.expectedClose || '9999').localeCompare(
            str(b.expectedClose || '9999'),
          );
      case 'oldest':
        return (a: Deal, b: Deal) =>
          iso(a.createdAt).localeCompare(iso(b.createdAt));
      case 'name-asc':
        return (a: Deal, b: Deal) => str(a.title).localeCompare(str(b.title));
      case 'name-desc':
        return (a: Deal, b: Deal) => str(b.title).localeCompare(str(a.title));
      case 'stage':
        return (a: Deal, b: Deal) =>
          STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage);
      case 'days':
        return (a: Deal, b: Deal) => b.age - a.age;
      case 'owner':
        return (a: Deal, b: Deal) => str(a.owner).localeCompare(str(b.owner));
      case 'location':
        return (a: Deal, b: Deal) =>
          str(a.location).localeCompare(str(b.location));
      case 'updated':
        return (a: Deal, b: Deal) =>
          iso(b.updatedAt).localeCompare(iso(a.updatedAt));
      case 'newest':
      default:
        return (a: Deal, b: Deal) =>
          iso(b.createdAt).localeCompare(iso(a.createdAt));
    }
  }

  /** Map a DB row -> the deal shape every CRM view uses. */
  toDeal(
    l: Lead,
    extra: {
      clientName?: string | null;
      nextTask?: LeadTask | null;
      openTasks?: number;
      notesCount?: number;
    } = {},
  ) {
    const amount = toNum(l.amount) ?? parseBudgetRange(l.budget);
    // timestamps are mapped to created_at / updated_at attributes
    const createdAt: Date = (l.get('created_at') as Date) ?? l.createdAt;
    const updatedAt: Date = (l.get('updated_at') as Date) ?? l.updatedAt;
    const age = daysBetween(createdAt);
    const daysInStage = daysBetween(l.stageEnteredAt || createdAt);
    const isOpen = OPEN_STAGES.has(l.stage);
    const stuck =
      l.stuckMode === 'always'
        ? true
        : l.stuckMode === 'never'
          ? false
          : isOpen && daysInStage > STUCK_AFTER_DAYS;
    const title = l.dealName || l.name;

    return {
      id: l.id,
      title,
      name: title, // legacy consumers (LeadCard / ContactsView) read .name
      dealName: l.dealName,
      contact: l.name,
      company: l.company || extra.clientName || null,
      clientId: l.clientId,
      clientName: extra.clientName ?? null,
      projectId: l.projectId,
      phone: l.phone,
      whatsapp: l.whatsapp || l.phone,
      email: l.email,
      type: l.type,
      location: l.location,
      size: l.size,
      budget: l.budget,
      amount,
      budgetValue: amount,
      amountLabel: fmtINR(amount),
      expectedClose: l.expectedClose,
      timeline: l.timeline,
      source: l.source,
      owner: l.owner,
      ownerId: l.ownerId,
      stage: l.stage,
      stageLabel: STAGE_LABEL.get(l.stage) || l.stage,
      status: isOpen ? 'open' : WON_STAGES.has(l.stage) ? 'won' : l.stage,
      stageEnteredAt: l.stageEnteredAt,
      daysInStage,
      age,
      days: daysInStage,
      stuck,
      stuckMode: l.stuckMode,
      tag: l.tag,
      color: l.color,
      followUp: l.followUp,
      nextTask: extra.nextTask
        ? {
            id: extra.nextTask.id,
            title: extra.nextTask.title,
            dueDate: extra.nextTask.dueDate,
          }
        : null,
      openTasks: extra.openTasks ?? 0,
      notesCount: extra.notesCount ?? 0,
      proposal: l.proposalAmount
        ? {
            amount: l.proposalAmount,
            timeline: l.proposalTimeline,
            remarks: l.proposalRemarks,
          }
        : null,
      lostReason: l.lostReason,
      closedAt: l.closedAt,
      description: l.description,
      zohoId: l.zohoId,
      docs: {
        brief: l.docBrief,
        proposal: l.docProposal,
        contract: l.docContract,
      },
      createdAt,
      updatedAt,
    };
  }

  private async hydrate(leads: Lead[]): Promise<Deal[]> {
    if (!leads.length) return [];
    const ids = leads.map((l) => l.id);
    const clientIds = [
      ...new Set(leads.map((l) => l.clientId).filter(Boolean)),
    ] as string[];

    const [tasks, noteCounts, clients] = await Promise.all([
      this.taskModel.findAll({
        where: { leadId: { [Op.in]: ids }, done: false },
        order: [['dueDate', 'ASC']],
      }),
      this.select<{ leadId: string; n: number }>(
        'SELECT lead_id AS leadId, COUNT(*) AS n FROM lead_notes WHERE lead_id IN (?) GROUP BY lead_id',
        [ids],
      ),
      clientIds.length
        ? this.select<{ id: string; name: string }>(
            'SELECT id, name FROM clients WHERE id IN (?)',
            [clientIds],
          )
        : Promise.resolve([] as { id: string; name: string }[]),
    ]);

    const taskBy = new Map<string, LeadTask[]>();
    for (const t of tasks) {
      if (!taskBy.has(t.leadId)) taskBy.set(t.leadId, []);
      taskBy.get(t.leadId)!.push(t);
    }
    const notesBy = new Map(noteCounts.map((r) => [r.leadId, Number(r.n)]));
    const clientBy = new Map(clients.map((c) => [c.id, c.name]));

    return leads.map((l) => {
      const open = taskBy.get(l.id) || [];
      const withDue = open.filter((t) => t.dueDate);
      return this.toDeal(l, {
        clientName: l.clientId ? clientBy.get(l.clientId) || null : null,
        nextTask: withDue[0] || open[0] || null,
        openTasks: open.length,
        notesCount: notesBy.get(l.id) || 0,
      });
    });
  }

  private async reconcileDocumentStages() {
    const leads = await this.leadModel.findAll({
      attributes: ['projectId'],
      where: {
        projectId: { [Op.ne]: null },
        stage: { [Op.in]: [...OPEN_STAGES, LeadStage.CONTRACT] },
      },
      group: ['projectId'],
    });
    for (const lead of leads) {
      try {
        await this.syncProjectStage(lead.projectId!, {
          id: '',
          name: 'Project documents',
        });
      } catch (error) {
        this.logger.error(
          `Lead document reconciliation failed for ${lead.projectId}: ${error.message}`,
        );
      }
    }
  }

  private async listDeals(f: LeadFilters) {
    // Reconcile before applying stage filters so old/imported documents and
    // bulk writes (which do not emit instance hooks) cannot leave a stale board.
    await this.reconcileDocumentStages();
    const leads = await this.leadModel.findAll({
      where: this.buildWhere(f),
      order: [['created_at', 'DESC']],
    });
    const deals = await this.hydrate(leads);
    return deals.sort(this.comparator(f.sort));
  }

  // ============================================================
  // META (stages, owners, sources) for filters and pickers
  // ============================================================

  async getMeta(userId: string) {
    const [users, owners, sources] = await Promise.all([
      this.select<{ id: string; name: string; email: string }>(
        'SELECT id, name, email FROM users WHERE is_active = 1 OR is_active IS NULL ORDER BY name',
      ),
      this.select<{ owner: string }>(
        "SELECT DISTINCT owner FROM leads WHERE owner IS NOT NULL AND owner <> '' ORDER BY owner",
      ),
      this.select<{ source: string }>(
        "SELECT DISTINCT source FROM leads WHERE source IS NOT NULL AND source <> '' ORDER BY source",
      ),
    ]);

    const ownerNames = new Set(users.map((u) => u.name));
    const extraOwners = owners
      .map((o) => o.owner)
      .filter((n) => !ownerNames.has(n))
      .map((n) => ({ id: null, name: n, email: null }));

    return {
      stages: PIPELINE_STAGES,
      owners: [...users, ...extraOwners],
      sources: [
        ...new Set(
          [...LEAD_SOURCES, ...sources.map((s) => s.source)]
            .filter((source) => !/zoho|bigin/i.test(source))
            .map((source) =>
              source === 'Instagram' ? 'Social Media' : source,
            ),
        ),
      ],
      types: Object.values(LeadType),
      tags: Object.values(LeadTag),
      colors: Object.values(LeadColor),
      zohoConnected: await this.zohoConnected(userId),
    };
  }

  // ============================================================
  // BOARD — one column per stage with count + total value
  // ============================================================

  async getBoard(userId: string, f: LeadFilters = {}) {
    const deals = await this.listDeals(f);

    const columns = PIPELINE_STAGES.map((s) => ({
      id: s.id as string,
      label: s.label,
      closed: !!s.closed,
      leads: [] as Deal[],
      count: 0,
      total: 0,
    }));
    const byId = new Map(columns.map((c) => [c.id, c]));

    for (const d of deals) {
      const col = byId.get(d.stage);
      if (!col) continue;
      col.leads.push(d);
      col.count += 1;
      col.total += d.amount || 0;
    }

    const open = deals.filter((d) => OPEN_STAGES.has(d.stage));
    const won = deals.filter((d) => WON_STAGES.has(d.stage));

    return {
      columns,
      activeCount: open.length,
      totals: {
        deals: deals.length,
        open: open.length,
        openValue: open.reduce((s, d) => s + (d.amount || 0), 0),
        won: won.length,
        wonValue: won.reduce((s, d) => s + (d.amount || 0), 0),
        lost: deals.filter((d) => d.stage === LeadStage.LOST).length,
      },
      zohoConnected: await this.zohoConnected(userId),
    };
  }

  // ============================================================
  // LIST (List view + ContactsView)
  // ============================================================

  async getLeads(f: LeadFilters = {}) {
    return this.listDeals(f);
  }

  // ============================================================
  // DETAIL — deal + client + notes + timeline + tasks + documents
  // ============================================================

  async getLead(id: string) {
    const lead = await this.findOr404(id);
    if (lead.projectId) {
      await this.syncProjectStage(lead.projectId, {
        id: lead.ownerId || '',
        name: 'Project documents',
      });
      await lead.reload();
    }
    const [deal] = await this.hydrate([lead]);

    const [notes, activity, tasks] = await Promise.all([
      this.noteModel.findAll({
        where: { leadId: id },
        order: [['created_at', 'DESC']],
      }),
      this.activityModel.findAll({
        where: { leadId: id },
        order: [['created_at', 'DESC']],
      }),
      this.taskModel.findAll({
        where: { leadId: id },
        order: [
          ['done', 'ASC'],
          ['dueDate', 'ASC'],
        ],
      }),
    ]);

    let client: any = null;
    if (lead.clientId) {
      const rows = await this.select(
        'SELECT id, name, contact_person AS contactPerson, email, phone, address FROM clients WHERE id = ? AND deleted_at IS NULL',
        [lead.clientId],
      );
      client = rows[0] || null;
    }

    let project: any = null;
    const documents: Record<string, { count: number; latest: any }> = {};
    if (lead.projectId) {
      const rows = await this.select(
        'SELECT id, name, site_location AS siteLocation, status FROM projects WHERE id = ? AND deleted_at IS NULL',
        [lead.projectId],
      );
      project = rows[0] || null;

      const docQueries: [string, string][] = [
        [
          'brief',
          'SELECT id, status, created_at AS createdAt FROM project_briefs WHERE project_id = ? AND deleted_at IS NULL ORDER BY created_at DESC',
        ],
        [
          'recce',
          'SELECT id, NULL AS status, created_at AS createdAt FROM site_recces WHERE project_id = ? AND deleted_at IS NULL ORDER BY created_at DESC',
        ],
        [
          'planOfAction',
          'SELECT id, status, created_at AS createdAt FROM plan_of_actions WHERE project_id = ? AND deleted_at IS NULL ORDER BY created_at DESC',
        ],
        [
          'scopeOfWork',
          'SELECT id, status, created_at AS createdAt FROM scope_of_work WHERE project_id = ? AND deleted_at IS NULL ORDER BY created_at DESC',
        ],
        [
          'proposal',
          'SELECT id, status, created_at AS createdAt FROM budget_estimates WHERE project_id = ? ORDER BY created_at DESC',
        ],
      ];
      await Promise.all(
        docQueries.map(async ([key, sql]) => {
          try {
            const r = await this.select(sql, [lead.projectId]);
            documents[key] = { count: r.length, latest: r[0] || null };
          } catch {
            documents[key] = { count: 0, latest: null };
          }
        }),
      );
    }

    return {
      ...deal,
      client,
      project,
      documents,
      notes: notes.map((n) => ({
        id: n.id,
        text: n.text,
        author: n.author,
        createdAt: n.createdAt ?? n.get('created_at'),
      })),
      activity: activity.map((a) => ({
        id: a.id,
        kind: a.kind,
        text: a.text,
        author: a.author,
        createdAt: a.createdAt ?? a.get('created_at'),
      })),
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate,
        done: !!t.done,
        createdBy: t.createdBy,
        createdAt: (t.get('created_at') as Date) ?? t.createdAt,
      })),
    };
  }

  // ============================================================
  // CREATE — accepts both the quick-create modal and NewLeadPage
  // ============================================================

  async createLead(actor: Actor, body: Record<string, any>) {
    body = body || {};
    const contactName = String(body.contact ?? body.name ?? '').trim();
    const dealName = String(body.dealName ?? body.title ?? '').trim();
    let clientId: string | null = body.clientId || null;
    let clientName: string | null = null;

    if (!clientId && body.newClient?.name?.trim()) {
      clientId = await this.findOrCreateClient(body.newClient, actor);
      clientName = body.newClient.name.trim();
      body.phone = body.phone || body.newClient.phone;
      body.email = body.email || body.newClient.email;
    } else if (clientId) {
      const rows = await this.select(
        'SELECT name, contact_person AS contactPerson, phone, email FROM clients WHERE id = ?',
        [clientId],
      );
      if (!rows.length)
        throw new BadRequestException('Selected client was not found.');
      clientName = rows[0].name;
      body.phone = body.phone || rows[0].phone;
      body.email = body.email || rows[0].email;
      if (!contactName && rows[0].contactPerson)
        body.contact = rows[0].contactPerson;
    }

    const name =
      contactName || String(body.contact || '').trim() || clientName || '';
    if (!name && !dealName) {
      throw new BadRequestException('Enter a deal name or pick a client.');
    }

    const stage = normaliseStage(body.stage) || LeadStage.CAPTURE;
    const amount = toNum(body.amount) ?? parseBudgetRange(body.budget);
    const type = (Object.values(LeadType) as string[]).includes(body.type)
      ? body.type
      : LeadType.RESIDENTIAL;

    let owner: string | null = body.owner || null;
    let ownerId: string | null = body.ownerId || null;
    if (ownerId && !owner) {
      const rows = await this.select('SELECT name FROM users WHERE id = ?', [
        ownerId,
      ]);
      owner = rows[0]?.name || null;
    }
    if (!owner) {
      owner = actor.name || null;
      ownerId = actor.id;
    }

    const lead = await this.leadModel.create({
      name: name || dealName,
      dealName: dealName || null,
      company: body.company || clientName || null,
      clientId,
      projectId: body.projectId || null,
      phone: body.phone || null,
      whatsapp: body.whatsapp || null,
      email: body.email || null,
      type,
      location: body.location || null,
      size: body.size || null,
      budget: body.budget || null,
      amount,
      expectedClose: body.expectedClose || null,
      timeline: body.timeline || null,
      source: body.source || null,
      owner,
      ownerId,
      stage,
      stageEnteredAt: new Date(),
      tag: (Object.values(LeadTag) as string[]).includes(body.tag)
        ? body.tag
        : null,
      description: body.description || null,
      closedAt:
        WON_STAGES.has(stage) || stage === LeadStage.LOST ? new Date() : null,
    } as any);

    await this.log(
      lead.id,
      'created',
      `Deal created in ${STAGE_LABEL.get(stage)}`,
      actor,
    );

    if (body.note?.trim()) {
      await this.noteModel.create({
        leadId: lead.id,
        text: body.note.trim(),
        author: actor.name || 'System',
      } as any);
    }

    // Best-effort mirror to Bigin (only when connected)
    this.mirrorCreate(actor.id, lead).catch(() => undefined);

    const [deal] = await this.hydrate([lead]);
    return { ...deal, owner: deal.owner || 'Unassigned' };
  }

  private async findOrCreateClient(nc: Record<string, any>, actor: Actor) {
    const name = String(nc.name).trim();
    const existing = await this.select(
      'SELECT id FROM clients WHERE LOWER(name) = LOWER(?) AND deleted_at IS NULL LIMIT 1',
      [name],
    );
    if (existing.length) return existing[0].id as string;
    const payload = {
      name,
      contact_person: nc.contactPerson || nc.contact_person || undefined,
      phone: nc.phone || undefined,
      email: nc.email || undefined,
      address: nc.address || undefined,
    };
    try {
      const created = await this.clientsService.create(
        payload as any,
        actor as any,
      );
      return created.id;
    } catch {
      const slug = `${name}-${Date.now().toString(36)}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');
      const created = await this.clientsService.create(
        { ...payload, slug } as any,
        actor as any,
      );
      return created.id;
    }
  }

  // ============================================================
  // UPDATE (inline edits in the drawer, card menu)
  // ============================================================

  async updateLead(actor: Actor, id: string, body: Record<string, any>) {
    body = body || {};
    const lead = await this.findOr404(id);

    const FIELDS: Record<string, string> = {
      name: 'contact',
      contact: 'contact',
      dealName: 'deal name',
      title: 'deal name',
      company: 'company',
      clientId: 'client',
      projectId: 'project',
      phone: 'phone',
      whatsapp: 'WhatsApp',
      email: 'email',
      type: 'type',
      location: 'location',
      size: 'size',
      budget: 'budget',
      amount: 'value',
      expectedClose: 'expected close',
      timeline: 'timeline',
      source: 'source',
      owner: 'owner',
      ownerId: 'owner',
      tag: 'tag',
      color: 'card colour',
      stuckMode: 'stuck mode',
      followUp: 'follow-up',
      description: 'description',
      lostReason: 'lost reason',
    };

    // Legacy Bigin-shaped keys from the old LeadCard menu
    if ('Card_Color' in body) body.color = body.Card_Color || null;
    if (body.Tag) body.tag = body.Tag;
    if (body.Deal_Name) body.dealName = body.Deal_Name;
    if (body.Amount != null) body.amount = body.Amount;

    const patch: Record<string, any> = {};
    const changed: string[] = [];

    for (const key of Object.keys(FIELDS)) {
      if (!(key in body)) continue;
      let value = body[key];
      if (value === '') value = null;
      const attr =
        key === 'contact' ? 'name' : key === 'title' ? 'dealName' : key;

      if (attr === 'amount') value = toNum(value);
      if (attr === 'color' && value === 'None') value = null;
      if (
        attr === 'type' &&
        value &&
        !(Object.values(LeadType) as string[]).includes(value)
      )
        continue;
      if (
        attr === 'tag' &&
        value &&
        !(Object.values(LeadTag) as string[]).includes(value)
      )
        continue;
      if (
        attr === 'color' &&
        value &&
        !(Object.values(LeadColor) as string[]).includes(value)
      )
        continue;
      if (attr === 'stuckMode' && !['auto', 'always', 'never'].includes(value))
        continue;
      if (attr === 'name' && !value) continue;

      const current = (lead as any)[attr];
      const same =
        attr === 'amount'
          ? toNum(current) === value
          : String(current ?? '') === String(value ?? '');
      if (same) continue;
      patch[attr] = value;
      changed.push(FIELDS[key]);
    }

    if (patch.ownerId && !('owner' in body)) {
      const rows = await this.select('SELECT name FROM users WHERE id = ?', [
        patch.ownerId,
      ]);
      if (rows[0]) patch.owner = rows[0].name;
    }
    if (patch.clientId && !('company' in body)) {
      const rows = await this.select('SELECT name FROM clients WHERE id = ?', [
        patch.clientId,
      ]);
      if (rows[0]) patch.company = rows[0].name;
    }

    if (Object.keys(patch).length) {
      await lead.update(patch);
      await this.log(
        lead.id,
        'update',
        `Updated ${[...new Set(changed)].join(', ')}`,
        actor,
      );
      this.mirrorUpdate(actor.id, lead).catch(() => undefined);
    }

    // Stage can also arrive via general update (old card menu)
    const stageIn = normaliseStage(body.stage || body.Stage);
    if (stageIn && stageIn !== lead.stage) {
      await this.moveStage(actor, id, stageIn, { lostReason: body.lostReason });
    }
    return this.getLead(id);
  }

  // ============================================================
  // MOVE STAGE (drag & drop, stepper, won / lost)
  // ============================================================

  async moveStage(
    actor: Actor,
    id: string,
    stageRaw: string,
    opts: { lostReason?: string } = {},
  ) {
    const stage = normaliseStage(stageRaw);
    if (!stage) throw new BadRequestException(`Unknown stage "${stageRaw}".`);

    const lead = await this.findOr404(id);
    const from = lead.stage;
    if (from === stage) {
      if (opts.lostReason && stage === LeadStage.LOST)
        await lead.update({ lostReason: opts.lostReason });
      const [deal] = await this.hydrate([lead]);
      return deal;
    }

    const patch: Record<string, any> = {
      stage,
      stageEnteredAt: new Date(),
    };
    if (stage === LeadStage.LOST) {
      patch.closedAt = new Date();
      if (opts.lostReason) patch.lostReason = opts.lostReason;
    } else if (WON_STAGES.has(stage)) {
      if (!WON_STAGES.has(from)) patch.closedAt = new Date();
      patch.lostReason = null;
    } else {
      patch.closedAt = null;
      patch.lostReason = null;
    }
    await lead.update(patch);

    const fromLabel = STAGE_LABEL.get(from) || from;
    const toLabel = STAGE_LABEL.get(stage) || stage;
    let kind = 'stage';
    let text = `Moved from ${fromLabel} to ${toLabel}`;
    if (stage === LeadStage.LOST) {
      kind = 'lost';
      text = `Marked lost (was ${fromLabel})${opts.lostReason ? ` — ${opts.lostReason}` : ''}`;
    } else if (WON_STAGES.has(stage) && !WON_STAGES.has(from)) {
      kind = 'won';
      text = `Marked won — moved from ${fromLabel} to ${toLabel}`;
    }
    await this.log(lead.id, kind, text, actor);

    this.mirrorUpdate(actor.id, lead).catch(() => undefined);

    const [deal] = await this.hydrate([lead]);
    return deal;
  }

  // ============================================================
  // DELETE
  // ============================================================

  async deleteLead(actor: Actor, id: string) {
    const lead = await this.findOr404(id);
    const zohoId = lead.zohoId;
    await this.taskModel.destroy({ where: { leadId: id } });
    await this.noteModel.destroy({ where: { leadId: id } });
    await this.activityModel.destroy({ where: { leadId: id } });
    await lead.destroy();
    if (zohoId && (await this.zohoConnected(actor.id))) {
      this.zohoCrmService
        .deletePipeline(actor.id, zohoId)
        .catch(() => undefined);
    }
    return { ok: true };
  }

  // ============================================================
  // NOTES
  // ============================================================

  async addNote(actor: Actor, id: string, text: string) {
    if (!text?.trim()) throw new BadRequestException('Write something first.');
    await this.findOr404(id);
    const note = await this.noteModel.create({
      leadId: id,
      text: text.trim(),
      author: actor.name || 'System',
    } as any);
    return {
      id: note.id,
      text: note.text,
      author: note.author,
      createdAt: note.createdAt ?? note.get('created_at') ?? new Date(),
    };
  }

  async deleteNote(id: string, noteId: string) {
    await this.noteModel.destroy({ where: { id: noteId, leadId: id } });
    return { ok: true };
  }

  // ============================================================
  // TASKS
  // ============================================================

  async addTask(
    actor: Actor,
    id: string,
    body: { title: string; dueDate?: string },
  ) {
    if (!body?.title?.trim())
      throw new BadRequestException('Give the task a title.');
    await this.findOr404(id);
    const task = await this.taskModel.create({
      leadId: id,
      title: body.title.trim(),
      dueDate: body.dueDate || null,
      createdBy: actor.name || null,
    } as any);
    await this.log(
      id,
      'task',
      `Task added: ${task.title}${task.dueDate ? ` (due ${task.dueDate})` : ''}`,
      actor,
    );
    return task;
  }

  async updateTask(
    actor: Actor,
    id: string,
    taskId: string,
    body: Record<string, any>,
  ) {
    const task = await this.taskModel.findOne({
      where: { id: taskId, leadId: id },
    });
    if (!task) throw new NotFoundException('Task not found');
    const patch: Record<string, any> = {};
    if (body?.title?.trim()) patch.title = body.title.trim();
    if (body && 'dueDate' in body) patch.dueDate = body.dueDate || null;
    if (body && 'done' in body) patch.done = !!body.done;
    const completing = patch.done === true && !task.done;
    await task.update(patch);
    if (completing)
      await this.log(id, 'task', `Task completed: ${task.title}`, actor);
    return task;
  }

  async deleteTask(id: string, taskId: string) {
    await this.taskModel.destroy({ where: { id: taskId, leadId: id } });
    return { ok: true };
  }

  // ============================================================
  // PROPOSAL (quoted amount / timeline / remarks)
  // ============================================================

  async setProposal(
    actor: Actor,
    id: string,
    {
      amount,
      timeline,
      remarks,
    }: { amount: string; timeline: string; remarks?: string },
  ) {
    const lead = await this.findOr404(id);
    const n = toNum(amount);
    const patch: Record<string, any> = {
      proposalAmount: amount != null ? String(amount) : null,
      proposalTimeline: timeline || null,
      proposalRemarks: remarks || null,
    };
    if (n != null) patch.amount = n;
    await lead.update(patch);
    await this.log(
      id,
      'update',
      `Proposal quoted${n != null ? ` at ${fmtINR(n)}` : ''}${timeline ? `, ${timeline}` : ''}`,
      actor,
    );
    if (remarks?.trim()) await this.addNote(actor, id, remarks);
    if (lead.projectId) await this.syncProjectStage(lead.projectId, actor);
    return { ok: true };
  }

  // ============================================================
  // ACTIVITY FEED + REVIEW (dashboard widgets)
  // ============================================================

  async getActivity(f: {
    leadId?: string;
    date_from?: string;
    date_to?: string;
    user?: string;
  }) {
    const where: any = {};
    if (f.leadId) where.leadId = f.leadId;
    if (f.user) where.author = f.user;
    if (f.date_from || f.date_to) {
      where.created_at = {};
      if (f.date_from) where.created_at[Op.gte] = new Date(f.date_from);
      if (f.date_to) {
        const end = new Date(f.date_to);
        end.setHours(23, 59, 59, 999);
        where.created_at[Op.lte] = end;
      }
    }
    return this.activityModel.findAll({
      where,
      include: [
        {
          model: Lead,
          attributes: ['id', 'name', 'dealName', 'phone', 'owner', 'stage'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: 500,
    });
  }

  async getReview(days = 7) {
    const deals = await this.listDeals({});
    const since = Date.now() - days * DAY;
    const open = deals.filter((d) => OPEN_STAGES.has(d.stage));
    const won = deals.filter((d) => WON_STAGES.has(d.stage));
    const lost = deals.filter((d) => d.stage === LeadStage.LOST);
    const fresh = deals.filter((d) => new Date(d.createdAt).getTime() >= since);
    const closedCount = won.length + lost.length;
    const sum = (xs: Deal[]) => xs.reduce((a, d) => a + (d.amount || 0), 0);

    const ordered = PIPELINE_STAGES.filter((s) => !s.closed);
    const idxOf = (stage: string) => ordered.findIndex((s) => s.id === stage);
    const reached = (idx: number) =>
      deals.filter((d) => idxOf(d.stage) >= idx).length;
    const convBars = ordered.slice(1).map((s, i) => {
      const prev = reached(i);
      return {
        label: s.label,
        pct: prev ? Math.round((reached(i + 1) / prev) * 100) : 0,
      };
    });

    const timeBars = ordered
      .filter((s) => OPEN_STAGES.has(s.id))
      .map((s) => {
        const inStage = deals.filter((d) => d.stage === s.id);
        const avg = inStage.length
          ? Math.round(
              inStage.reduce((a, d) => a + d.daysInStage, 0) / inStage.length,
            )
          : 0;
        return { label: s.label, avgDays: avg };
      });

    const bySource = new Map<
      string,
      { label: string; count: number; won: number }
    >();
    for (const d of deals) {
      const k = d.source || 'Unknown';
      if (!bySource.has(k)) bySource.set(k, { label: k, count: 0, won: 0 });
      const r = bySource.get(k)!;
      r.count += 1;
      if (WON_STAGES.has(d.stage)) r.won += 1;
    }

    return {
      kpis: [
        { label: 'Open deals', value: open.length, sub: fmtINR(sum(open)) },
        { label: `New (${days}d)`, value: fresh.length },
        { label: 'Won', value: won.length, sub: fmtINR(sum(won)) },
        {
          label: 'Win rate',
          value: closedCount
            ? `${Math.round((won.length / closedCount) * 100)}%`
            : '—',
        },
      ],
      convBars,
      timeBars,
      sourceRows: [...bySource.values()].sort((a, b) => b.count - a.count),
      stuckRows: open
        .filter((d) => d.stuck)
        .map((d) => ({
          id: d.id,
          name: d.title,
          stage: d.stageLabel,
          owner: d.owner || '—',
          days: d.daysInStage,
        })),
    };
  }

  // ============================================================
  // ZOHO BIGIN (optional)
  // ============================================================

  private biginPayload(lead: Lead) {
    const data: Record<string, any> = {
      Deal_Name: lead.dealName || lead.name,
      Stage: LOCAL_TO_BIGIN[lead.stage] || 'Qualification',
    };
    const amt = toNum(lead.amount);
    if (amt != null) data.Amount = amt;
    if (lead.expectedClose) data.Closing_Date = lead.expectedClose;
    if (lead.description) data.Description = lead.description;
    return data;
  }

  private async mirrorCreate(userId: string, lead: Lead) {
    if (lead.zohoId || !(await this.zohoConnected(userId))) return;
    try {
      const res: any = await this.zohoCrmService.createPipeline(
        userId,
        this.biginPayload(lead),
      );
      const zohoId = res?.data?.[0]?.details?.id;
      if (zohoId) await lead.update({ zohoId: String(zohoId) });
    } catch (e: any) {
      this.logger.warn(
        `Bigin mirror (create) failed for ${lead.id}: ${e?.message}`,
      );
    }
  }

  private async mirrorUpdate(userId: string, lead: Lead) {
    if (!(await this.zohoConnected(userId))) return;
    if (!lead.zohoId) return this.mirrorCreate(userId, lead);
    try {
      await this.zohoCrmService.updatePipeline(
        userId,
        lead.zohoId,
        this.biginPayload(lead),
      );
    } catch (e: any) {
      this.logger.warn(
        `Bigin mirror (update) failed for ${lead.id}: ${e?.message}`,
      );
    }
  }

  /** Import / refresh deals from Zoho Bigin into INOS. */
  async syncFromZoho(actor: Actor) {
    if (!(await this.zohoConnected(actor.id))) {
      throw new BadRequestException(
        'Zoho Bigin is not connected for this user.',
      );
    }
    const res: any = await this.zohoCrmService.getPipelines(actor.id, {
      fields:
        'id,Deal_Name,Stage,Amount,Closing_Date,Contact_Name,Account_Name,Owner,Phone,Email,Description,Created_Time',
      per_page: 200,
    });
    const records: any[] = res?.data || [];
    let created = 0;
    let updated = 0;

    for (const r of records) {
      const stage = normaliseStage(r.Stage) || LeadStage.QUAL;
      const values: Record<string, any> = {
        dealName: r.Deal_Name || null,
        name: r.Contact_Name?.name || r.Deal_Name || 'Bigin deal',
        company: r.Account_Name?.name || null,
        phone: r.Phone || null,
        email: r.Email || null,
        amount: toNum(r.Amount),
        expectedClose: r.Closing_Date || null,
        owner: r.Owner?.name || null,
        description: r.Description || null,
      };
      const existing = await this.leadModel.findOne({
        where: { zohoId: String(r.id) },
      });
      if (existing) {
        if (existing.stage !== stage) {
          values.stage = stage;
          values.stageEnteredAt = new Date();
        }
        await existing.update(values);
        updated += 1;
      } else {
        const lead = await this.leadModel.create({
          ...values,
          stage,
          source: 'Zoho Bigin',
          zohoId: String(r.id),
          stageEnteredAt: new Date(),
        } as any);
        await this.log(lead.id, 'zoho', 'Imported from Zoho Bigin', actor);
        created += 1;
      }
    }
    return { total: records.length, created, updated };
  }
}
