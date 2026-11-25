// Record context for document detail pages (status, project, linked records,
// uploaded file versions) and the project "Recent activity" feed.
// Tables and columns come from the registry / fixed maps below, never from
// the request.
import { Injectable, NotFoundException } from '@nestjs/common';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { DOC_TYPES, docType, DocType } from './doc-registry';
import { Actor, DocFlowService } from './doc-flow.service';
import { LEVEL_RANK } from '../rbac/access-catalogue';

const SAFE = /^[A-Za-z_]+$/;
const q = (ident: string) => {
  if (!SAFE.test(ident)) throw new Error(`Unsafe identifier ${ident}`);
  return '`' + ident + '`';
};

/** Native document numbers. */
export const NUMBER_COL: Record<string, string> = {
  boq: 'boq_number',
  quotation: 'quotation_number',
  'purchase-order': 'po_number',
  'work-order': 'wo_id',
  'delivery-challan': 'challan_number',
  'procurement-sheet': 'procurement_no',
  document: 'doc_no',
  drawing: 'drawing_number',
};

/** Human title of a record, when the table has one. */
export const TITLE_COL: Record<string, string> = {
  boq: 'title',
  'vendor-comparison': 'title',
  'budget-guide': 'title',
  'plan-of-action': 'title',
  'payment-schedule': 'title',
  'business-proposal': 'title',
  'snag-list': 'title',
  'project-planner': 'name',
  document: 'title',
  drawing: 'title',
  quotation: 'vendor_name',
};

/** Project documents linked to each other through the project (latest of each). */
const vnum = (v: unknown) =>
  parseInt(String(v ?? '').replace(/\D/g, ''), 10) || 1;

const PROJECT_CHAIN = [
  'client-brief',
  'site-recce',
  'scope-of-work',
  'plan-of-action',
  'payment-schedule',
];

export interface LinkedRecord {
  type: string;
  id: string;
  number: string | null;
  title: string | null;
  status: string | null;
  relation?: string;
  count?: number;
}

@Injectable()
export class RecordContextService {
  private cols = new Map<string, Set<string>>();
  private colsAt = 0;

  constructor(
    private readonly sequelize: Sequelize,
    private readonly flow: DocFlowService,
  ) {}

  private async columns(table: string) {
    if (!this.cols.size || Date.now() - this.colsAt > 300_000) {
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
      this.cols = map;
      this.colsAt = Date.now();
    }
    return this.cols.get(table) ?? new Set<string>();
  }

  private async select<T extends object = any>(
    sql: string,
    replacements: any = {},
  ): Promise<T[]> {
    return this.sequelize.query<T>(sql, {
      replacements,
      type: QueryTypes.SELECT,
    });
  }

  private async canRead(actor: Actor, d: DocType) {
    try {
      return LEVEL_RANK[await this.flow.levelOf(actor, d)] >= LEVEL_RANK.view;
    } catch {
      return false;
    }
  }

  /** id / number / title / status / timestamps of rows of a type. */
  private async describe(
    d: DocType,
    where: string,
    replacements: any,
    limit = 20,
  ): Promise<(LinkedRecord & { created_at?: any; updated_at?: any })[]> {
    const cols = await this.columns(d.table);
    if (!cols.has('id')) return [];
    const num = NUMBER_COL[d.key];
    const title = TITLE_COL[d.key];
    const created = cols.has('created_at')
      ? 'created_at'
      : cols.has('createdAt')
        ? 'createdAt'
        : null;
    const updated = cols.has('updated_at')
      ? 'updated_at'
      : cols.has('updatedAt')
        ? 'updatedAt'
        : created;
    const parts = [
      'id',
      num && cols.has(num) ? `${q(num)} AS number` : 'NULL AS number',
      title && cols.has(title) ? `${q(title)} AS title` : 'NULL AS title',
      d.statusCol && cols.has(d.statusCol)
        ? `${q(d.statusCol)} AS status`
        : 'NULL AS status',
      created ? `${q(created)} AS created_at` : 'NULL AS created_at',
      updated ? `${q(updated)} AS updated_at` : 'NULL AS updated_at',
    ];
    const conds = [where];
    if (d.deletedCol && cols.has(d.deletedCol))
      conds.push(`${q(d.deletedCol)} IS NULL`);
    try {
      const rows = await this.select<any>(
        `SELECT ${parts.join(', ')} FROM ${q(d.table)} WHERE ${conds.join(' AND ')}
          ORDER BY ${updated ? q(updated) : 'id'} DESC LIMIT ${Math.max(1, Math.min(limit, 50))}`,
        replacements,
      );
      return rows.map((r) => ({ type: d.key, ...r }));
    } catch {
      return [];
    }
  }

  /* -------------------------------------------------------------- context */

  async context(actor: Actor, type: string, id: string) {
    const d = this.flow.type(type);
    if (!(await this.canRead(actor, d)))
      throw new NotFoundException(`${d.label} not found.`);
    if (!id) throw new NotFoundException(`${d.label} not found.`);
    const [row] = await this.select<any>(
      `SELECT * FROM ${q(d.table)} WHERE id = :id LIMIT 1`,
      { id },
    );
    if (!row) throw new NotFoundException(`${d.label} not found.`);

    const projectId = d.projectCol ? (row[d.projectCol] ?? null) : null;
    const project = projectId ? await this.project(projectId) : null;

    const ownerId = d.ownerCol ? row[d.ownerCol] : row.created_by;
    let createdBy: string | null = row.uploaded_by_name ?? null;
    if (!createdBy && ownerId) {
      const [u] = await this.select<any>(
        'SELECT name FROM users WHERE id = :id',
        { id: ownerId },
      );
      createdBy = u?.name ?? null;
    }

    const version = d.versionCol
      ? parseInt(String(row[d.versionCol] ?? '').replace(/^v/i, ''), 10) || null
      : null;

    return {
      type: d.key,
      label: d.label,
      id: row.id,
      number: NUMBER_COL[d.key] ? (row[NUMBER_COL[d.key]] ?? null) : null,
      title: TITLE_COL[d.key] ? (row[TITLE_COL[d.key]] ?? null) : null,
      status: d.statusCol ? (row[d.statusCol] ?? null) : null,
      version,
      created_at: row.created_at ?? row.createdAt ?? null,
      updated_at: row.updated_at ?? row.updatedAt ?? null,
      created_by: createdBy,
      project,
      linked: d.projectLevel ? [] : await this.linked(actor, d, row),
      files: await this.files(d, row),
    };
  }

  private async project(projectId: string) {
    const cols = await this.columns('projects');
    const [p] = await this.select<any>(
      `SELECT id, name, status, current_phase${cols.has('code') ? ', code' : ', NULL AS code'}
         FROM projects WHERE id = :projectId`,
      { projectId },
    );
    return p ?? null;
  }

  private async linked(actor: Actor, d: DocType, row: any) {
    const out: LinkedRecord[] = [];
    const add = async (
      key: string,
      where: string,
      replacements: any,
      relation?: string,
      limit = 5,
    ) => {
      const t = docType(key);
      if (!t || !(await this.canRead(actor, t))) return;
      for (const r of await this.describe(t, where, replacements, limit))
        if (!out.some((o) => o.type === r.type && o.id === r.id))
          out.push({
            type: r.type,
            id: r.id,
            number: r.number ?? null,
            title: r.title ?? null,
            status: r.status ?? null,
            relation,
          });
    };
    const projectId = d.projectCol ? row[d.projectCol] : null;
    const latestOfProject = (key: string, relation?: string) =>
      projectId
        ? add(key, 'project_id = :projectId', { projectId }, relation, 1)
        : Promise.resolve();

    switch (d.key) {
      case 'quotation':
        if (row.comparison_id) {
          await add('vendor-comparison', 'id = :id', { id: row.comparison_id });
          const [c] = await this.select<any>(
            'SELECT boq_id FROM vendor_rate_comparisons WHERE id = :id',
            { id: row.comparison_id },
          );
          if (c?.boq_id) await add('boq', 'id = :id', { id: c.boq_id });
        }
        if (row.purchase_order_id)
          await add('purchase-order', 'id = :id', {
            id: row.purchase_order_id,
          });
        if (row.work_order_id)
          await add('work-order', 'id = :id', { id: row.work_order_id });
        break;
      case 'vendor-comparison':
        if (row.boq_id) await add('boq', 'id = :id', { id: row.boq_id });
        await add('quotation', 'comparison_id = :id', { id: row.id });
        break;
      case 'purchase-order':
        await add('quotation', 'purchase_order_id = :id', { id: row.id });
        await add('delivery-challan', 'purchase_order_id = :id', {
          id: row.id,
        });
        break;
      case 'work-order': {
        await add('quotation', 'work_order_id = :id', { id: row.id });
        const stages = await this.select<any>(
          'SELECT COUNT(*) AS n FROM work_order_payment_stages WHERE work_order_id = :id',
          { id: row.id },
        ).catch(() => []);
        const n = Number(stages[0]?.n) || 0;
        if (n)
          out.push({
            type: 'work-order-payments',
            id: row.id,
            number: null,
            title: 'Payment stages',
            status: null,
            count: n,
          });
        break;
      }
      case 'delivery-challan':
        if (row.purchase_order_id)
          await add('purchase-order', 'id = :id', {
            id: row.purchase_order_id,
          });
        break;
      case 'boq':
        await latestOfProject('budget-guide');
        await add('vendor-comparison', 'boq_id = :id', { id: row.id });
        break;
      case 'budget-guide':
        await latestOfProject('boq');
        break;
      default:
        if (PROJECT_CHAIN.includes(d.key))
          for (const key of PROJECT_CHAIN)
            if (key !== d.key) await latestOfProject(key);
    }
    return out;
  }

  /** Uploaded file versions (documents / drawings); the current file replaces its own version row. */
  private async files(d: DocType, row: any) {
    try {
      if (d.key === 'document') {
        const versions = await this.select<any>(
          `SELECT id, version, filename, url, mime, status, remarks,
                  uploaded_by_name AS user_name, created_at
             FROM document_versions WHERE document_id = :id
            ORDER BY version DESC, created_at DESC`,
          { id: row.id },
        );
        const current = {
          id: row.id,
          version: row.version,
          filename: row.filename,
          url: row.url,
          mime: row.mime,
          status: row.status,
          remarks: row.remarks,
          user_name: row.uploaded_by_name,
          created_at: row.updated_at ?? row.created_at,
          current: true,
        };
        return [
          current,
          ...versions.filter((v) => vnum(v.version) !== vnum(row.version)),
        ];
      }
      if (d.key === 'drawing') {
        const revs = await this.select<any>(
          `SELECT id, revision AS version, filename, url, mime, status,
                  COALESCE(NULLIF(remarks, ''), issue_purpose) AS remarks,
                  uploaded_by_name AS user_name, created_at
             FROM drawing_revisions WHERE drawing_id = :id
            ORDER BY created_at DESC`,
          { id: row.id },
        );
        return revs.map((r, i) => ({ ...r, current: i === 0 }));
      }
    } catch {
      /* table missing on an older database */
    }
    return [];
  }

  /* -------------------------------------------------------- recent activity */

  async recentActivity(actor: Actor, projectId: string, limit = 8) {
    const n = Math.max(1, Math.min(Number(limit) || 8, 30));
    const events: any[] = [];
    const readable = new Map<string, boolean>();
    for (const d of DOC_TYPES)
      readable.set(d.key, !d.projectLevel && (await this.canRead(actor, d)));

    // Document created / updated (one event per record).
    for (const d of DOC_TYPES) {
      if (!readable.get(d.key) || !d.projectCol) continue;
      const cols = await this.columns(d.table);
      if (!cols.has(d.projectCol)) continue;
      const rows = await this.describe(
        d,
        `${q(d.projectCol)} = :projectId`,
        { projectId },
        n,
      );
      for (const r of rows) {
        const created = r.created_at ? new Date(r.created_at).getTime() : 0;
        const updated = r.updated_at ? new Date(r.updated_at).getTime() : 0;
        const isUpdate = updated - created > 60_000;
        const upload = d.key === 'document' || d.key === 'drawing';
        events.push({
          kind: isUpdate ? 'updated' : upload ? 'uploaded' : 'created',
          at: isUpdate ? r.updated_at : r.created_at,
          type: d.key,
          label: d.label,
          id: r.id,
          number: r.number ?? null,
          title: r.title ?? null,
          status: r.status ?? null,
        });
      }
    }

    // Reviews.
    const reviews = await this.select<any>(
      `SELECT r.entity_type, r.entity_id, r.action, r.comment, r.version, r.created_at,
              u.name AS user_name
         FROM document_reviews r LEFT JOIN users u ON u.id = r.user_id
        WHERE r.project_id = :projectId
        ORDER BY r.created_at DESC LIMIT ${n}`,
      { projectId },
    ).catch(() => []);
    for (const r of reviews) {
      const d = docType(r.entity_type);
      if (!d || !readable.get(d.key)) continue;
      events.push({
        kind: 'review',
        action: r.action,
        at: r.created_at,
        type: d.key,
        label: d.label,
        id: r.entity_id,
        version: r.version,
        comment: r.comment,
        user: r.user_name,
      });
    }

    // New versions of uploaded files.
    if (readable.get('document')) {
      const rows = await this.select<any>(
        `SELECT v.document_id AS id, v.version, v.created_at, v.uploaded_by_name AS user_name,
                d.title, d.doc_no AS number
           FROM document_versions v JOIN documents d ON d.id = v.document_id
          WHERE d.project_id = :projectId AND v.version > 1
          ORDER BY v.created_at DESC LIMIT ${n}`,
        { projectId },
      ).catch(() => []);
      for (const r of rows)
        events.push({
          kind: 'uploaded',
          at: r.created_at,
          type: 'document',
          label: 'Document',
          id: r.id,
          version: r.version,
          number: r.number,
          title: r.title,
          user: r.user_name,
        });
    }
    if (readable.get('drawing')) {
      const rows = await this.select<any>(
        `SELECT v.drawing_id AS id, v.revision AS version, v.created_at, v.uploaded_by_name AS user_name,
                d.title, d.drawing_number AS number
           FROM drawing_revisions v JOIN drawings d ON d.id = v.drawing_id
          WHERE d.project_id = :projectId
          ORDER BY v.created_at DESC LIMIT ${n}`,
        { projectId },
      ).catch(() => []);
      for (const r of rows)
        events.push({
          kind: 'uploaded',
          at: r.created_at,
          type: 'drawing',
          label: 'Drawing',
          id: r.id,
          version: r.version,
          number: r.number,
          title: r.title,
          user: r.user_name,
        });
    }

    // Project changes (stage / status / details) from the activity log.
    const logs = await this.select<any>(
      `SELECT a.action, a.entity_label, a.changes, a.created_at, u.name AS user_name
         FROM activity_logs a LEFT JOIN users u ON u.id = a.user_id
        WHERE a.entity_id = :projectId AND UPPER(a.entity_type) = 'PROJECT'
        ORDER BY a.created_at DESC LIMIT ${n}`,
      { projectId },
    ).catch(() => []);
    for (const l of logs)
      events.push({
        kind: 'project',
        action: l.action,
        at: l.created_at,
        type: 'project',
        label: 'Project',
        id: projectId,
        title: l.entity_label,
        user: l.user_name,
      });

    // Newest first; a record's created/updated event yields to a review or
    // upload at the same moment.
    // Drop documents whose type was switched off (e.g. Scope of Approval).
    const docIds = [
      ...new Set(events.filter((e) => e.type === 'document').map((e) => e.id)),
    ];
    if (docIds.length) {
      const hidden = await this.select<any>(
        `SELECT d.id FROM documents d JOIN document_types t ON t.id = d.document_type_id
          WHERE d.id IN (:docIds) AND t.is_active = 0`,
        { docIds },
      ).catch(() => []);
      const off = new Set(hidden.map((h: any) => h.id));
      for (let i = events.length - 1; i >= 0; i--)
        if (events[i].type === 'document' && off.has(events[i].id))
          events.splice(i, 1);
    }
    events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    const seen = new Set<string>();
    const out: any[] = [];
    for (const e of events) {
      if (!e.at) continue;
      const k = `${e.kind}:${e.type}:${e.id}:${e.version ?? ''}:${e.action ?? ''}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(e);
      if (out.length >= n) break;
    }
    return out;
  }
}
