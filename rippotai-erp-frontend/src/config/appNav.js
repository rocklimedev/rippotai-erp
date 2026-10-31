// Universal header nav config: grouped by dropdown label per app.
// Slugs are relative to the app's base route. A slug starting with "/" is
// treated as an absolute path.

// Developer-controlled availability. Role permissions cannot override this.
// Set to true only when the Automation app is ready to be exposed again.
export const AUTOMATION_APP_ENABLED = false;

export const APP_META = {
  // Internal module keys still identify saved dashboards and permissions.
  design_studio: { name: "Drawings", base: "/design-studio" },
  crm: { name: "CRM", base: "/crm" },
  inventory: { name: "Inventory", base: "/inventory" },
  procurement: { name: "Procurement", base: "/procurement" },
  siteOperations: { name: "Site Operations", base: "/site-operations" },
  dashboard: {
    name: "Dashboard",
    base: "/dashboard",
    searchPh: "Search applications",
  },

  projects: {
    name: "Projects",
    base: "/projects",
    searchPh: "Search projects, clients, milestones",
  },

  design: {
    name: "Design",
    base: "/design",
    searchPh: "Search drawings, CRM, budgets, payments",
  },

  build: {
    name: "Build",
    base: "/build",
    searchPh: "Search inventory, procurement, site operations, BOQ",
  },

  ledger: {
    name: "Ledger",
    base: "/ledger",
    searchPh: "Search Ledger",
  },
  adminConsole: {
    name: "Admin Console",
    base: "/console",
    searchPh: "Search users, roles, permissions, settings",
  },
  tasks: {
    name: "Tasks",
    base: "/tasks",
    searchPh: "Search tasks",
  },
  calendar: {
    name: "Calendar",
    base: "/calendar",
    searchPh: "Search events",
  },
  commandCenter: {
    name: "Command Center",
    base: "/command-center",
    searchPh: "Search anything",
  },
  settings: {
    name: "Settings",
    base: "/settings",
    searchPh: "Search settings...",
  },
  automation: {
    name: "Automation",
    base: "/automation",
    searchPh: "Search automation...",
  },
};

// Landing tile order
// NOTE: "settings" is intentionally excluded — it's not a landing-page app,
// just a registered entry so TopHeader/AppSwitcher config lookups work.
export const LANDING_ORDER = [
  "projects",
  "design",
  "build",
  "tasks",
  "calendar",
  "commandCenter",
  "adminConsole",
  ...(AUTOMATION_APP_ENABLED ? ["automation"] : []),
];

const I = (label, slug) => ({ label, slug });

export const APP_MENUS = {
  dashboard: [],

  projects: [
    {
      label: "Clients",
      slug: "/clients",
    },
    {
      label: "Documents",
      items: [
        I("All Documents", "documents/all"),
        I("Project Planner", "planner/list"),
      ],
    },
    {
      label: "Settings",
      items: [
        I("Edit Dashboard", "edit-dashboard"),
        I("Roles and Permissions", "roles"),
        I("Activity", "activity"),
      ],
    },
  ],

  // ------------------------------------------------------------
  // DESIGN: Design Studio + CRM + Ledger documents
  // ------------------------------------------------------------
  design: [
    {
      label: "Drawings",
      items: [
        I("Drawings", "/design-studio/all"),
        I("Upload", "/design-studio/upload"),
      ],
    },
    {
      label: "Pipeline",
      items: [I("Leads", "/crm/pipeline"), I("Sources", "/crm/leads/sources")],
    },

    {
      label: "CRM",
      items: [
        I("Client Brief", "/crm/brief/all"),
        I("Site Recce", "/crm/recce/all"),
        I("Scope of Work", "/crm/scope-of-work/all"),
        I("Plan of Action", "/crm/plan-of-action/all"),
        // I("Scope Of Approval", "/crm/scope-of-approval/all"),
        // I("Pitch Deck", "/crm/pitch-deck/all"),
        I("Business Proposals", "/crm/business-proposal/all"),
      ],
    },
    {
      label: "Budgets & Payments",
      items: [
        I("Payment Schedules", "/ledger/payment-schedule/all"),
        I("Budget Estimates", "/ledger/budget-estimates/all"),
        I("Budget Guides", "/ledger/budget-guides/all"),
      ],
    },
    {
      label: "Management",
      items: [
        I("Projects", "/projects"),
        I("Clients", "/clients"),
        I("Activity", "/design-studio/activity"),
        I("Edit Dashboard", "/design/edit-dashboard"),
        I("Roles & Permissions", "/design-studio/roles"),
      ],
    },
  ],

  // ------------------------------------------------------------
  // BUILD: Inventory + Procurement + Site Operations + BOQ library
  // ------------------------------------------------------------
  build: [
    {
      label: "BOQ Library",
      items: [
        I("BOQ", "/ledger/boq/all"),
        I("Rate and Item Library", "/ledger/boq/rate-and-item-library"),
        I("BOQ Templates", "/ledger/boq/templates"),
      ],
    },
    {
      label: "Site Inventory",
      items: [
        I("Site Inventory", "/inventory/site-inventory/all"),
        I("Inventory Transactions", "/inventory/site-inventory/transactions"),
        I("Record Transaction", "/inventory/site-inventory/transactions/new"),
      ],
    },

    {
      label: "Materials",
      items: [
        I("Estimates", "/procurement/estimates/all"),
        I("Delivery Challans", "/procurement/delivery-challans"),
        I("Purchase Orders", "/procurement/purchase-orders"),
        I("Work Order", "/procurement/work-order/all"),
        I("Requirements", "/procurement/requirements"),
        I("Vendors", "/procurement/vendors/directory"),
        I("Procurement Sheet", "/procurement/material-procurement/list"),
        I("Rate Comparison", "/procurement/vendors/rate-comparison"),
        I("Rate Sheets", "/procurement/rate-sheets"),
      ],
    },
    {
      label: "Procurement",
      items: [],
    },

    {
      label: "Site Operations",
      items: [
        I("Daily Reports", "/site-operations/daily-reports"),
        I("Admin DPR", "/site-operations/admin-dpr"),
        I("Visit Assignments", "/site-operations/visit-assignments"),
        I("Snag Lists", "/site-operations/snag-lists"),
        I("Checklists", "/site-operations/checklists"),
      ],
    },
    {
      label: "Management",
      items: [
        I("Projects", "/projects"),
        I("Activity", "/procurement/activity"),
        I("Edit Dashboard", "/build/edit-dashboard"),
      ],
    },
  ],

  // ------------------------------------------------------------
  // LEDGER: BOQ + settings remain
  // ------------------------------------------------------------
  ledger: [
    {
      label: "Settings",
      items: [
        I("Projects", "/projects"),
        I("Edit Dashboard", "edit-dashboard"),
        I("Roles and Permissions", "roles"),
        I("Activity", "activity"),
      ],
    },
  ],

  adminConsole: [
    {
      label: "Workspace",
      items: [
        I("Client", "clients"),
        I("Users", "users"),
        I("Roles & Permissions", "roles-permissions"),
        I("Project Phases", "project-phases"),
        I("Document Types", "document-types"),
        I("Project Structure", "project-structure"),
        I("Estimate Signature", "estimate-signature"),
      ],
    },
    {
      label: "Administration",
      items: [
        I("Company Profile", "company-profile"),
        I("Terms & Conditions", "terms-and-conditions"),
        I("Super Admin", "super-admin"),
      ],
    },
    // ------------------------------------------------------------
    // Management
    // ------------------------------------------------------------
    {
      label: "Management",
      items: [
        I("Projects", "/projects"),
        I("Activity", "activity"),
        I("Edit Dashboard", "edit-dashboard"),
      ],
    },
  ],

  tasks: [
    {
      label: "Tasks",
      items: [
        I("My Tasks", "mine"),
        I("All Tasks", "all"),
        I("Crucial Work", "crucial-work"),
        I("Overdue", "overdue"),
        I("New Task", "new"),
      ],
    },
    {
      label: "Notes",
      slug: "notes",
    },
    {
      label: "Settings",
      items: [
        I("Edit Dashboard", "edit-dashboard"),
        I("Roles and Permissions", "roles"),
        I("Activity", "activity"),
      ],
    },
  ],

  calendar: [
    {
      label: "Calendar",
      items: [I("My Calendar", "mine"), I("Team Calendar", "team")],
    },
    {
      label: "Settings",
      items: [
        I("Edit Dashboard", "edit-dashboard"),
        I("Roles and Permissions", "roles"),
        I("Activity", "activity"),
      ],
    },
  ],

  automation: [
    {
      label: "Automation",
      items: [
        I("Overview", "/automation"),
        I("Rules", "rules"),
        I("Create Rule", "rules/new"),
      ],
    },
    {
      label: "Monitoring",
      items: [
        I("Run Log", "runs"),
        I("Escalations", "escalations"),
        I("Audit Trail", "audit"),
      ],
    },
  ],

  commandCenter: [
    {
      label: "File Manager",
      slug: "file-manager",
    },
  ],

  settings: [
    {
      label: "Account",
      items: [
        I("Edit Profile", "/settings"),
        I("Security", "security"),
        I("Connectors", "connectors"),
      ],
    },
  ],
};

export function navigationAppFor(app, pathname = "") {
  if (["design_studio", "crm"].includes(app)) return "design";
  if (["inventory", "procurement", "siteOperations"].includes(app))
    return "build";
  if (app === "ledger") {
    if (
      /^\/ledger\/(forms\/(payment-schedule|budget-estimate)|payment-schedule|budget-estimates?|budget-guides|aggrements)(\/|$)/.test(
        pathname,
      )
    )
      return "design";
    return "build";
  }
  return app;
}

export function navigationPath(app, slug = "") {
  const path = slug.startsWith("/") ? slug : `${APP_META[app].base}/${slug}`;
  return path.replace(/\/edit-dashboard$/, "?edit=1");
}

// Keep shared activity/permission pages registered under their original module.
for (const app of [
  "design_studio",
  "crm",
  "inventory",
  "procurement",
  "siteOperations",
]) {
  APP_MENUS[app] = [
    {
      label: "Settings",
      items: [I("Activity", "activity"), I("Roles and Permissions", "roles")],
    },
  ];
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
    (slug || "")
      .split("-")
      .map((s) => s[0]?.toUpperCase() + s.slice(1))
      .join(" ") || "Section"
  );
}

// Legacy compat
export const APP_NAV = Object.fromEntries(
  Object.entries(APP_MENUS).map(([app, groups]) => [
    app,
    {
      primary: groups[0]?.items || [],
      management: groups.find((g) => g.label === "Management")?.items || [],
      admin: groups.find((g) => g.label === "Settings")?.items || [],
    },
  ]),
);
