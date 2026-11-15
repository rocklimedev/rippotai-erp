// Keep search navigation aligned with src/router/routes rather than legacy URLs.
// Budget estimates and material requirements are hidden from INOS (FLOW-SPEC):
// they have no route here, so search drops them.
export function pathForEntity(hit) {
  if (!hit?.id) return null;
  const id = encodeURIComponent(hit.id);
  const routes = {
    project: `/projects/${id}`,
    client: `/clients/${id}`,
    user: `/console/users?userId=${id}`,
    lead: `/crm/pipeline?deal=${id}`,
    vendor: `/procurement/vendors/${id}`,
    boq: `/ledger/boq/${id}`,
    project_brief: `/crm/brief/${id}`,
    site_recce: `/crm/recce/${id}`,
    task: `/tasks/${id}`,
    calendar_event: `/calendar?eventId=${id}${hit.meta?.starts_at ? `&date=${encodeURIComponent(String(hit.meta.starts_at).slice(0, 10))}` : ''}`,
    document: `/projects/documents/${id}`,
    drawing: `/design-studio/${id}`,
    work_order: `/procurement/work-order/${id}`,
    delivery_challan: `/procurement/delivery-challans/${id}`,
    scope_of_work: `/crm/scope-of-work/${id}`,
    activity_log: '/activity',
  };
  return routes[hit.entity_type] || null;
}
