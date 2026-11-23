// Universal header nav config: grouped by dropdown label per app.
// Slugs are relative to the app's base route. A slug starting with "/" is
// treated as an absolute path.

// Developer-controlled availability. Role permissions cannot override this.
// Set to true only when the Automation app is ready to be exposed again.
export const AUTOMATION_APP_ENABLED = false;

export const APP_META = {
  // Internal module keys still identify saved dashboards and permissions.
  design_studio: { name: 'Drawings', base: '/design-studio' },
  crm: { name: 'CRM', base: '/crm' },
  inventory: { name: 'Inventory', base: '/inventory' },
  procurement: { name: 'Procurement', base: '/procurement' },
  siteOperations: { name: 'Site Operations', base: '/site-operations' },
  dashboard: {
    name: 'Dashboard',
    base: '/dashboard',
    searchPh: 'Search applications',
  },

  projects: {
    name: 'Projects',
    base: '/projects',
    searchPh: 'Search projects, clients',
  },

  design: {
    name: 'Design',
    base: '/design',
    searchPh: 'Search briefs, recces, scope of work, drawings',
  },

  build: {
    name: 'Build',
    base: '/build',
    searchPh: 'Search BOQ, PO, WO, procurement, site',
  },

  ledger: {
    name: 'Ledger',
    base: '/ledger',
    searchPh: 'Search Ledger',
  },
  adminConsole: {
    name: 'Admin Console',
    base: '/console',
    searchPh: 'Search users, roles, permissions, settings',
  },
  tasks: {
    name: 'Tasks',
    base: '/tasks',
    searchPh: 'Search tasks',
  },
  calendar: {
    name: 'Calendar',
    base: '/calendar',
    searchPh: 'Search events',
  },
  commandCenter: {
    name: 'Command Center',
    base: '/command-center',
    searchPh: 'Search anything',
  },
  settings: {
    name: 'Settings',
    base: '/settings',
    searchPh: 'Search settings...',
  },
  automation: {
    name: 'Automation',
    base: '/automation',
    searchPh: 'Search automation...',
  },
};

// Landing tile order
// NOTE: "settings" is intentionally excluded — it's not a landing-page app,
// just a registered entry so TopHeader/AppSwitcher config lookups work.
export const LANDING_ORDER = [
  'projects',
  'design',
  'build',
  'tasks',
  'calendar',
  'commandCenter',
  'adminConsole',
  ...(AUTOMATION_APP_ENABLED ? ['automation'] : []),
];

const I = (label, slug) => ({ label, slug });

export const APP_MENUS = {
  dashboard: [],

  // ------------------------------------------------------------
  // PROJECTS: projects list → project page (Overview / Drawings / Documents), clients
  // ------------------------------------------------------------
  projects: [
    { label: 'Projects', slug: '/projects' },
    { label: 'Clients', slug: '/clients' },
  ],

  // ------------------------------------------------------------
  // DESIGN (FLOW-SPEC): CRM → Project Setup → Design Studio
  // ------------------------------------------------------------
  design: [
    {
      label: 'CRM',
      items: [
        I('Pipeline', '/crm/pipeline'),
        I('Client Brief', '/crm/brief/all'),
        I('Site Recce', '/crm/recce/all'),
        I('Scope of Work', '/crm/scope-of-work/all'),
        I('Pre Design', '/design/pre-design'),
        I('Contract', '/design/contract'),
      ],
    },
    {
      label: 'Project Setup',
      items: [
        I('Payment Schedule', '/ledger/payment-schedule/all'),
        I('Plan of Action', '/crm/plan-of-action/all'),
        I('Project Planner', '/projects/planner/list'),
      ],
    },
    {
      label: 'Design Studio',
      items: [
        I('Design', '/design/design'),
        I('Material Palette', '/design/material-palette'),
        I('Working Drawings', '/design/working-drawings'),
        I('Tender Drawings', '/design/tender-drawings'),
      ],
    },
  ],

  // ------------------------------------------------------------
  // BUILD (FLOW-SPEC): Contracts → Procurement → Ledger → Operations
  // ------------------------------------------------------------
  build: [
    {
      label: 'Contracts',
      items: [I('Agreement', '/build/agreement'), I('Consent Form', '/build/consent-form')],
    },
    {
      label: 'Procurement',
      items: [
        I('Vendor Comparison Sheet', '/procurement/vendors/rate-comparison'),
        I('Quotation', '/procurement/quotations'),
        I('Procurement Sheet', '/procurement/material-procurement/list'),
      ],
    },
    {
      label: 'Ledger',
      items: [
        I('BOQ', '/ledger/boq/all'),
        I('PO', '/procurement/purchase-orders'),
        I('WO', '/procurement/work-order/all'),
        I('Budget Guide', '/ledger/budget-guides/all'),
      ],
    },
    {
      label: 'Operations',
      items: [
        I('Site Inventory', '/inventory/site-inventory/all'),
        I('Delivery Challan', '/procurement/delivery-challans'),
        I('Checklist', '/site-operations/checklists'),
        I('Architect Site Visit Schedule', '/site-operations/visit-assignments'),
        I('Snag List', '/site-operations/snag-lists'),
        I('Daily Site Report', '/site-operations/daily-reports'),
        I('Admin DPR', '/site-operations/admin-dpr'),
      ],
    },
  ],

  // Ledger routes (/ledger/…) belong to Design or Build (see navigationAppFor).
  ledger: [],

  adminConsole: [
    {
      label: 'Workspace',
      items: [
        I('Client', 'clients'),
        I('Users', 'users'),
        I('Roles & Permissions', 'roles-permissions'),
        I('Project Phases', 'project-phases'),
        I('Document Types', 'document-types'),
        I('Project Structure', 'project-structure'),
        I('Estimate Signature', 'estimate-signature'),
      ],
    },
    {
      label: 'Administration',
      items: [
        I('Company Profile', 'company-profile'),
        I('Terms & Conditions', 'terms-and-conditions'),
        I('Super Admin', 'super-admin'),
      ],
    },
    // ------------------------------------------------------------
    // Management
    // ------------------------------------------------------------
    {
      label: 'Management',
      items: [I('Activity', 'activity')],
    },
  ],

  tasks: [
    {
      label: 'Tasks',
      items: [
        I('My Tasks', 'mine'),
        I('All Tasks', 'all'),
        I('Overdue', 'overdue'),
        I('New Task', 'new'),
      ],
    },
    {
      label: 'Notes',
      slug: 'notes',
    },
  ],

  calendar: [
    {
      label: 'Calendar',
      items: [I('My Calendar', 'mine'), I('Team Calendar', 'team')],
    },
  ],

  automation: [
    {
      label: 'Automation',
      items: [I('Overview', '/automation'), I('Rules', 'rules'), I('Create Rule', 'rules/new')],
    },
    {
      label: 'Monitoring',
      items: [I('Run Log', 'runs'), I('Escalations', 'escalations'), I('Audit Trail', 'audit')],
    },
  ],

  commandCenter: [
    {
      label: 'File Manager',
      slug: 'file-manager',
    },
  ],

  settings: [
    {
      label: 'Account',
      items: [
        I('Edit Profile', '/settings'),
        I('Security', 'security'),
        I('Connectors', 'connectors'),
      ],
    },
  ],
};

export function navigationAppFor(app, pathname = '') {
  if (['design_studio', 'crm'].includes(app)) return 'design';
  if (['inventory', 'procurement', 'siteOperations'].includes(app)) return 'build';
  if (app === 'ledger') {
    if (
      /^\/ledger\/(forms\/(payment-schedule|budget-estimate)|payment-schedule|budget-estimates?)(\/|$)/.test(
        pathname,
      )
    )
      return 'design';
    return 'build';
  }
  // Project Planner sits in Design › Project Setup.
  if (app === 'projects' && /^\/projects\/planner(\/|$)/.test(pathname)) return 'design';
  return app;
}

export function navigationPath(app, slug = '') {
  const path = slug.startsWith('/') ? slug : `${APP_META[app].base}/${slug}`;
  return path.replace(/\/edit-dashboard$/, '?edit=1');
}

// Sub-modules (design_studio, crm, inventory, procurement, siteOperations)
// have no menu of their own: their pages show the Design / Build menu.
for (const app of ['design_studio', 'crm', 'inventory', 'procurement', 'siteOperations']) {
  APP_MENUS[app] = [];
}

export function allSlugsFor(app) {
  const menus = APP_MENUS[app] || [];
  const out = [];

  for (const g of menus) {
    // Standalone nav item
    if (g.slug) {
      out.push({
        slug: g.slug,
        label: g.label,
      });
    }

    // Dropdown
    if (Array.isArray(g.items)) {
      for (const it of g.items) {
        out.push({
          slug: it.slug,
          label: it.label,
        });
      }
    }
  }

  return out;
}

export function sectionNameFor(app, slug) {
  for (const g of APP_MENUS[app] || []) {
    if (g.slug === slug) return g.label;
    for (const it of g.items || []) if (it.slug === slug) return it.label;
  }
  return (
    (slug || '')
      .split('-')
      .map((s) => s[0]?.toUpperCase() + s.slice(1))
      .join(' ') || 'Section'
  );
}

// Legacy compat
export const APP_NAV = Object.fromEntries(
  Object.entries(APP_MENUS).map(([app, groups]) => [
    app,
    {
      primary: groups[0]?.items || [],
      management: groups.find((g) => g.label === 'Management')?.items || [],
      admin: groups.find((g) => g.label === 'Settings')?.items || [],
    },
  ]),
);
