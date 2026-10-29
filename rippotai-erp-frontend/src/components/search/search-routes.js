// Keep search navigation aligned with src/router/routes rather than legacy URLs.
export function pathForEntity(hit) {
  if (!hit?.id) return null;
  const id = encodeURIComponent(hit.id);
  const projectId = hit.meta?.project_id ?? hit.meta?.projectId;
  const routes = {
    project: `/projects/${id}`,
    client: `/clients/${id}`,
    user: `/console/users?userId=${id}`,
    lead: `/crm/pipeline?deal=${id}`,
    vendor: `/procurement/vendors/${id}`,
    boq: `/ledger/boq/${id}`,
    project_brief: `/crm/brief/${id}`,
    quotation: `/procurement/estimates/${id}`,
    site_recce: `/crm/recce/${id}`,
    task: `/tasks/${id}`,
    calendar_event: `/calendar?eventId=${id}${hit.meta?.starts_at ? `&date=${encodeURIComponent(String(hit.meta.starts_at).slice(0, 10))}` : ''}`,
    document: `/projects/documents/${id}`,
    drawing: `/design-studio/${id}`,
    work_order: `/procurement/work-order/${id}`,
    delivery_challan: `/procurement/delivery-challans/${id}`,
    budget_estimate: `/ledger/budget-estimate/${id}`,
    material_requirement: projectId ? `/procurement/${encodeURIComponent(projectId)}/material-requirements?requirementId=${id}` : '/procurement/requirements',
    scope_of_work: `/crm/scope-of-work/${id}`,
    activity_log: '/activity',
  };
  return routes[hit.entity_type] || null;
}
