// Access catalogue: App -> documents / parts -> named access level.
//
// The four access levels are cumulative bundles of the existing
// `resource:action` permissions; nothing here creates a parallel grant
// system. A part owns a set of resources (and, for split resources, explicit
// permission names). Setting a level grants every owned permission whose
// action ranks at or below that level and removes the rest.

export type AccessLevel = 'none' | 'view' | 'edit' | 'create' | 'full';

export const ACCESS_LEVELS: ReadonlyArray<{
  key: AccessLevel;
  rank: number;
  label: string;
  description: string;
}> = [
  {
    key: 'none',
    rank: 0,
    label: 'No access',
    description:
      'Hidden. The app or document does not appear and cannot be opened.',
  },
  {
    key: 'view',
    rank: 1,
    label: 'View only',
    description: 'Open, read, print and export. Forms are shown read-only.',
  },
  {
    key: 'edit',
    rank: 2,
    label: 'View & Edit',
    description:
      'Everything in View, plus change existing records, upload files and submit them for review.',
  },
  {
    key: 'create',
    rank: 3,
    label: 'Create',
    description:
      'Everything in View & Edit, plus start new records, issue and deliver them.',
  },
  {
    key: 'full',
    rank: 4,
    label: 'Full access (incl. Remove)',
    description:
      'Everything in Create, plus delete/restore, approve or reject, lock and other final decisions.',
  },
];

export const LEVEL_RANK: Record<AccessLevel, number> = {
  none: 0,
  view: 1,
  edit: 2,
  create: 3,
  full: 4,
};
export const RANK_LEVEL: AccessLevel[] = [
  'none',
  'view',
  'edit',
  'create',
  'full',
];

// Which level an action belongs to. Unknown actions fall back to "full" so a
// new privileged verb is never handed out by a lower level by accident.
export const ACTION_LEVEL: Record<string, AccessLevel> = {
  read: 'view',
  export: 'view',
  'read-any': 'view',

  update: 'edit',
  upload: 'edit',
  submit: 'edit',
  recalculate: 'edit',
  select: 'edit',
  send: 'edit',
  share: 'edit',
  'check-in': 'edit',
  sync: 'edit',
  refresh: 'edit',
  review: 'edit',
  complete: 'edit',
  receive: 'edit',
  assign: 'edit',
  generate: 'edit',
  connect: 'edit',
  execute: 'edit',
  apply: 'edit',

  create: 'create',
  issue: 'create',
  return: 'create',
  transfer: 'create',
  adjust: 'create',
  deliver: 'create',
  prepare: 'create',
  publish: 'create',
  accept: 'create',

  delete: 'full',
  restore: 'full',
  approve: 'full',
  reject: 'full',
  lock: 'full',
  cancel: 'full',
  clear: 'full',
  reopen: 'full',
  override: 'full',
  reset: 'full',
  revoke: 'full',
  grant: 'full',
  'sign-off': 'full',
  authority: 'full',
  reindex: 'full',
  'revoke-any': 'full',
};

export function actionLevel(action: string): AccessLevel {
  return ACTION_LEVEL[action] ?? 'full';
}

export interface AccessPart {
  key: string;
  name: string;
  kind: 'document' | 'part';
  description?: string;
  resources?: string[];
  // Explicit permission names; these win over a resource claimed elsewhere.
  permissions?: string[];
}

export interface AccessApp {
  code: string; // apps.code
  name: string;
  description: string;
  launcher: boolean; // gated tile on the launcher / router
  parts: AccessPart[];
}

const doc = (
  key: string,
  name: string,
  resources: string[],
  description?: string,
): AccessPart => ({ key, name, kind: 'document', resources, description });
const part = (
  key: string,
  name: string,
  resources: string[],
  description?: string,
  permissions?: string[],
): AccessPart => ({
  key,
  name,
  kind: 'part',
  resources,
  description,
  permissions,
});

export const ACCESS_CATALOGUE: AccessApp[] = [
  {
    code: 'dashboard',
    name: 'Dashboard',
    description: 'Home dashboard, widgets and reports',
    launcher: false,
    parts: [
      part(
        'dashboard.widgets',
        'Dashboard & widgets',
        ['dashboards', 'dashboard'],
        'Home dashboard and its widget grid',
      ),
      part('dashboard.reports', 'Reports', ['reports']),
    ],
  },
  {
    code: 'projects',
    name: 'Projects',
    description: 'Projects, clients, planner and the document register',
    launcher: true,
    parts: [
      part(
        'projects.register',
        'Project register',
        ['projects', 'projects-phases', 'project-dashboard'],
        'Project list, project page, phases',
      ),
      part('projects.clients', 'Clients', ['clients']),
      doc('projects.planner', 'Project planner', ['project-planners']),
      part(
        'projects.documents',
        'All documents & files',
        ['documents', 'document-requirements'],
        'Document register, generic documents and requirements',
      ),
      part(
        'projects.gates',
        'Stage gates & workflow',
        [
          'gates',
          'workflow',
          'workflow-progress',
          'workflow-timeline',
          'workflow-library',
        ],
        'Gate checklists, sign-offs, workflow library',
      ),
      part(
        'projects.client-portal',
        'Client portal sharing',
        ['client-portal'],
        'Prepare and deliver documents to the client portal',
      ),
    ],
  },
  {
    code: 'design',
    name: 'Design',
    description: 'Leads, client documents, drawings, budgets and payments',
    launcher: true,
    parts: [
      part('design.leads', 'Leads pipeline', ['leads']),
      doc('design.client-brief', 'Client brief', ['project-briefs']),
      doc('design.site-recce', 'Site recce', ['site-recces']),
      doc('design.scope-of-work', 'Scope of work', ['scope-of-work']),
      doc('design.plan-of-action', 'Plan of action', ['plan-of-actions']),
      doc('design.business-proposal', 'Business proposal', [
        'business-proposals',
      ]),
      doc('design.drawings', 'Drawings', ['drawings']),
      doc('design.budget-estimate', 'Budget estimate', ['budget-estimates']),
      doc('design.budget-guide', 'Budget guide', ['budget-guides']),
      doc('design.payment-schedule', 'Payment schedule', ['payment-schedules']),
    ],
  },
  {
    code: 'build',
    name: 'Build',
    description: 'BOQ, procurement, inventory and site operations',
    launcher: true,
    parts: [
      doc('build.boq', 'BOQ', ['boq', 'boq-activity']),
      doc(
        'build.quotation',
        'Quotation / estimate',
        ['quotations', 'quotation-items'],
        'Priced quotations and estimates built from the BOQ',
      ),
      part('build.boq-library', 'Rate & item library, BOQ templates', [
        'boq-catalog',
        'boq-templates',
        'library',
      ]),
      part('build.materials', 'Materials master', ['materials']),
      part('build.inventory', 'Site inventory', ['inventory']),
      doc('build.requirement', 'Material requirement', [
        'procurement-requirements',
      ]),
      doc('build.procurement-estimate', 'Procurement estimate', [
        'procurement-estimates',
      ]),
      doc('build.procurement-sheet', 'Procurement sheet', [
        'material-procurement',
      ]),
      doc('build.vendor-quotation', 'Vendor quotation', [
        'procurement-quotations',
      ]),
      doc('build.rate-sheet', 'Rate sheet', ['procurement-rate-sheets']),
      doc('build.sample-board', 'Sample board', ['procurement-sample-boards']),
      doc('build.rate-comparison', 'Rate comparison', [
        'vendor-rate-comparisons',
      ]),
      doc('build.purchase-order', 'Purchase order (PO)', ['purchase-orders']),
      doc('build.work-order', 'Work order (WO)', ['work-orders']),
      doc('build.delivery-challan', 'Delivery challan', ['delivery-challans']),
      part('build.vendors', 'Vendor directory', [
        'vendors',
        'vendor-categories',
        'vendor-business-types',
        'vendors-saved-searches',
      ]),
      part('build.shortlists', 'Vendor shortlists', [
        'project-shortlists',
        'shortlist-entries',
        'shortlist-packages',
      ]),
      doc('build.daily-report', 'Daily site report', [
        'site-ops-daily-reports',
        'site-ops',
      ]),
      doc('build.admin-dpr', 'Admin DPR', [
        'dpr-admin-documents',
        'dpr-admin-logs',
        'dpr-admin-reports',
      ]),
      part('build.site-visits', 'Site visit assignments', ['site-ops-visits']),
      doc('build.snag-list', 'Snag list', ['site-ops-snag-lists']),
      doc('build.checklists', 'Quality checklists', [
        'site-ops-checklists',
        'quality-checklists',
        'site-ops-qc',
      ]),
      doc('build.rfi-mockups', 'RFIs & mock-ups', [
        'site-ops-rfis',
        'site-ops-mockups',
      ]),
      part('build.architect-visits', 'Architect site visits & quality', [
        'architect-visit-stages',
        'architect-quality',
        'architect-snags',
      ]),
    ],
  },
  {
    code: 'tasks',
    name: 'Tasks',
    description: 'Tasks and notes',
    launcher: true,
    parts: [
      part('tasks.tasks', 'Tasks', ['tasks']),
      part('tasks.notes', 'Notes', ['notes']),
    ],
  },
  {
    code: 'calendar',
    name: 'Calendar',
    description: 'Team and personal calendar',
    launcher: true,
    parts: [part('calendar.events', 'Calendar events', ['calendar-events'])],
  },
  {
    code: 'commandCenter',
    name: 'Command Center',
    description: 'Project command center, evidence and the authority panel',
    launcher: true,
    parts: [
      part(
        'commandCenter.board',
        'Command center & evidence',
        ['command-center'],
        'Gate evidence, reviews and file manager',
      ),
      part(
        'commandCenter.authority',
        'Authority panel',
        [],
        'Final authority decisions on gates',
        ['command-center:authority'],
      ),
    ],
  },
  {
    code: 'adminConsole',
    name: 'Admin Console',
    description: 'Users, roles, masters and company settings',
    launcher: true,
    parts: [
      part('admin.users', 'Users & team', [
        'users',
        'team',
        'user-signatures',
        'sessions',
      ]),
      part('admin.roles', 'Roles & permissions', [
        'rbac',
        'permissions',
        'role-permissions',
        'role-apps',
        'apps',
      ]),
      part('admin.settings', 'Company settings', ['settings']),
      part('admin.masters', 'Masters (document types, phases, units, terms)', [
        'document-types',
        'project-types',
        'phase-definitions',
        'units',
        'terms-templates',
      ]),
      part('admin.activity', 'Activity log', ['activity-logs']),
      part('admin.system', 'System & search index', ['system'], undefined, [
        'search:reindex',
      ]),
    ],
  },
  {
    code: 'automation',
    name: 'Automation',
    description: 'Automation rules and run log',
    launcher: true,
    parts: [part('automation.rules', 'Automation rules', ['automation'])],
  },
  {
    code: 'settings',
    name: 'Workspace & connectors',
    description: 'Everyday workspace basics and personal connectors',
    launcher: false,
    parts: [
      part('workspace.basics', 'Notifications, search & uploads', [
        'notifications',
        'search',
        'workspace',
        'cdn',
        'exports',
      ]),
      part('workspace.connectors', 'Connectors (Google, Microsoft, Zoho)', [
        'auth-google',
        'auth-microsoft',
        'auth-zoho',
        'auth-tokens',
        'google-calendar',
        'google-tasks',
        'onedrive',
        'sync',
        'zoho-bigin',
        'zoho-calendar',
        'zoho-cliq',
        'zoho-projects',
        'zoho-workdrive',
      ]),
    ],
  },
];

const PART_BY_PERMISSION = new Map<string, string>();
const PART_BY_RESOURCE = new Map<string, string>();
const APP_BY_PART = new Map<string, string>();
for (const app of ACCESS_CATALOGUE) {
  for (const p of app.parts) {
    APP_BY_PART.set(p.key, app.code);
    for (const perm of p.permissions ?? []) PART_BY_PERMISSION.set(perm, p.key);
    for (const r of p.resources ?? []) PART_BY_RESOURCE.set(r, p.key);
  }
}

/** Part key owning a `resource:action` permission, or undefined. */
export function partFor(permission: string): string | undefined {
  const explicit = PART_BY_PERMISSION.get(permission);
  if (explicit) return explicit;
  const resource = permission.split(':')[0];
  return PART_BY_RESOURCE.get(resource);
}

export function appForPart(partKey: string): string | undefined {
  return APP_BY_PART.get(partKey);
}

export function findPart(key: string): AccessPart | undefined {
  for (const app of ACCESS_CATALOGUE) {
    const p = app.parts.find((x) => x.key === key);
    if (p) return p;
  }
  return undefined;
}

/** Legacy UPPERCASE permissions are kept untouched and never shown. */
export function isLegacyPermission(resource: string, action: string) {
  return /[A-Z]/.test(resource) || /[A-Z]/.test(action);
}

/**
 * Level of one part given the permissions it owns and the granted set.
 * Highest cumulative level that is fully granted, capped at the part's top
 * meaningful level. `custom` is true when grants above that level also exist.
 */
export function computePartLevel(
  owned: string[],
  granted: Set<string>,
): {
  level: AccessLevel;
  maxLevel: AccessLevel;
  custom: boolean;
  available: AccessLevel[];
} {
  const maxRank = owned.reduce(
    (m, p) => Math.max(m, LEVEL_RANK[actionLevel(p.split(':')[1])]),
    0,
  );
  const anyGranted = owned.some((p) => granted.has(p));
  const available = [
    'none' as AccessLevel,
    ...RANK_LEVEL.filter(
      (l, r) =>
        r > 0 &&
        owned.some((p) => LEVEL_RANK[actionLevel(p.split(':')[1])] === r),
    ),
  ];
  if (!anyGranted)
    return {
      level: 'none',
      maxLevel: RANK_LEVEL[maxRank],
      custom: false,
      available,
    };
  let rank = 0;
  for (let r = 1; r <= maxRank; r++) {
    const ok = owned.every(
      (p) => LEVEL_RANK[actionLevel(p.split(':')[1])] > r || granted.has(p),
    );
    if (!ok) break;
    rank = r;
  }
  // Report the lowest level that grants the same set (no "Create" when the
  // part has no create-level actions).
  const ranks = new Set(
    owned.map((p) => LEVEL_RANK[actionLevel(p.split(':')[1])]),
  );
  while (rank > 1 && !ranks.has(rank)) rank--;
  const custom =
    owned.some(
      (p) => granted.has(p) && LEVEL_RANK[actionLevel(p.split(':')[1])] > rank,
    ) || rank === 0;
  return {
    level: RANK_LEVEL[rank],
    maxLevel: RANK_LEVEL[maxRank],
    custom,
    available,
  };
}

/** Permissions of a part granted by a level. */
export function permissionsForLevel(
  owned: string[],
  level: AccessLevel,
): string[] {
  const rank = LEVEL_RANK[level];
  return owned.filter((p) => LEVEL_RANK[actionLevel(p.split(':')[1])] <= rank);
}

/**
 * Lightweight per-user summary for /auth/me: apps the user can open (holds
 * any permission of any part in the app) and the effective level per part
 * (highest action level held).
 */
export function summarizeAccess(permissions: string[]) {
  const parts: Record<string, AccessLevel> = {};
  for (const perm of permissions) {
    const key = partFor(perm);
    if (!key) continue;
    const lvl = actionLevel(perm.split(':')[1]);
    if (!parts[key] || LEVEL_RANK[lvl] > LEVEL_RANK[parts[key]])
      parts[key] = lvl;
  }
  const apps: Record<string, AccessLevel> = {};
  for (const app of ACCESS_CATALOGUE) {
    let best = 0;
    for (const p of app.parts)
      best = Math.max(best, LEVEL_RANK[parts[p.key] ?? 'none']);
    apps[app.code] = RANK_LEVEL[best];
  }
  return { apps, parts };
}
