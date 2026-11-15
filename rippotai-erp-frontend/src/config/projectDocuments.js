// The project documents of the INOS flow (FLOW-SPEC), in flow order.
// One source for the Project › Documents tab, the Pre Design stage and the
// upload-type document pages. `key` matches the backend document hub
// (GET /projects/:id/document-hub).
//
// kind:
//   form     — an INOS form; Open = latest record, Create = new form for the project
//   upload   — a file per project (document_types rows); Upload / Revisions / Download
//   stage    — Pre Design: a page with several slots
//   register — many records per project (POs, challans…); Open = the project's list

const q = (projectId) => (projectId ? `projectId=${encodeURIComponent(projectId)}` : "");
const withQ = (path, projectId) => {
  const s = q(projectId);
  return s ? `${path}${path.includes("?") ? "&" : "?"}${s}` : path;
};

const form = (key, name, list, create, view) => ({
  key,
  name,
  kind: "form",
  listPath: list,
  createPath: (projectId) => withQ(create, projectId),
  viewPath: (id) => view.replace(":id", id),
});

const register = (key, name, list, create, view) => ({
  key,
  name,
  kind: "register",
  listPath: list,
  // Lists read either spelling of the project filter.
  projectListPath: (projectId) =>
    projectId ? `${withQ(list, projectId)}&project_id=${encodeURIComponent(projectId)}` : list,
  createPath: create ? (projectId) => withQ(create, projectId) : null,
  viewPath: view ? (id) => view.replace(":id", id) : null,
});

/**
 * Upload-type documents. `typeCodes` pins exact document types; `phaseCode`
 * takes every active type of that phase (Design, Tender / Working Drawings).
 * target "DRAWING" uses the drawings register (sheets with revisions).
 */
export const UPLOAD_DOCUMENTS = {
  contract: { key: "contract", name: "Contract", target: "DOCUMENT", typeCodes: ["PLAN_SIGNED_CONTRACT"], listPath: "/design/contract" },
  agreement: { key: "agreement", name: "Agreement", target: "DOCUMENT", typeCodes: ["PLAN_SIGNED_AGREEMENT"], listPath: "/build/agreement" },
  design: { key: "design", name: "Design", target: "DOCUMENT", phaseCode: "05_DESIGN", excludeCodes: ["DES_MATERIAL_PALETTE"], listPath: "/design/design" },
  "material-palette": { key: "material-palette", name: "Material Palette", target: "DOCUMENT", typeCodes: ["DES_MATERIAL_PALETTE"], listPath: "/design/material-palette" },
  "tender-drawings": { key: "tender-drawings", name: "Tender Drawings", target: "DRAWING", phaseCode: "06_TENDER", listPath: "/design/tender-drawings" },
  "working-drawings": { key: "working-drawings", name: "Working Drawings", target: "DRAWING", phaseCode: "07_WORKING", listPath: "/design/working-drawings" },
  // Pre Design slots
  "pre-design:existing-layout": { key: "pre-design:existing-layout", name: "Existing Layout", target: "DRAWING", typeCodes: ["PRE_EXISTING_LAYOUT"], listPath: "/design/pre-design" },
  "pre-design:proposed-layout": { key: "pre-design:proposed-layout", name: "Proposed Layout", target: "DRAWING", typeCodes: ["PRE_PROPOSED_LAYOUT"], listPath: "/design/pre-design" },
  "pre-design:pitch-presentation": { key: "pre-design:pitch-presentation", name: "Pitch Presentation", target: "DOCUMENT", typeCodes: ["PRE_PITCH_PROPOSAL"], listPath: "/design/pre-design" },
  "pre-design:concept-design": { key: "pre-design:concept-design", name: "Concept Design 01 – 3D", target: "DOCUMENT", typeCodes: ["PRE_CONCEPT_DESIGN_01"], listPath: "/design/pre-design" },
};

const upload = (key) => ({ ...UPLOAD_DOCUMENTS[key], kind: "upload" });

export const BUSINESS_PROPOSAL = form(
  "pre-design:business-proposal",
  "Business Proposal",
  "/crm/business-proposal/all",
  "/crm/forms/business-proposal",
  "/crm/business-proposal/:id",
);

/** Pre Design stage: 5 slots, in order. */
export const PRE_DESIGN_SLOTS = [
  upload("pre-design:existing-layout"),
  upload("pre-design:proposed-layout"),
  upload("pre-design:pitch-presentation"),
  BUSINESS_PROPOSAL,
  upload("pre-design:concept-design"),
];

export const PROJECT_DOCUMENTS = [
  form("client-brief", "Client Brief", "/crm/brief/all", "/crm/forms/project-brief", "/crm/brief/:id"),
  form("site-recce", "Site Recce", "/crm/recce/all", "/crm/forms/site-reki", "/crm/recce/:id"),
  form("scope-of-work", "Scope of Work", "/crm/scope-of-work/all", "/crm/forms/scope-of-work", "/crm/scope-of-work/:id"),
  { key: "pre-design", name: "Pre Design", kind: "stage", listPath: "/design/pre-design", stagePath: (projectId) => `/design/pre-design/${projectId}` },
  upload("contract"),
  upload("agreement"),
  form("payment-schedule", "Payment Schedule", "/ledger/payment-schedule/all", "/ledger/forms/payment-schedule", "/ledger/payment-schedule/:id"),
  form("plan-of-action", "Plan of Action", "/crm/plan-of-action/all", "/crm/forms/plan-of-action", "/crm/plan-of-action/:id"),
  form("project-planner", "Project Planner", "/projects/planner/list", "/projects/planner/create", "/projects/planner/:id"),
  upload("design"),
  upload("material-palette"),
  upload("tender-drawings"),
  form("procurement-sheet", "Procurement Sheet", "/procurement/material-procurement/list", "/procurement/material-procurement/new", "/procurement/material-procurement/:id"),
  form("vendor-comparison", "Vendor Comparison Sheet", "/procurement/vendors/rate-comparison", "/procurement/vendors/rate-comparison/new", "/procurement/vendors/rate-comparison/:id"),
  register("quotation", "Quotation", "/procurement/quotations", null, "/procurement/quotations/:id"),
  form("boq", "BOQ", "/ledger/boq/all", "/ledger/boq/new", "/ledger/boq/:id"),
  register("purchase-order", "PO", "/procurement/purchase-orders", "/procurement/purchase-orders/new", "/procurement/purchase-orders/:id"),
  register("work-order", "WO", "/procurement/work-order/all", "/procurement/work-order/new", "/procurement/work-order/:id"),
  upload("working-drawings"),
  register("site-inventory", "Site Inventory", "/inventory/site-inventory/all", null, null),
  register("delivery-challan", "Delivery Challan", "/procurement/delivery-challans", "/procurement/delivery-challans/new", "/procurement/delivery-challans/:id"),
  register("checklist", "Checklist", "/site-operations/checklists", "/site-operations/checklists/workspace", null),
  register("architect-site-visit-schedule", "Architect Site Visit Schedule", "/site-operations/visit-assignments", null, null),
  register("snag-list", "Snag List", "/site-operations/snag-lists", "/site-operations/snag-lists/workspace", "/site-operations/snag-lists/:id"),
];

export const projectDocument = (key) =>
  PROJECT_DOCUMENTS.find((d) => d.key === key) || PRE_DESIGN_SLOTS.find((d) => d.key === key);
