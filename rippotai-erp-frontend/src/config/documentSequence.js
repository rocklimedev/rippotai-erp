const create = (id, name, route, prefixes = [], extra = {}) => ({
  id,
  name,
  action: "create",
  route,
  createRoute: route,
  prefixes,
  ...extra,
});
// A flow page (Pre Design, upload-type documents, registers) — opened, not created.
const page = (id, name, route) => ({ id, name, action: "page", route, createRoute: route, prefixes: [route] });

export const DOCUMENT_SEQUENCE = [
  create("client-brief", "Client Brief", "/crm/forms/project-brief", [
    "/crm/brief",
    "/crm/forms/project-brief",
  ]),
  create("site-recce", "Site Recce", "/crm/forms/site-reki", [
    "/crm/recce",
    "/crm/forms/site-reki",
  ]),
  create("scope-of-work", "Scope of Work", "/crm/forms/scope-of-work", [
    "/crm/scope-of-work",
    "/crm/forms/scope-of-work",
  ]),
  page("pre-design", "Pre Design", "/design/pre-design"),
  create(
    "business-proposal",
    "Business Proposal",
    "/crm/forms/business-proposal",
    ["/crm/business-proposal", "/crm/forms/business-proposal"],
  ),
  create(
    "planner-consultancy",
    "Project Planner Consultancy",
    "/projects/planner/create",
    ["/projects/planner"],
    { view: "Consultancy" },
  ),
  create("planner-pmc", "Project Planner PMC", "/projects/planner/create", [], {
    view: "PMC",
  }),
  create(
    "planner-procurement",
    "Project Planner Procurement",
    "/projects/planner/create",
    [],
    { view: "Vendor & Procurement" },
  ),
  create(
    "payment-schedule",
    "Payment Schedule",
    "/ledger/forms/payment-schedule",
    ["/ledger/payment-schedule", "/ledger/forms/payment-schedule"],
  ),
  page("contract", "Contract", "/design/contract"),
  page("agreement", "Agreement", "/build/agreement"),
  create("plan-of-action", "Plan of Action", "/crm/forms/plan-of-action", [
    "/crm/plan-of-action",
    "/crm/forms/plan-of-action",
  ]),
  page("design", "Design", "/design/design"),
  page("material-palette", "Material Palette", "/design/material-palette"),
  page("tender-drawings", "Tender Drawings", "/design/tender-drawings"),
  create(
    "material-procurement-sheet",
    "Procurement Sheet",
    "/procurement/material-procurement/new",
    ["/procurement/material-procurement"],
  ),
  create(
    "boq-vendor-comparison",
    "Vendor Comparison Sheet",
    "/procurement/vendors/rate-comparison",
    ["/procurement/vendors/rate-comparison"],
  ),
  create("boq", "BOQ", "/ledger/boq/new", ["/ledger/boq"]),
  create(
    "purchase-order",
    "Purchase Order",
    "/procurement/purchase-orders/new",
    ["/procurement/purchase-orders"],
  ),
  create("work-order", "Work Order", "/procurement/work-order/new", [
    "/procurement/work-order",
  ]),
  create(
    "delivery-challan",
    "Delivery Challan",
    "/procurement/delivery-challans/new",
    ["/procurement/delivery-challans"],
  ),
  page("working-drawings", "Working Drawings", "/design/working-drawings"),
  create(
    "quality-check-list",
    "Checklist",
    "/site-operations/checklists/workspace",
    ["/site-operations/checklists/workspace", "/site-operations/checklists"],
  ),
  page("architect-site-visit-schedule", "Architect Site Visit Schedule", "/site-operations/visit-assignments"),
  page("snag-list", "Snag List", "/site-operations/snag-lists"),
  create(
    "site-inventory-register",
    "Site Inventory",
    "/inventory/site-inventory/all",
    ["/inventory/site-inventory"],
  ),
  create(
    "daily-progress-report",
    "Daily Site Report",
    "/site-operations/daily-reports/new",
    ["/site-operations/daily-reports"],
  ),
];

const listRoutes = {
  "client-brief": "/crm/brief/all",
  "site-recce": "/crm/recce/all",
  "scope-of-work": "/crm/scope-of-work/all",
  "business-proposal": "/crm/business-proposal/all",
  "planner-consultancy": "/projects/planner/list",
  "planner-pmc": "/projects/planner/list",
  "planner-procurement": "/projects/planner/list",
  "payment-schedule": "/ledger/payment-schedule/all",
  "plan-of-action": "/crm/plan-of-action/all",
  "material-procurement-sheet": "/procurement/material-procurement/list",
  "boq-vendor-comparison": "/procurement/vendors/rate-comparison",
  boq: "/ledger/boq/all",
  "purchase-order": "/procurement/purchase-orders",
  "work-order": "/procurement/work-order/all",
  "delivery-challan": "/procurement/delivery-challans",
  "quality-check-list": "/site-operations/checklists",
  "site-inventory-register": "/inventory/site-inventory/all",
  "daily-progress-report": "/site-operations/daily-reports",
};
DOCUMENT_SEQUENCE.forEach((item) => {
  if (listRoutes[item.id]) item.route = listRoutes[item.id];
});

export const normalizeDocumentName = (value = "") =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

export function documentDestination(
  document,
  projectId,
  { create = false } = {},
) {
  const params = new URLSearchParams({ sequence: document.id });
  if (projectId) params.set("projectId", projectId);
  if (document.view) params.set("view", document.view);
  const route =
    (create && document.action === "create"
      ? document.createRoute
      : document.route) || "/projects";
  return `${route}?${params}`;
}

export function currentSequenceDocument(pathname, search) {
  const params = new URLSearchParams(search);
  const explicit = DOCUMENT_SEQUENCE.find(
    (item) => item.id === params.get("sequence"),
  );
  if (
    explicit &&
    (pathname === explicit.route ||
      pathname === explicit.createRoute ||
      (explicit.action === "page" && pathname.startsWith(explicit.route)))
  )
    return explicit;
  return DOCUMENT_SEQUENCE.find(
    (item) => item.route === pathname || item.createRoute === pathname,
  );
}
