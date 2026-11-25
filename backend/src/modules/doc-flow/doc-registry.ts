// Registry of the flow documents shared by the document list, the review
// workflow and the revision snapshots. One entry per document type.
//
// table       – main table holding one row per document (or `projects` for
//               project-level registers such as Site Inventory).
// part        – access-catalogue part; Full access on it (or ADMIN /
//               SUPERADMIN) makes a user a reviewer, any access lets them read
//               the review history.
// statusCol   – the model's own status column, updated from a review result
//               through statusMap (only from the listed `from` states when
//               given, so business states such as SENT / RECEIVED are never
//               rewound).
// versionCol  – the model's version number. bumpVersion: INOS increments it
//               when a save creates a snapshot (models that bump it in their
//               own service leave this false).
// snapshot    – controller + handler path of the "save" endpoint; the
//               snapshot interceptor stores the previous state before it runs.

export type ReviewAction = 'approve' | 'revise' | 'reject' | 'archive';

export interface DocType {
  key: string;
  label: string;
  table: string;
  part: string;
  projectCol: string | null;
  statusCol?: string;
  statusMap?: Partial<
    Record<
      ReviewAction,
      | { to: string; from?: string[]; set?: Record<string, 'user' | 'now'> }
      | string
    >
  >;
  ownerCol?: string;
  deletedCol?: string;
  versionCol?: string;
  bumpVersion?: boolean;
  // Rows of one project form a version chain (brief / BOQ new-version rows).
  versionChain?: boolean;
  snapshot?: {
    controller: string;
    path: string;
    param: string;
    // 'child': the param is a child row id — the document is found through child.parentCol.
    by?: 'id' | 'project' | 'child';
    child?: { table: string; parentCol: string };
    methods?: ('PUT' | 'PATCH' | 'POST' | 'DELETE')[];
  }[];
  projectLevel?: boolean;
  // Child rows without a foreign key (or one level down, `via` another child table)
  // that belong to a revision — captured in snapshots and put back on restore.
  children?: { table: string; fk: string; via?: string }[];
  // Generic rows endpoint (types without a flat list API).
  nameCol?: string;
  rowsWhere?: string;
}

const lower = (
  to: string,
  from?: string[],
  set?: Record<string, 'user' | 'now'>,
) => ({ to, from, set });

export const DOC_TYPES: DocType[] = [
  {
    key: 'client-brief',
    label: 'Client Brief',
    table: 'project_briefs',
    part: 'design.client-brief',
    projectCol: 'project_id',
    statusCol: 'status',
    statusMap: {
      approve: 'SIGNED_OFF',
      revise: 'DRAFT',
      reject: 'DRAFT',
      archive: 'ARCHIVED',
    },
    deletedCol: 'deleted_at',
    versionCol: 'version',
    bumpVersion: true,
    versionChain: true,
    snapshot: [
      { controller: 'ProjectBriefsController', path: ':id', param: 'id' },
    ],
  },
  {
    key: 'site-recce',
    label: 'Site Recce',
    table: 'site_recces',
    part: 'design.site-recce',
    projectCol: 'project_id',
    ownerCol: 'created_by',
    deletedCol: 'deleted_at',
    snapshot: [{ controller: 'SiteRecceController', path: ':id', param: 'id' }],
  },
  {
    key: 'scope-of-work',
    label: 'Scope of Work',
    table: 'scope_of_work',
    part: 'design.scope-of-work',
    projectCol: 'project_id',
    statusCol: 'status',
    statusMap: {
      approve: 'APPROVED',
      revise: 'DRAFT',
      reject: 'DRAFT',
    },
    deletedCol: 'deleted_at',
    versionCol: 'version',
    bumpVersion: true,
    snapshot: [
      { controller: 'ScopeOfWorkController', path: 'by-id/:id', param: 'id' },
      {
        controller: 'ScopeOfWorkController',
        path: 'projects/:projectId',
        param: 'projectId',
        by: 'project',
      },
    ],
  },
  {
    key: 'payment-schedule',
    label: 'Payment Schedule',
    table: 'payment_schedules',
    part: 'design.payment-schedule',
    projectCol: 'project_id',
    statusCol: 'status',
    statusMap: { approve: lower('ACTIVE', ['DRAFT']) },
    deletedCol: 'deleted_at',
    snapshot: [
      { controller: 'PaymentSchedulesController', path: ':id', param: 'id' },
    ],
  },
  {
    key: 'plan-of-action',
    label: 'Plan of Action',
    table: 'plan_of_actions',
    part: 'design.plan-of-action',
    projectCol: 'project_id',
    statusCol: 'status',
    statusMap: {
      approve: 'published',
      revise: 'draft',
      reject: 'draft',
      archive: 'archived',
    },
    ownerCol: 'created_by',
    deletedCol: 'deleted_at',
    versionCol: 'version',
    bumpVersion: true,
    snapshot: [
      { controller: 'PlanOfActionsController', path: ':id', param: 'id' },
    ],
  },
  {
    key: 'project-planner',
    label: 'Project Planner',
    table: 'project_planners',
    part: 'projects.planner',
    projectCol: 'project_id',
    ownerCol: 'created_by',
    deletedCol: 'deleted_at',
    nameCol: 'name',
    snapshot: [
      {
        controller: 'ProjectPlannerController',
        path: 'planners/:plannerId',
        param: 'plannerId',
      },
      // Row edits are what change a planner: each add / edit / remove keeps a version.
      {
        controller: 'ProjectPlannerController',
        path: 'planners/:plannerId/items',
        param: 'plannerId',
        methods: ['POST'],
      },
      {
        controller: 'ProjectPlannerController',
        path: 'planners/:plannerId/procurement',
        param: 'plannerId',
        methods: ['POST'],
      },
      ...(['planner-items/:itemId', 'procurement-items/:itemId'] as const).map(
        (path) => ({
          controller: 'ProjectPlannerController',
          path,
          param: 'itemId',
          by: 'child' as const,
          child: {
            table: path.startsWith('planner')
              ? 'project_planner_items'
              : 'project_procurement_items',
            parentCol: 'planner_id',
          },
          methods: ['PATCH', 'DELETE'] as ('PATCH' | 'DELETE')[],
        }),
      ),
    ],
  },
  {
    key: 'business-proposal',
    label: 'Business Proposal',
    table: 'business_proposals',
    part: 'design.business-proposal',
    projectCol: 'project_id',
    ownerCol: 'created_by',
    snapshot: [
      { controller: 'BusinessProposalsController', path: ':id', param: 'id' },
    ],
  },
  {
    key: 'budget-guide',
    label: 'Budget Guide',
    table: 'budget_guides',
    part: 'design.budget-guide',
    projectCol: 'project_id',
    statusCol: 'status',
    statusMap: {
      approve: 'published',
      revise: 'draft',
      reject: 'draft',
      archive: 'archived',
    },
    ownerCol: 'created_by',
    versionCol: 'revision',
    snapshot: [
      { controller: 'BudgetGuideController', path: ':id', param: 'id' },
    ],
  },
  {
    key: 'consent-form',
    label: 'Consent Form',
    table: 'projects',
    part: 'projects.register',
    projectCol: 'id',
    projectLevel: true,
    rowsWhere: 'deleted_at IS NULL AND archived_at IS NULL',
  },
  {
    key: 'vendor-comparison',
    label: 'Vendor Comparison',
    table: 'vendor_rate_comparisons',
    part: 'build.rate-comparison',
    projectCol: 'project_id',
    ownerCol: 'created_by',
    versionCol: 'revision',
    snapshot: [
      {
        controller: 'VendorRateComparisonController',
        path: ':id',
        param: 'id',
      },
    ],
  },
  {
    key: 'procurement-sheet',
    label: 'Procurement Sheet',
    table: 'material_procurements',
    part: 'build.procurement-sheet',
    projectCol: 'project_id',
    statusCol: 'status',
    statusMap: {
      revise: lower('DRAFT', ['SUBMITTED']),
      reject: lower('DRAFT', ['SUBMITTED']),
    },
    ownerCol: 'created_by_id',
    children: [{ table: 'material_procurement_items', fk: 'procurement_id' }],
    snapshot: [
      { controller: 'MaterialProcurementController', path: ':id', param: 'id' },
    ],
  },
  {
    key: 'boq',
    label: 'BOQ',
    table: 'boqs',
    part: 'build.boq',
    projectCol: 'project_id',
    statusCol: 'status',
    statusMap: {
      approve: 'approved',
      revise: 'returned',
      reject: 'returned',
      archive: 'archived',
    },
    ownerCol: 'created_by',
    deletedCol: 'deleted_at',
    versionCol: 'version',
    versionChain: true,
    children: [
      { table: 'boq_items', fk: 'boq_category_id', via: 'boq_categories' },
    ],
    snapshot: [{ controller: 'BoqController', path: ':id', param: 'id' }],
  },
  {
    key: 'quotation',
    label: 'Quotation',
    table: 'procurement_quotations',
    part: 'build.quotation',
    projectCol: 'project_id',
    statusCol: 'status',
    statusMap: {
      approve: {
        to: 'APPROVED',
        set: { approved_by: 'user', approved_at: 'now' },
      },
      revise: 'DRAFT',
      reject: 'REJECTED',
      archive: 'CANCELLED',
    },
    ownerCol: 'created_by',
    versionCol: 'version',
    bumpVersion: false,
  },
  {
    key: 'purchase-order',
    label: 'Purchase Order',
    table: 'purchase_orders',
    part: 'build.purchase-order',
    projectCol: 'project_id',
    statusCol: 'status',
    statusMap: {
      approve: lower('APPROVED', ['DRAFT', 'PENDING_APPROVAL'], {
        approved_by: 'user',
        approved_at: 'now',
      }),
      revise: lower('DRAFT', ['PENDING_APPROVAL']),
      reject: lower('DRAFT', ['PENDING_APPROVAL']),
    },
    ownerCol: 'created_by',
    snapshot: [
      { controller: 'PurchaseOrderController', path: ':id', param: 'id' },
    ],
  },
  {
    key: 'work-order',
    label: 'Work Order',
    table: 'work_orders',
    part: 'build.work-order',
    projectCol: 'project_id',
    statusCol: 'status',
    statusMap: {
      approve: lower('APPROVED', ['DRAFT', 'PENDING_APPROVAL'], {
        updated_by: 'user',
      }),
      revise: lower('DRAFT', ['PENDING_APPROVAL']),
      reject: lower('DRAFT', ['PENDING_APPROVAL']),
    },
    ownerCol: 'created_by',
    snapshot: [
      { controller: 'WorkOrdersController', path: ':id', param: 'id' },
    ],
  },
  {
    key: 'site-inventory',
    label: 'Site Inventory',
    table: 'projects',
    part: 'build.inventory',
    projectCol: 'id',
    projectLevel: true,
    rowsWhere:
      'deleted_at IS NULL AND EXISTS (SELECT 1 FROM inventory_transactions t WHERE t.project_id = projects.id)',
  },
  {
    key: 'delivery-challan',
    label: 'Delivery Challan',
    table: 'delivery_challans',
    part: 'build.delivery-challan',
    projectCol: 'project_id',
    ownerCol: 'created_by',
    snapshot: [
      { controller: 'DeliveryChallanController', path: ':id', param: 'id' },
    ],
  },
  {
    key: 'checklist',
    label: 'Checklist',
    table: 'quality_checklists',
    part: 'build.checklists',
    projectCol: 'project_id',
    statusCol: 'status',
    statusMap: {
      approve: lower('PASSED', ['PENDING', 'IN_PROGRESS', 'COMPLETED']),
      reject: lower('FAILED', ['PENDING', 'IN_PROGRESS', 'COMPLETED']),
    },
    ownerCol: 'created_by',
    deletedCol: 'deleted_at',
    snapshot: [
      { controller: 'QualityChecklistController', path: ':id', param: 'id' },
    ],
  },
  {
    key: 'architect-visit-schedule',
    label: 'Architect Site Visit Schedule',
    table: 'projects',
    part: 'build.site-visits',
    projectCol: 'id',
    projectLevel: true,
    rowsWhere:
      'deleted_at IS NULL AND EXISTS (SELECT 1 FROM visit_assignments v WHERE v.project_id = projects.id)',
  },
  {
    key: 'snag-list',
    label: 'Snag List',
    table: 'snag_lists',
    part: 'build.snag-list',
    projectCol: 'project_id',
    ownerCol: 'created_by',
    versionCol: 'revision',
    snapshot: [{ controller: 'SnagListController', path: ':id', param: 'id' }],
  },
  {
    key: 'daily-site-report',
    label: 'Daily Site Report',
    table: 'daily_site_reports',
    part: 'build.daily-report',
    projectCol: 'project_id',
    ownerCol: 'reported_by',
    snapshot: [
      { controller: 'DailySiteReportController', path: ':id', param: 'id' },
    ],
  },
  {
    key: 'admin-dpr',
    label: 'Admin DPR',
    table: 'admin_dpr_documents',
    part: 'build.admin-dpr',
    projectCol: 'project_id',
    ownerCol: 'created_by',
  },
  {
    key: 'document',
    label: 'Document',
    table: 'documents',
    part: 'projects.documents',
    projectCol: 'project_id',
    statusCol: 'status',
    statusMap: {
      approve: 'approved',
      revise: 'draft',
      reject: 'rejected',
      archive: 'archived',
    },
    ownerCol: 'uploaded_by',
    versionCol: 'version',
  },
  {
    key: 'drawing',
    label: 'Drawing',
    table: 'drawings',
    part: 'design.drawings',
    projectCol: 'project_id',
  },
];

const BY_KEY = new Map(DOC_TYPES.map((d) => [d.key, d]));
export const docType = (key: string) => BY_KEY.get(key);

export function snapshotTargetFor(
  controller: string,
  path: string,
  method = 'PATCH',
) {
  for (const d of DOC_TYPES)
    for (const s of d.snapshot ?? [])
      if (
        s.controller === controller &&
        s.path === path &&
        (s.methods ?? ['PUT', 'PATCH', 'POST']).includes(method as any)
      )
        return { doc: d, target: s };
  return undefined;
}

export const REVIEW_ACTIONS: ReviewAction[] = [
  'approve',
  'revise',
  'reject',
  'archive',
];
