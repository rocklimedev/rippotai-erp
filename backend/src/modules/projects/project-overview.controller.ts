import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { hiddenDocumentTypes } from '@/common/security/document-type-access';
import type { DocumentTypeActor } from '@/common/security/document-type-access';
import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { QueryTypes, Sequelize } from 'sequelize';

import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';

interface HubEntry {
  count: number;
  latest: {
    id: string;
    status: string | null;
    version: string | number | null;
    updated_at: string | null;
    title: string | null;
    url: string | null;
    filename: string | null;
    document_type_id: string | null;
  } | null;
}

interface HubSource {
  key: string;
  table: string;
  typeCodes?: string[];
  phaseCode?: string;
  excludeCodes?: string[];
}

/** Source of each project document of the INOS flow (keys match the frontend catalogue). */
export const HUB_SOURCES: HubSource[] = [
  { key: 'client-brief', table: 'project_briefs' },
  { key: 'site-recce', table: 'site_recces' },
  { key: 'scope-of-work', table: 'scope_of_work' },
  {
    key: 'pre-design:existing-layout',
    table: 'drawings',
    typeCodes: ['PRE_EXISTING_LAYOUT'],
  },
  {
    key: 'pre-design:proposed-layout',
    table: 'drawings',
    typeCodes: ['PRE_PROPOSED_LAYOUT'],
  },
  {
    key: 'pre-design:pitch-presentation',
    table: 'documents',
    typeCodes: ['PRE_PITCH_PROPOSAL'],
  },
  {
    key: 'pre-design:business-proposal',
    table: 'documents',
    typeCodes: ['PRE_BUSINESS_PROPOSAL'],
  },
  {
    key: 'pre-design:concept-design',
    table: 'documents',
    typeCodes: ['PRE_CONCEPT_DESIGN_01'],
  },
  { key: 'contract', table: 'documents', typeCodes: ['PLAN_SIGNED_CONTRACT'] },
  {
    key: 'agreement',
    table: 'documents',
    typeCodes: ['PLAN_SIGNED_AGREEMENT'],
  },
  { key: 'payment-schedule', table: 'payment_schedules' },
  { key: 'plan-of-action', table: 'plan_of_actions' },
  { key: 'project-planner', table: 'project_planners' },
  {
    key: 'design',
    table: 'documents',
    phaseCode: '05_DESIGN',
    excludeCodes: ['DES_MATERIAL_PALETTE'],
  },
  {
    key: 'material-palette',
    table: 'documents',
    typeCodes: ['DES_MATERIAL_PALETTE'],
  },
  { key: 'tender-drawings', table: 'drawings', phaseCode: '06_TENDER' },
  { key: 'procurement-sheet', table: 'material_procurements' },
  { key: 'vendor-comparison', table: 'vendor_rate_comparisons' },
  { key: 'quotation', table: 'procurement_quotations' },
  { key: 'boq', table: 'boqs' },
  { key: 'purchase-order', table: 'purchase_orders' },
  { key: 'work-order', table: 'work_orders' },
  { key: 'working-drawings', table: 'drawings', phaseCode: '07_WORKING' },
  { key: 'site-inventory', table: 'inventory_transactions' },
  { key: 'delivery-challan', table: 'delivery_challans' },
  { key: 'checklist', table: 'quality_checklists' },
  { key: 'architect-site-visit-schedule', table: 'architect_site_visits' },
  { key: 'snag-list', table: 'snag_lists' },
];

/**
 * Read-only rollups the project workspace shows next to the project record.
 * The UI called these (legacy /api/projects/:id/...) but no backend route
 * existed, so the panels silently stayed empty.
 */
@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectOverviewController {
  constructor(@InjectConnection() private readonly sequelize: Sequelize) {}

  private q<T extends object = Record<string, any>>(
    sql: string,
    projectId: string,
    hiddenTypes: string[] = [],
  ) {
    return this.sequelize.query<T>(sql, {
      replacements: { projectId, hiddenTypes },
      type: QueryTypes.SELECT,
    });
  }

  /** Approved BOQ value vs committed cost (POs + work orders). */
  @RequirePermission('projects:read')
  @Get(':id/financial')
  async financial(@Param('id', ParseUUIDPipe) projectId: string) {
    const [boq] = await this.q<{
      approved: string | null;
      latest: string | null;
    }>(
      `SELECT
         (SELECT total_value FROM boqs WHERE project_id = :projectId AND deleted_at IS NULL AND status = 'approved' ORDER BY updated_at DESC LIMIT 1) AS approved,
         (SELECT total_value FROM boqs WHERE project_id = :projectId AND deleted_at IS NULL AND status <> 'archived' ORDER BY updated_at DESC LIMIT 1) AS latest`,
      projectId,
    );
    const [po] = await this.q<{ total: string | null }>(
      `SELECT COALESCE(SUM(total_amount),0) AS total FROM purchase_orders
        WHERE project_id = :projectId AND UPPER(status) NOT IN ('DRAFT','CANCELLED')`,
      projectId,
    );
    const [wo] = await this.q<{ total: string | null }>(
      `SELECT COALESCE(SUM(total_amount),0) AS total FROM work_orders
        WHERE project_id = :projectId AND UPPER(COALESCE(status,'')) NOT IN ('DRAFT','CANCELLED')`,
      projectId,
    );
    const approved = Number(boq?.approved ?? boq?.latest ?? 0) || 0;
    const committed = (Number(po?.total) || 0) + (Number(wo?.total) || 0);
    const projected = Math.max(approved, committed);
    return {
      approved_boq_estimate: approved,
      committed_cost: committed,
      projected_final_cost: projected,
      cost_variation_pct: approved
        ? Math.round(((projected - approved) / approved) * 1000) / 10
        : null,
    };
  }

  /** Vendors engaged through POs / work orders, plus procurement-tracker vendors. */
  @RequirePermission('projects:read')
  @Get(':id/vendors')
  async vendors(@Param('id', ParseUUIDPipe) projectId: string) {
    const engaged = await this.q(
      `SELECT v.id, v.name, SUM(x.amount) AS committed, COUNT(*) AS orders
         FROM (
           SELECT vendor_id, total_amount AS amount FROM purchase_orders
            WHERE project_id = :projectId AND UPPER(status) <> 'CANCELLED'
           UNION ALL
           SELECT vendor_id, total_amount FROM work_orders
            WHERE project_id = :projectId AND UPPER(COALESCE(status,'')) <> 'CANCELLED'
         ) x JOIN vendors v ON v.id = x.vendor_id
        GROUP BY v.id, v.name ORDER BY committed DESC`,
      projectId,
    );
    const attached = await this.q(
      `SELECT id, vendor_name AS name FROM project_vendor_procurements
        WHERE project_id = :projectId AND deleted_at IS NULL AND vendor_name IS NOT NULL AND vendor_name <> ''`,
      projectId,
    );
    return { engaged, attached };
  }

  /** Delayed tasks and records waiting on an internal approval. */
  @RequirePermission('projects:read')
  @Get(':id/pending-work')
  async pendingWork(@Param('id', ParseUUIDPipe) projectId: string, @CurrentUser() user?: DocumentTypeActor) {
    const hiddenTypes = hiddenDocumentTypes(user);
    const delayed = await this.q(
      `SELECT id, title, due_date FROM tasks
        WHERE project_id = :projectId AND due_date < CURDATE()
          AND LOWER(COALESCE(status,'')) NOT IN ('done','completed','cancelled')
        ORDER BY due_date LIMIT 20`,
      projectId,
    );
    const blocked = await this.q(
      `SELECT id, title, due_date FROM tasks
        WHERE project_id = :projectId AND LOWER(COALESCE(status,'')) = 'blocked' LIMIT 20`,
      projectId,
    );
    const docs = await this.q(
      `SELECT id, title, NULL AS due_date FROM documents
        WHERE project_id = :projectId AND LOWER(status) IN ('submitted','under_review','pending_approval')
        ${hiddenTypes.length ? 'AND (document_type_id IS NULL OR document_type_id NOT IN (:hiddenTypes))' : ''}
        ORDER BY updated_at DESC LIMIT 20`,
      projectId,
      hiddenTypes,
    );
    const boqs = await this.q(
      `SELECT id, CONCAT('BOQ: ', title) AS title, NULL AS due_date FROM boqs
        WHERE project_id = :projectId AND deleted_at IS NULL AND status = 'pending_approval'`,
      projectId,
    );
    return {
      delayed,
      blocked,
      awaiting_approval: [...boqs, ...docs],
      awaiting_client: [],
    };
  }

  /**
   * Project document hub: for every document of the INOS flow, whether the
   * project has one, the latest record's version/status/last edit and how
   * many records exist. Table names are fixed in HUB_SOURCES (never from the
   * request); a table missing on an older database just reports nothing.
   */
  @RequirePermission('projects:read')
  @Get(':id/document-hub')
  async documentHub(@Param('id', ParseUUIDPipe) projectId: string, @CurrentUser() user?: DocumentTypeActor) {
    const hiddenTypes = hiddenDocumentTypes(user);
    const out: Record<string, HubEntry> = {};
    for (const src of HUB_SOURCES) {
      out[src.key] = await this.hubEntry(src, projectId, hiddenTypes);
    }
    return out;
  }

  private columnsCache?: Map<string, Set<string>>;
  private columnsAt = 0;

  private async columns(table: string): Promise<Set<string> | undefined> {
    // Refreshed every 5 minutes so tables added by a later migration appear.
    if (!this.columnsCache || Date.now() - this.columnsAt > 300_000) {
      const rows = await this.sequelize.query<{ t: string; c: string }>(
        `SELECT TABLE_NAME AS t, COLUMN_NAME AS c FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE()`,
        { type: QueryTypes.SELECT },
      );
      const map = new Map<string, Set<string>>();
      for (const r of rows) {
        if (!map.has(r.t)) map.set(r.t, new Set());
        map.get(r.t)!.add(r.c);
      }
      this.columnsCache = map;
      this.columnsAt = Date.now();
    }
    return this.columnsCache.get(table);
  }

  private async hubEntry(src: HubSource, projectId: string, hiddenTypes: string[]): Promise<HubEntry> {
    const empty: HubEntry = { count: 0, latest: null };
    const cols = await this.columns(src.table);
    if (!cols || !cols.has('project_id')) return empty;
    const pick = (...names: string[]) => names.find((n) => cols.has(n));
    const version = pick('version', 'revision');
    const updated = pick('updated_at', 'created_at');
    const title = pick('title', 'name', 'doc_no');
    const list = (codes: string[]) => codes.map((c) => `'${c}'`).join(',');
    const where = ['t.project_id = :projectId'];
    if (src.table === 'documents' && cols.has('document_type_id') && hiddenTypes.length) {
      where.push('(t.document_type_id IS NULL OR t.document_type_id NOT IN (:hiddenTypes))');
    }
    if (cols.has('deleted_at')) where.push('t.deleted_at IS NULL');
    let join = '';
    if (src.typeCodes || src.phaseCode) {
      join = ' LEFT JOIN document_types dt ON dt.id = t.document_type_id';
      if (src.typeCodes) where.push(`dt.code IN (${list(src.typeCodes)})`);
      if (src.phaseCode)
        where.push(
          src.table === 'drawings'
            ? `(dt.phase_code = '${src.phaseCode}' OR t.phase_code = '${src.phaseCode}')`
            : `dt.phase_code = '${src.phaseCode}'`,
        );
      if (src.excludeCodes)
        where.push(`COALESCE(dt.code, '') NOT IN (${list(src.excludeCodes)})`);
      where.push('COALESCE(dt.is_active, 1) = 1');
    }
    const select = [
      't.id',
      cols.has('status') ? 't.status' : 'NULL AS status',
      src.table === 'drawings'
        ? '(SELECT r.revision FROM drawing_revisions r WHERE r.drawing_id = t.id ORDER BY r.created_at DESC LIMIT 1) AS version'
        : version
          ? `t.${version} AS version`
          : 'NULL AS version',
      updated ? `t.${updated} AS updated_at` : 'NULL AS updated_at',
      title ? `t.${title} AS title` : 'NULL AS title',
      src.table === 'documents'
        ? 't.url, t.filename'
        : 'NULL AS url, NULL AS filename',
      cols.has('document_type_id')
        ? 't.document_type_id'
        : 'NULL AS document_type_id',
    ].join(', ');
    const sqlWhere = where.join(' AND ');
    try {
      const [count] = await this.q<{ n: number }>(
        `SELECT COUNT(*) AS n FROM ${src.table} t${join} WHERE ${sqlWhere}`,
        projectId,
        hiddenTypes,
      );
      const n = Number(count?.n) || 0;
      if (!n) return empty;
      const [latest] = await this.q<NonNullable<HubEntry['latest']>>(
        `SELECT ${select} FROM ${src.table} t${join} WHERE ${sqlWhere}
          ORDER BY ${updated ? `t.${updated}` : 't.id'} DESC LIMIT 1`,
        projectId,
        hiddenTypes,
      );
      return { count: n, latest: latest ?? null };
    } catch {
      return empty;
    }
  }

  /** Activity log rows for this project (and records inside it). */
  @RequirePermission('projects:read')
  @Get(':id/activity')
  async activity(
    @Param('id', ParseUUIDPipe) projectId: string,
    @Query('limit') limit = '50',
  ) {
    const n = Math.min(Math.max(Number(limit) || 50, 1), 200);
    return this.sequelize.query(
      `SELECT * FROM activity_logs
        WHERE entity_id = :projectId
           OR JSON_UNQUOTE(JSON_EXTRACT(changes, '$.project_id')) = :projectId
           OR JSON_UNQUOTE(JSON_EXTRACT(changes, '$.projectId')) = :projectId
        ORDER BY created_at DESC LIMIT ${n}`,
      { replacements: { projectId }, type: QueryTypes.SELECT },
    );
  }
}

/** Counts shown on the /dashboard launcher tiles (Dashboard.jsx BADGE_MAP). */
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class AppBadgesController {
  constructor(@InjectConnection() private readonly sequelize: Sequelize) {}

  @RequirePermission('dashboard:read')
  @Get('app-badges')
  async appBadges() {
    const [row] = await this.sequelize.query<Record<string, string | number>>(
      `SELECT
         (SELECT COUNT(*) FROM boqs WHERE deleted_at IS NULL AND status = 'awaiting_approval') AS boq,
         (SELECT COUNT(*) FROM calendar_events WHERE DATE(starts_at) = CURDATE()) AS calendar`,
      { type: QueryTypes.SELECT },
    );
    return {
      boq: Number(row?.boq) || 0,
      calendar: Number(row?.calendar) || 0,
    };
  }
}
