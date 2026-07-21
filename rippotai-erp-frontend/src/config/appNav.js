// Universal header nav config: grouped by dropdown label per app.
// Slugs are relative to the app's base route.

export const APP_META = {
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
  leads: {
    name: "Leads",
    base: "/leads",
    searchPh: "Search leads",
  },
  tasks: { name: "Tasks", base: "/tasks", searchPh: "Search tasks" },
  calendar: { name: "Calendar", base: "/calendar", searchPh: "Search events" },
};

// Landing tile order: 7 apps (Clients + Notes removed in Phase A)
export const LANDING_ORDER = [
  "boq",
  "projects",
  "quotations",
  "vendors",
  "documents",
  "leads",
  "tasks",
  "calendar",
];
const I = (label, slug) => ({ label, slug });

export const APP_MENUS = {
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
        I("Upload Document", "upload"),
        I("Projects", "/projects/all"),
      ],
    },
    {
      label: "Forms",
      items: [
        I("Project Brief", "forms/project-brief"),
        I("Site Reki", "forms/site-reki"),
      ],
    },
    {
      label: "Drawings",
      items: [
        I("All Drawings", "drawings"),
        I("Upload Drawing", "drawings/upload"),
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
