import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { QueryTypes } from 'sequelize';

export interface EvidenceResult {
  satisfied: boolean;
  source: 'DATABASE' | 'UPLOAD' | 'DRAWING';
  sourceTable: string;
  sourceLabel: string;
  recordId: string | null;
  status: string;
  detail: string;
  actionUrl?: string;
}

interface NativeSource {
  table: string;
  label: string;
  route: string;
  deleted?: boolean;
  version?: boolean;
  filter?: string;
  fields?: string;
  /** created-at column when the table uses camelCase timestamps */
  createdCol?: string;
  accepted: string[];
  approved: string[];
  check?: (row: Record<string, any>) => boolean;
}

// Only developer-reviewed identifiers/SQL are allowed here. Catalogue values and
// request parameters never become SQL identifiers or arbitrary predicates.
const brief: NativeSource = {
  table: 'project_briefs',
  label: 'Project brief',
  route: '/crm/brief/all',
  deleted: true,
  version: true,
  accepted: ['READY_FOR_DESIGN', 'SIGNED_OFF'],
  approved: ['SIGNED_OFF'],
};
const recce: NativeSource = {
  table: 'site_recces',
  label: 'Site recce',
  route: '/crm/recce/all',
  deleted: true,
  fields: "'RECORDED' AS status, existing_condition",
  accepted: ['RECORDED'],
  approved: [],
};
const plan: NativeSource = {
  table: 'plan_of_actions',
  label: 'Plan of action',
  route: '/crm/plan-of-action/all',
  deleted: true,
  version: true,
  accepted: ['PUBLISHED'],
  approved: ['PUBLISHED'],
};
const estimate: NativeSource = {
  table: 'budget_estimates',
  label: 'Budget estimate',
  route: '/ledger/budget-estimates/all',
  version: true,
  accepted: ['SUBMITTED', 'APPROVED'],
  approved: ['APPROVED'],
};
const boq: NativeSource = {
  table: 'boqs',
  label: 'BOQ',
  route: '/ledger/boq/all',
  deleted: true,
  version: true,
  accepted: ['PENDING_APPROVAL', 'APPROVED'],
  approved: ['APPROVED'],
};

export const NATIVE_EVIDENCE: Readonly<Record<string, NativeSource>> = {
  BRIEF_CLIENT_BRIEF: brief,
  BRIEF_SCOPE_OF_WORK: {
    table: 'scope_of_work',
    label: 'Scope of work',
    route: '/crm/scope-of-work/all',
    deleted: true,
    version: true,
    accepted: ['APPROVED', 'ACCEPTED'],
    approved: ['APPROVED', 'ACCEPTED'],
  },
  RECCE_SITE_RECCE: recce,
  RECCE_SITE_ANALYSIS: {
    ...recce,
    check: (row) => !!row.existing_condition?.trim(),
  },
  RECCE_SITE_BRIEF: {
    ...recce,
    check: (row) => !!row.existing_condition?.trim(),
  },
  PLAN_PAYMENT_SCHEDULE: {
    table: 'payment_schedules',
    label: 'Payment schedule',
    route: '/ledger/payment-schedule/all',
    deleted: true,
    fields: 'status, accepted_by_client',
    accepted: ['ACTIVE', 'COMPLETED'],
    approved: ['ACTIVE', 'COMPLETED'],
    check: (row) => Number(row.accepted_by_client) === 1,
  },
  PLAN_PAYMENT_RECEIPT: {
    table: 'payment_schedule_milestones',
    label: 'Token payment',
    route: '/ledger/payment-schedule/all',
    filter: "milestone_code = 'TOKEN'",
    accepted: ['PAID'],
    approved: ['PAID'],
  },
  PLAN_EXECUTION_PLAN: plan,
  PLAN_DRAWINGS_PLAN: {
    table: 'project_planners',
    label: 'Consultancy drawings planner',
    route: '/projects',
    deleted: true,
    filter: "type = 'CONSULTANCY'",
    fields:
      "'PLANNED' AS status, is_active, planned_start_date, planned_end_date, (SELECT COUNT(*) FROM project_planner_items i WHERE i.planner_id = project_planners.id AND i.deleted_at IS NULL) AS item_count",
    accepted: ['PLANNED'],
    approved: [],
    check: (row) =>
      Number(row.is_active) === 1 &&
      Number(row.item_count) > 0 &&
      !!row.planned_start_date &&
      !!row.planned_end_date,
  },
  PLAN_PROJECT_TIMELINE: {
    ...plan,
    fields:
      'status, total_phases, total_duration_min_days, total_duration_max_days',
    check: (row) =>
      Number(row.total_phases) > 0 &&
      (Number(row.total_duration_min_days) > 0 ||
        Number(row.total_duration_max_days) > 0),
  },
  PLAN_INITIAL_ESTIMATE: estimate,
  PLAN_STANDARD_BOQ: boq,
  VENDOR_ESTIMATE: estimate,
  VENDOR_BOQ: boq,
  EXEC_FINAL_BOQ: { ...boq, accepted: ['APPROVED'] },
  // INOS documents that are records, not uploads: the record itself is the evidence.
  MAT_MATERIAL_REQUIREMENT: {
    table: 'material_procurements',
    label: 'Procurement sheet',
    route: '/procurement/material-procurement/list',
    accepted: ['SUBMITTED', 'IN_PROGRESS', 'PROCURED'],
    approved: ['SUBMITTED', 'IN_PROGRESS', 'PROCURED'],
  },
  MAT_MATERIAL_RATES_SHEET: {
    table: 'vendor_rate_comparisons',
    label: 'Vendor comparison sheet',
    route: '/procurement/vendors/rate-comparison',
    fields: "'SAVED' AS status",
    accepted: ['SAVED'],
    approved: ['SAVED'],
  },
  MAT_PURCHASE_ORDERS: {
    table: 'purchase_orders',
    label: 'Purchase order',
    route: '/procurement/purchase-orders',
    accepted: ['APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED'],
    approved: ['APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED'],
  },
  MAT_DELIVERY_CHALLANS: {
    table: 'delivery_challans',
    label: 'Delivery challan',
    route: '/procurement/delivery-challans',
    createdCol: 'createdAt',
    accepted: ['RECEIVED', 'PARTIALLY_ACCEPTED'],
    approved: ['RECEIVED', 'PARTIALLY_ACCEPTED'],
  },
  MAT_SITE_INVENTORY_REGISTER: {
    table: 'inventory_transactions',
    label: 'Site inventory',
    route: '/inventory/site-inventory/all',
    fields: "'RECORDED' AS status",
    accepted: ['RECORDED'],
    approved: ['RECORDED'],
  },
  EXEC_QC_CHECKLIST_TEMPLATE: {
    table: 'quality_checklists',
    label: 'Checklist',
    route: '/site-operations/checklists',
    deleted: true,
    accepted: ['IN_PROGRESS', 'PASSED'],
    approved: ['PASSED'],
  },
  EXEC_DAILY_PROGRESS_REPORT: {
    table: 'daily_site_reports',
    label: 'Daily site report',
    route: '/site-operations/daily-reports',
    accepted: ['SUBMITTED'],
    approved: ['SUBMITTED'],
  },
  EXEC_ARCHITECT_SITE_VISIT_SCHEDULE: {
    table: 'visit_assignments',
    label: 'Architect site visit schedule',
    route: '/site-operations/visit-assignments',
    fields: "'SCHEDULED' AS status",
    accepted: ['SCHEDULED'],
    approved: ['SCHEDULED'],
  },
  HANDOVER_SNAG_LIST: {
    table: 'snag_lists',
    label: 'Snag list',
    route: '/site-operations/snag-lists',
    fields: "'RECORDED' AS status",
    accepted: ['RECORDED'],
    approved: ['RECORDED'],
  },
};

@Injectable()
export class NativeEvidenceService {
  constructor(@InjectConnection() private readonly sequelize: Sequelize) {}

  async resolve(
    projectId: string,
    code: string,
    requireApproval: boolean,
  ): Promise<EvidenceResult | null> {
    const config = NATIVE_EVIDENCE[code];
    if (!config) return null;
    // Read the newest record before checking status: a new draft or rejection
    // must not be hidden by an old approved record.
    const projectFilter =
      config.table === 'payment_schedule_milestones'
        ? "payment_schedule_id = (SELECT id FROM payment_schedules WHERE project_id = :projectId AND deleted_at IS NULL AND status IN ('ACTIVE','COMPLETED') ORDER BY created_at DESC, id DESC LIMIT 1)"
        : 'project_id = :projectId';
    const rows = await this.sequelize.query<Record<string, any>>(
      `SELECT id, ${config.fields ?? 'status'} FROM ${config.table} WHERE ${projectFilter}${config.deleted ? ' AND deleted_at IS NULL' : ''}${config.filter ? ` AND ${config.filter}` : ''} ORDER BY ${config.version ? 'version DESC, ' : ''}${config.createdCol ?? 'created_at'} DESC, id DESC LIMIT 1`,
      { replacements: { projectId }, type: QueryTypes.SELECT },
    );
    const row = rows[0];
    const status = String(row?.status ?? 'MISSING').toUpperCase();
    const satisfied =
      !!row &&
      (requireApproval ? config.approved : config.accepted).includes(status) &&
      (!config.check || config.check(row));
    return {
      satisfied,
      source: 'DATABASE',
      sourceTable: config.table,
      sourceLabel: config.label,
      recordId: row?.id ?? null,
      status,
      detail: satisfied
        ? `${config.label} meets this requirement (${status}).`
        : `${config.label}: ${status}. Complete or approve the record in its source module.`,
      actionUrl: row
        ? ((
            {
              project_briefs: `/crm/brief/${row.id}`,
              scope_of_work: `/crm/scope-of-work/${row.id}`,
              site_recces: `/crm/recce/${row.id}`,
              plan_of_actions: `/crm/plan-of-action/${row.id}`,
              payment_schedules: `/ledger/payment-schedule/${row.id}`,
              budget_estimates: `/ledger/budget-estimate/${row.id}`,
              boqs: `/ledger/boq/${row.id}`,
              project_planners: `/projects/${encodeURIComponent(projectId)}`,
              material_procurements: `/procurement/material-procurement/${row.id}`,
              vendor_rate_comparisons: `/procurement/vendors/rate-comparison/${row.id}/edit`,
              purchase_orders: `/procurement/purchase-orders/${row.id}`,
              delivery_challans: `/procurement/delivery-challans/${row.id}`,
            } as Record<string, string>
          )[config.table] ?? config.route)
        : config.route,
    };
  }
}
