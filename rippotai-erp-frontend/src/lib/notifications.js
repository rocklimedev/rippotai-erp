export const notificationGroups = {
  tasks: "Tasks",
  projects: "Projects",
  crm: "CRM documents and leads",
  drawings: "Drawings",
  procurement: "Procurement",
  finance: "BOQ and payment schedules",
  siteOperations: "Site operations",
  administration: "Team and administration",
  calendar: "Calendar",
  other: "Other updates",
};
export const defaultNotificationPreferences = Object.fromEntries(
  Object.keys(notificationGroups).map((key) => [key, true]),
);
export function notificationGroup(notification) {
  const type = notification.entity_type || notification.type || "";
  if (/^task/.test(type)) return "tasks";
  if (
    /^(team|role|company_setting|document_type|project_phase|project_type|terms_template|unit|workflow_library)/.test(
      type,
    )
  )
    return "administration";
  if (/^project/.test(type)) return "projects";
  if (
    /^(lead|brief|site_recce|business_proposal|plan_of_action|scope_of_work)/.test(
      type,
    )
  )
    return "crm";
  if (/^drawing/.test(type)) return "drawings";
  if (/^(boq|payment_schedule)/.test(type)) return "finance";
  if (
    /^(quotation|purchase_order|work_order|delivery_challan|vendor|shortlist|material|sample_board|inventory)/.test(
      type,
    )
  )
    return "procurement";
  if (
    /^(rfi|mockup|site_visit|visit_assignment|snag|daily_site_report|admin_daily_report|quality_checklist|qc_sign_off|visit_stage)/.test(
      type,
    )
  )
    return "siteOperations";
  if (/^calendar/.test(type)) return "calendar";
  return "other";
}
export function notificationDestination(notification) {
  if (String(notification.type).endsWith("_deleted")) return null;
  const id = encodeURIComponent(notification.entity_id || "");
  // Collection destinations also cover child edits and deleted records.
  const registers = {
    purchase_order: "/procurement/purchase-orders",
    work_order: "/procurement/work-order/all",
    delivery_challan: "/procurement/delivery-challans",
    inventory: "/inventory/site-inventory/transactions",
    material: "/procurement",
    material_procurement: "/procurement/material-procurement/list",
    material_requirement: "/procurement/requirements",
    material_estimate: "/procurement/estimates/all",
    material_quotation: "/procurement/quotations",
    material_rate_sheet: "/procurement/rate-sheets",
    sample_board: "/procurement/sample-boards",
    vendor_rate_comparison: "/procurement/vendors/rate-comparison",
    vendor_shortlist: "/procurement/vendors/shortlists",
    shortlist_package: "/procurement/vendors/shortlists",
    boq: "/ledger/boq/all",
    boq_template: "/ledger/boq/templates",
    boq_library: "/ledger/boq/rate-and-item-library",
    payment_schedule: "/ledger/payment-schedule/all",
    project_planner: "/projects/planner/list",
    project_location: "/projects",
    project_gate: "/projects",
    project_progress: "/projects",
    rfi: "/site-operations/rfis",
    mockup: "/site-operations/mockups",
    site_visit: "/site-operations/site-visits",
    visit_assignment: "/site-operations/visit-assignments",
    snag: "/site-operations/snag-lists",
    snag_list: "/site-operations/snag-lists",
    daily_site_report: "/site-operations/daily-reports",
    admin_daily_report: "/site-operations/admin-dpr",
    quality_checklist: "/site-operations/checklists/workspace",
    qc_sign_off: "/site-operations/qc/history",
    visit_stage: "/site-operations/site-visits",
    team: "/console/users",
    note: "/tasks/notes",
    automation_rule: "/automation/rules",
    document_requirement: "/projects/documents/all",
    document_type: "/console/document-types",
    project_phase: "/console/project-phases",
    project_type: "/console/project-structure",
    terms_template: "/console/terms-and-conditions",
    unit: "/console/super-admin",
    workflow_library: "/console/project-structure",
    role: "/console/roles-permissions",
    company_setting: "/console/company-profile",
  };
  if (!id) return registers[notification.entity_type] || null;
  if (["project_gate", "project_progress"].includes(notification.entity_type)) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      notification.entity_id,
    )
      ? `/projects/${id}`
      : "/projects";
  }
  const routes = {
    project: `/projects/${id}`,
    task: `/tasks/${id}`,
    client: `/clients/${id}`,
    lead: `/crm/pipeline?deal=${id}`,
    brief: `/crm/brief/${id}`,
    site_recce: `/crm/recce/${id}`,
    drawing: `/design-studio/${id}`,
    business_proposal: `/crm/business-proposal/${id}`,
    plan_of_action: `/crm/plan-of-action/${id}`,
    scope_of_work: `/crm/scope-of-work/${id}`,
    vendor: `/procurement/vendors/${id}`,
    purchase_order: `/procurement/purchase-orders/${id}`,
    work_order: `/procurement/work-order/${id}`,
    delivery_challan: `/procurement/delivery-challans/${id}`,
    material_procurement: `/procurement/material-procurement/${id}`,
    material_estimate: `/procurement/estimates/${id}`,
    vendor_rate_comparison: `/procurement/vendors/rate-comparison/${id}`,
    vendor_shortlist: `/procurement/vendors/shortlists/${id}`,
    boq: `/ledger/boq/${id}`,
    boq_template: `/ledger/boq/template/${id}/editor`,
    payment_schedule: `/ledger/payment-schedule/${id}`,
    project_planner: `/projects/planner/${id}`,
    site_visit: `/site-operations/site-visits/${id}`,
    snag_list: `/site-operations/snag-lists/${id}`,
    daily_site_report: `/site-operations/daily-reports/${id}`,
    inventory: `/inventory/site-inventory/transactions/${id}`,
    calendar_event: "/calendar",
    quotation: "/procurement/quotations",
    document: "/projects/documents/all",
  };
  return (
    routes[notification.entity_type] ||
    registers[notification.entity_type] ||
    null
  );
}
