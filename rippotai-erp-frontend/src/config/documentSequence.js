const create = (id, name, route, prefixes = [], extra = {}) => ({ id, name, action: "create", route, prefixes, ...extra });
const upload = (id, name) => ({ id, name, action: "upload" });
const reference = (id, name) => ({ id, name, action: "reference" });

export const DOCUMENT_SEQUENCE = [
  create("client-brief", "Client Brief", "/crm/forms/project-brief", ["/crm/brief", "/crm/forms/project-brief"]),
  create("site-recce", "Site Recce", "/crm/forms/site-reki", ["/crm/recce", "/crm/forms/site-reki"]),
  create("scope-of-work", "Scope of Work", "/crm/forms/scope-of-work", ["/crm/scope-of-work", "/crm/forms/scope-of-work"]),
  reference("scope-of-approval", "Scope of Approval"),
  upload("pre-design", "Pre Design"),
  upload("client-guide", "Client Guide"),
  upload("pitch-deck", "Pitch Deck"),
  reference("specification-budget-guide", "Specification & Budget Guide"),
  create("business-proposal", "Business Proposal", "/crm/forms/business-proposal", ["/crm/business-proposal", "/crm/forms/business-proposal"]),
  create("planner-consultancy", "Project Planner Consultancy", "/projects/planner/create", ["/projects/planner"], { view: "Consultancy" }),
  create("planner-pmc", "Project Planner PMC", "/projects/planner/create", [], { view: "PMC" }),
  create("planner-procurement", "Project Planner Procurement", "/projects/planner/create", [], { view: "Vendor & Procurement" }),
  create("payment-schedule", "Payment Schedule", "/ledger/forms/payment-schedule", ["/ledger/payment-schedule", "/ledger/forms/payment-schedule"]),
  reference("consent-form", "Consent Form"),
  upload("agreement-consultancy", "Agreement-Consultancy"),
  upload("contract-execution", "Contract-Execution"),
  create("plan-of-action", "Plan of Action", "/crm/forms/plan-of-action", ["/crm/plan-of-action", "/crm/forms/plan-of-action"]),
  upload("design", "Design"),
  create("estimates-quotations", "Estimates & Quotations", "/procurement/estimates/new", ["/procurement/estimates", "/procurement/quotations"]),
  reference("architect-site-visit-schedule", "Architect Site Visit Schedule"),
  upload("material-palette", "Material Palette"),
  create("material-procurement-sheet", "Material Procurement Sheet", "/procurement/material-procurement/new", ["/procurement/material-procurement"]),
  create("vendor-shortlist", "Vendor Shortlist", "/procurement/vendors/shortlists", ["/procurement/vendors/shortlists"]),
  create("boq-vendor-comparison", "BOQ x Vendor Comparison", "/procurement/vendors/rate-comparison", ["/procurement/vendors/rate-comparison"]),
  create("boq", "BOQ", "/ledger/boq/new", ["/ledger/boq"]),
  create("purchase-order", "Purchase Order", "/procurement/purchase-orders/new", ["/procurement/purchase-orders"]),
  create("work-order", "Work Order", "/procurement/work-order/new", ["/procurement/work-order"]),
  create("delivery-challan", "Delivery Challan", "/procurement/delivery-challans/new", ["/procurement/delivery-challans"]),
  upload("tender-drawings", "Tender Drawings"),
  upload("working-drawings", "Working Drawings"),
  upload("site-visit-template", "Site Visit Template"),
  create("quality-check-list", "Quality Check List", "/site-operations/checklists/workspace", ["/site-operations/checklists/workspace", "/site-operations/qc/checklist-templates"]),
  reference("snag-list", "Snag List"),
  reference("admin-dpr", "Admin DPR"),
  reference("crucial-works", "Crucial Works"),
  create("site-inventory-register", "Site Inventory Register", "/inventory/site-inventory/all", ["/inventory/site-inventory"]),
  create("daily-progress-report", "Daily Progress Report", "/site-operations/daily-reports/new", ["/site-operations/daily-reports"]),
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
  "estimates-quotations": "/procurement/estimates/all",
  "material-procurement-sheet": "/procurement/material-procurement/list",
  "vendor-shortlist": "/procurement/vendors/shortlists",
  "boq-vendor-comparison": "/procurement/vendors/rate-comparison",
  boq: "/ledger/boq/all",
  "purchase-order": "/procurement/purchase-orders",
  "work-order": "/procurement/work-order/all",
  "delivery-challan": "/procurement/delivery-challans",
  "quality-check-list": "/site-operations/qc/checklist-templates",
  "site-inventory-register": "/inventory/site-inventory/all",
  "daily-progress-report": "/site-operations/daily-reports",
};
DOCUMENT_SEQUENCE.forEach((item) => { if (listRoutes[item.id]) item.route = listRoutes[item.id]; });

export const normalizeDocumentName = (value = "") => value.toLowerCase().replace(/[^a-z0-9]/g, "");

export function documentDestination(document, projectId) {
  const params = new URLSearchParams({ sequence: document.id });
  if (projectId) params.set("projectId", projectId);
  if (document.view) params.set("view", document.view);
  if (document.action === "upload") params.set("documentName", document.name);
  const route = document.action === "upload" ? "/document/upload" : document.route || "/document/reference";
  return `${route}?${params}`;
}

export function currentSequenceDocument(pathname, search) {
  const params = new URLSearchParams(search);
  const explicit = DOCUMENT_SEQUENCE.find((item) => item.id === params.get("sequence"));
  if (explicit && (pathname === explicit.route || (pathname === "/document/reference" && explicit.action === "reference") || (pathname === "/projects/documents/all" && explicit.action === "upload"))) return explicit;
  return DOCUMENT_SEQUENCE.find((item) => item.route === pathname);
}
