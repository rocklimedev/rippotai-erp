import { Injectable } from '@nestjs/common';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Actor, DocFlowService } from './doc-flow.service';
import { DOC_TYPES, DocType } from './doc-registry';

// "My approvals": every flow document waiting for the current user's
// decision. A document is waiting when its own status is one of its type's
// pending states (submitted / awaiting approval / under review …) and no
// review was recorded since it was last saved. Only types the user can review
// (Full access on the type's part, or ADMIN / SUPERADMIN) are included.

const COMMON_PENDING = [
  'submitted',
  'pending',
  'pending_approval',
  'awaiting_approval',
  'pending_review',
  'under_review',
  'in_review',
  'review',
];

// Per type: extra pending states, the column holding the document number and
// the column used as its name. A short code is derived from the project code
// when the type has no number of its own (e.g. CB-PRJ-001).
const PENDING: Record<
  string,
  {
    extra?: string[];
    only?: string[];
    codeCol?: string;
    nameCol?: string;
    prefix: string;
  }
> = {
  'client-brief': { extra: ['ready_for_design'], prefix: 'CB' },
  'scope-of-work': { prefix: 'SOW' },
  'procurement-sheet': { codeCol: 'procurement_no', prefix: 'PS' },
  boq: { codeCol: 'boq_number', nameCol: 'title', prefix: 'BOQ' },
  quotation: {
    codeCol: 'quotation_number',
    nameCol: 'vendor_name',
    prefix: 'QTN',
  },
  'purchase-order': {
    only: ['pending_approval'],
    codeCol: 'po_number',
    nameCol: 'agency_name',
    prefix: 'PO',
  },
  'work-order': {
    only: ['pending_approval'],
    codeCol: 'wo_id',
    nameCol: 'contractor_company_name',
    prefix: 'WO',
  },
  checklist: { only: ['completed'], nameCol: 'checklist_name', prefix: 'CL' },
  document: { codeCol: 'doc_no', nameCol: 'title', prefix: 'DOC' },
};

export type PendingApproval = {
  type: string;
  type_label: string;
  id: string;
  code: string | null;
  name: string | null;
  version: number | null;
  status: string;
  project_id: string | null;
  project_name: string | null;
  project_code: string | null;
  submitted_by: string | null;
  submitted_by_name: string | null;
  since: string | null;
};

const SAFE = /^[a-z_]+$/;
const q = (ident: string) => {
  if (!SAFE.test(ident)) throw new Error(`Unsafe identifier ${ident}`);
  return '`' + ident + '`';
};

@Injectable()
export class ApprovalsService {
  private cols = new Map<string, Set<string>>();

  constructor(
    private readonly sequelize: Sequelize,
    private readonly flow: DocFlowService,
  ) {}

  private async columns(table: string) {
    if (this.cols.has(table)) return this.cols.get(table)!;
    const rows: { c: string }[] = await this.sequelize.query(
      `SELECT COLUMN_NAME AS c FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table`,
      { replacements: { table }, type: QueryTypes.SELECT },
    );
    const set = new Set(rows.map((r) => r.c));
    this.cols.set(table, set);
    return set;
  }

  private async pendingOf(d: DocType): Promise<PendingApproval[]> {
    const cfg = PENDING[d.key];
    if (!cfg || !d.statusCol || d.projectLevel) return [];
    const cols = await this.columns(d.table);
    const has = (c?: string) => !!c && SAFE.test(c) && cols.has(c);
    if (!has(d.statusCol)) return [];
    const projectCols = await this.columns('projects');
    const states = cfg.only ?? [...COMMON_PENDING, ...(cfg.extra ?? [])];
    const t = (c?: string) => (has(c) ? `t.${q(c!)}` : 'NULL');
    const updated = has('updated_at')
      ? has('created_at')
        ? 'COALESCE(t.updated_at, t.created_at)'
        : 't.updated_at'
      : t('created_at');
    const owner = has(d.ownerCol) ? `t.${q(d.ownerCol!)}` : null;
    const project = has(d.projectCol ?? undefined)
      ? `t.${q(d.projectCol!)}`
      : null;
    const rows: any[] = await this.sequelize.query(
      `SELECT t.id, ${t(d.statusCol)} AS status, ${t(cfg.codeCol)} AS code,
              ${t(cfg.nameCol)} AS name, ${t(d.versionCol)} AS version,
              ${project ?? 'NULL'} AS project_id, p.name AS project_name,
              ${projectCols.has('code') ? 'p.code' : 'NULL'} AS project_code,
              ${owner ?? 'NULL'} AS submitted_by, u.name AS submitted_by_name,
              ${updated} AS since
         FROM ${q(d.table)} t
         ${project ? `LEFT JOIN projects p ON p.id = ${project}` : 'LEFT JOIN projects p ON 1 = 0'}
         ${owner ? `LEFT JOIN users u ON u.id = ${owner}` : 'LEFT JOIN users u ON 1 = 0'}
        WHERE LOWER(${t(d.statusCol)}) IN (:states)
          ${has(d.deletedCol) ? `AND t.${q(d.deletedCol!)} IS NULL` : ''}
          AND NOT EXISTS (
            SELECT 1 FROM document_reviews r
             WHERE r.entity_type = :type AND r.entity_id = t.id
               AND r.created_at >= ${updated})
        ORDER BY since ASC
        LIMIT 500`,
      { replacements: { states, type: d.key }, type: QueryTypes.SELECT },
    );
    return rows.map((r) => {
      const v =
        r.version == null
          ? NaN
          : parseInt(String(r.version).replace(/^v/i, ''), 10);
      return {
        type: d.key,
        type_label: d.label,
        id: r.id,
        code:
          r.code ||
          (r.project_code ? `${cfg.prefix}-${r.project_code}` : cfg.prefix),
        name: r.name || d.label,
        version: Number.isFinite(v) ? v : null,
        status: r.status,
        project_id: r.project_id,
        project_name: r.project_name,
        project_code: r.project_code,
        submitted_by: r.submitted_by,
        submitted_by_name: r.submitted_by_name,
        since: r.since,
      };
    });
  }

  /** Documents waiting for this user's review, oldest first. */
  async pending(actor: Actor) {
    const out: PendingApproval[] = [];
    for (const d of DOC_TYPES) {
      if (!PENDING[d.key]) continue;
      if (!(await this.flow.canReview(actor, d))) continue;
      out.push(...(await this.pendingOf(d)));
    }
    out.sort(
      (a, b) =>
        new Date(a.since ?? 0).getTime() - new Date(b.since ?? 0).getTime(),
    );
    return out;
  }

  async count(actor: Actor) {
    return { count: (await this.pending(actor)).length };
  }
}
