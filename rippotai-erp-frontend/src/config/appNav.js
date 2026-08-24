// Universal header nav config: grouped by dropdown label per app.
// Slugs are relative to the app's base route. A slug starting with "/" is
// treated as an absolute path.

export const APP_META = {
  dashboard: {
    name: "Dashboard",
    base: "/dashboard",
    searchPh: "Search applications",
  },

  boq: {
    name: "BOQ",
    base: "/boq",
    searchPh: "Search BOQs, categories, items",
  },

  projects: {
    name: "Projects",
    base: "/projects",
    searchPh: "Search projects, clients, milestones",
  },

  quotations: {
    name: "Estimate",
    base: "/quotations",
    searchPh: "Search estimates, vendors",
  },

  vendors: {
    name: "Vendors",
    base: "/vendors",
    searchPh: "Search vendors, categories",
  },

  documents: {
    name: "Documents",
    base: "/documents",
    searchPh: "Search documents, forms",
  },

  designStudio: {
    name: "Design Studio",
    base: "/design-studio",
    searchPh: "Search drawings, projects, revisions",
  },

  leads: {
    name: "Leads",
    base: "/leads",
    searchPh: "Search leads",
  },

  siteOperations: {
    name: "Site Operations",
    base: "/site-operations",
    searchPh: "Search reports, visits, QC, mockups, RFIs",
  },
  adminConsole: {
    name: "Admin Console",
    base: "/console",
    searchPh: "Search users, roles, permissions, settings",
  },
  materials: {
    name: "Materials",
    base: "/materials",
    searchPh: "Search materials, requirements, orders",
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

  settings: {
    name: "Settings",
    base: "/settings",
    searchPh: "Search settings...",
  },
};

// Landing tile order: 7 apps (Clients + Notes removed in Phase A)
// NOTE: "settings" is intentionally excluded — it's not a landing-page app,
// just a registered entry so TopHeader/AppSwitcher config lookups work.
export const LANDING_ORDER = [
  "boq",
  "projects",
  "designStudio",
  "quotations",
  "vendors",
  "documents",
  "leads",
  "siteOperations",
  "materials",
  "tasks",
  "calendar",
  "adminConsole",
];

const I = (label, slug) => ({ label, slug });

export const APP_MENUS = {
  dashboard: [],
  boq: [
    { label: "BOQ", items: [I("All BOQs", "all"), I("Create BOQ", "new")] },
    {
      label: "Management",
      items: [
        I("Rate and Item Library", "rate-and-item-library"),
        I("BOQ Templates", "templates"),
        I("Projects", "/projects/all"),
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
  projects: [
    {
      label: "Projects",
      items: [I("All Projects", "all"), I("Create Project", "new")],
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
  quotations: [
    {
      label: "Estimates",
      items: [
        I("All Estimates", "all"),
        I("Create Estimate", "new"),
        I("Projects", "/projects/all"),
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
  vendors: [
    {
      label: "Vendors",
      items: [I("All Vendors", "directory"), I("Add Vendor", "new")],
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
  documents: [
    {
      label: "Documents",
      items: [
        I("All Documents", "all"),
        I("All Site Recce", "recce/all"),
        I("All Project Brief", "brief/all"),
        I("All Plan Of Action", "plan-of-action/all"),
        I("All Payment Schedules", "payment-schedule/all"),
        I("All Scope of Work", "scope-of-work/all"),
        I("Projects", "/projects/all"),
      ],
    },

    {
      label: "Forms",
      items: [
        I("Upload Document", "upload"),
        I("Project Brief", "forms/project-brief"),
        I("Site Recce", "forms/site-reki"),
        I("Plan of Action", "forms/plan-of-action"),
        I("Payment Schedule", "forms/payment-schedule"),
        I("Scope Of Work", "forms/scope-of-work"),
      ],
    },

    {
      label: "Management",
      items: [
        I("Edit Dashboard", "edit-dashboard"),
        I("Roles & Permissions", "roles"),
        I("Activity", "activity"),
      ],
    },
  ],
  designStudio: [
    {
      label: "Drawings",
      items: [I("All Drawings", "all"), I("Create Drawing", "new")],
    },

    {
      label: "Management",
      items: [I("Projects", "/projects/all"), I("Activity", "activity")],
    },

    {
      label: "Administration",
      items: [
        I("Edit Dashboard", "edit-dashboard"),
        I("Roles & Permissions", "roles"),
      ],
    },
  ],
  leads: [
    {
      label: "Pipeline",
      slug: "pipeline",
    },
    {
      label: "Leads",
      items: [I("Create Lead", "new"), I("Sources", "sources")],
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
  adminConsole: [
    {
      label: "Workspace",
      items: [
        I("Users", "users"),
        I("Roles & Permissions", "roles-permissions"),
      ],
    },

    {
      label: "Administration",
      items: [
        I("Super Admin", "super-admin"),
        I("Terms & Conditions", "terms-and-conditions"),
      ],
    },
  ],
  materials: [
    {
      label: "Materials",
      items: [
        I("Requirements", "requirements"),
        I("Sample Boards", "sample-boards"),
        I("Rate Sheets", "rate-sheets"),
      ],
    },

    {
      label: "Procurement",
      items: [
        I("Estimates", "estimates"),
        I("Quotations", "quotations"),
        I("Purchase Orders", "purchase-orders"),
      ],
    },

    {
      label: "Delivery & Inventory",
      items: [
        I("Delivery Challans", "delivery-challans"),
        I("Site Inventory", "inventory"),
      ],
    },

    {
      label: "Management",
      items: [
        I("Projects", "/projects/all"),
        I("Activity", "activity"),
        I("Settings", "edit-dashboard"),
      ],
    },
  ],
  siteOperations: [
    {
      label: "Overview",
      items: [I("Dashboard", "dashboard"), I("Activity", "activity")],
    },

    {
      label: "Site Operations",
      items: [
        I("Daily Reports", "daily-reports"),
        I("Visit Assignments", "visit-assignments"),
        I("Projects", "/projects/all"),
      ],
    },

    {
      label: "Quality & Coordination",
      items: [
        I("QC Sign-offs", "qc/history"),
        I("QC Handoff Status", "qc/handoff-status"),
        I("Checklists", "qc/checklist-templates"),
        I("Mockups", "mockups"),
        I("RFIs / Clarifications", "rfis"),
      ],
    },

    {
      label: "Administration",
      items: [
        I("Edit Dashboard", "edit-dashboard"),
        I("Roles & Permissions", "roles"),
      ],
    },
  ],
  tasks: [
    {
      label: "Tasks",
      items: [I("My Tasks", "mine"), I("All Tasks", "all")],
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
  settings: [
    {
      label: "Account",
      items: [
        I("Edit Profile", "/settings"),
        I("Security", "security"),

        I("Estimate Signature", "estimate-signature"),
      ],
    },
    {
      label: "Workspace",
      items: [
        I("Users", "users"),
        I("Roles & Permissions", "roles-permissions"),
        I("Super Admin", "super-admin"),
        I("Terms & Conditions", "terms-and-conditions"),
      ],
    },
  ],
};

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
    for (const it of g.items) if (it.slug === slug) return it.label;
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
