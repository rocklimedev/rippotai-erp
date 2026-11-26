// Short record codes and routes of every flow document.
const q = (o) => new URLSearchParams(Object.entries(o).filter(([, v]) => v)).toString();

export const DOC_META = {
  'client-brief': {
    label: 'Client Brief',
    prefix: 'CB',
    list: '/crm/brief/all',
    view: (id) => `/crm/brief/${id}`,
  },
  'site-recce': {
    label: 'Site Recce',
    prefix: 'SR',
    list: '/crm/recce/all',
    view: (id) => `/crm/recce/${id}`,
  },
  'scope-of-work': {
    label: 'Scope of Work',
    prefix: 'SOW',
    list: '/crm/scope-of-work/all',
    view: (id) => `/crm/scope-of-work/${id}`,
  },
  'payment-schedule': {
    label: 'Payment Schedule',
    prefix: 'PS',
    list: '/ledger/payment-schedule/all',
    view: (id) => `/ledger/payment-schedule/${id}`,
  },
  'plan-of-action': {
    label: 'Plan of Action',
    prefix: 'POA',
    list: '/crm/plan-of-action/all',
    view: (id) => `/crm/plan-of-action/${id}`,
  },
  'project-planner': {
    label: 'Project Planner',
    prefix: 'PP',
    list: '/projects/planner/list',
    view: (id) => `/projects/planner/${id}`,
  },
  'business-proposal': {
    label: 'Business Proposal',
    prefix: 'BP',
    list: '/crm/business-proposal/all',
    view: (id) => `/crm/business-proposal/${id}`,
  },
  'budget-guide': {
    label: 'Budget Guide',
    prefix: 'BG',
    list: '/ledger/budget-guides/all',
    view: (id) => `/ledger/budget-guides/${id}`,
  },
  'consent-form': { label: 'Consent Form', prefix: 'CF', list: '/build/consent-form' },
  'vendor-comparison': {
    label: 'Vendor Comparison',
    prefix: 'VC',
    list: '/procurement/vendors/rate-comparison',
    view: (id) => `/procurement/vendors/rate-comparison/${id}`,
  },
  quotation: {
    label: 'Quotation',
    prefix: 'QTN',
    list: '/procurement/quotations',
    view: (id) => `/procurement/quotations/${id}`,
  },
  'procurement-sheet': {
    label: 'Procurement Sheet',
    prefix: 'PRS',
    list: '/procurement/material-procurement/list',
    view: (id) => `/procurement/material-procurement/${id}`,
  },
  boq: {
    label: 'BOQ',
    prefix: 'BOQ',
    list: '/ledger/boq/all',
    view: (id) => `/ledger/boq/${id}/preview`,
  },
  'purchase-order': {
    label: 'Purchase Order',
    short: 'PO',
    prefix: 'PO',
    list: '/procurement/purchase-orders',
    view: (id) => `/procurement/purchase-orders/${id}`,
  },
  'work-order': {
    label: 'Work Order',
    short: 'WO',
    prefix: 'WO',
    list: '/procurement/work-order/all',
    view: (id) => `/procurement/work-order/${id}`,
  },
  'work-order-payments': {
    label: 'Payment stages',
    view: (id) => `/procurement/work-order/${id}#payments`,
  },
  'site-inventory': {
    label: 'Site Inventory',
    prefix: 'INV',
    list: '/inventory/site-inventory/all',
  },
  'delivery-challan': {
    label: 'Delivery Challan',
    short: 'DC',
    prefix: 'DC',
    list: '/procurement/delivery-challans',
    view: (id) => `/procurement/delivery-challans/${id}`,
  },
  checklist: {
    label: 'Checklist',
    prefix: 'CL',
    list: '/site-operations/checklists',
    view: (id, projectId) =>
      `/site-operations/checklists/workspace?${q({ projectId, checklistId: id, view: '1' })}`,
  },
  'architect-visit-schedule': {
    label: 'Architect Site Visit Schedule',
    prefix: 'AVS',
    list: '/site-operations/visit-assignments',
  },
  'snag-list': {
    label: 'Snag List',
    prefix: 'SNG',
    list: '/site-operations/snag-lists',
    view: (id) => `/site-operations/snag-lists/${id}`,
  },
  'daily-site-report': {
    label: 'Daily Site Report',
    prefix: 'DSR',
    list: '/site-operations/daily-reports',
    view: (id) => `/site-operations/daily-reports/${id}`,
  },
  'admin-dpr': {
    label: 'Admin DPR',
    prefix: 'DPR',
    list: '/site-operations/admin-dpr',
    view: (id) => `/site-operations/admin-dpr/${id}`,
  },
  document: { label: 'Document', prefix: 'DOC', view: (id) => `/projects/documents/${id}` },
  drawing: { label: 'Drawing', prefix: 'DRW', view: (id) => `/design-studio/${id}` },
  project: { label: 'Project', view: (id) => `/projects/${id}` },
};

export const docMeta = (type) => DOC_META[type] || { label: type, prefix: null };

/** Document's own number. */
export const docCode = (number) => (number ? String(number) : null);

export const projectLabel = (project) => project?.name || '';

export function viewPath(type, id, projectId) {
  const m = DOC_META[type];
  if (!m?.view || !id) return null;
  return m.view(id, projectId);
}

export const projectOverviewPath = (projectId) => (projectId ? `/projects/${projectId}` : null);

/** Phase codes such as 06_TENDER → "Tender phase". */
export function phaseLabel(code) {
  if (!code) return null;
  const words = String(code)
    .replace(/^\d+_/, '')
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());
  return /phase|stage/i.test(words) ? words : `${words} phase`;
}

export const fmtDay = (v) => {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const fmtDayTime = (v) => {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return `${fmtDay(d)}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
};
