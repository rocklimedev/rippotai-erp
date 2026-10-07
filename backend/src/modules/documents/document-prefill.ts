// Mirrors the create steps in frontend/config/documentSequence.js. Upload/reference
// steps contain files, not typed form fields, and are skipped during fallback.
export const DOCUMENT_PREFILL_SEQUENCE = [
  { id: 'client-brief', model: 'ProjectBrief' },
  { id: 'site-recce', model: 'SiteRecce' },
  { id: 'scope-of-work', model: 'ScopeOfWork' },
  { id: 'business-proposal', model: 'BudgetEstimate' },
  { id: 'planner-consultancy', model: 'ProjectPlanner', type: 'CONSULTANCY' },
  { id: 'planner-pmc', model: 'ProjectPlanner', type: 'PMC' },
  { id: 'planner-procurement', model: 'ProjectPlanner', type: 'VENDOR_PROCUREMENT' },
  { id: 'payment-schedule', model: 'PaymentSchedule' },
  { id: 'plan-of-action', model: 'PlanOfAction' },
  { id: 'estimates-quotations', model: 'Quotation' },
  { id: 'material-procurement-sheet', model: 'MaterialProcurement' },
  { id: 'vendor-shortlist', model: 'VendorShortlist' },
  { id: 'boq-vendor-comparison', model: '' },
  { id: 'boq', model: 'Boq' },
  { id: 'purchase-order', model: 'PurchaseOrder' },
  { id: 'work-order', model: 'WorkOrder' },
  { id: 'delivery-challan', model: 'DeliveryChallan' },
  { id: 'quality-check-list', model: '' },
  { id: 'site-inventory-register', model: 'InventoryTransaction' },
  { id: 'daily-progress-report', model: 'DailySiteReport' },
];

export const PREFILL_MODEL_SEQUENCE = Object.fromEntries(
  DOCUMENT_PREFILL_SEQUENCE.filter(step => step.model && step.model !== 'ProjectPlanner')
    .map(step => [step.model, step.id]),
);

export function previousDocumentSteps(sequence: string) {
  const index = DOCUMENT_PREFILL_SEQUENCE.findIndex(step => step.id === sequence);
  return index < 0 ? null : DOCUMENT_PREFILL_SEQUENCE.slice(0, index).reverse();
}

export function boqCategoriesFromPrefill(documents: Record<string, any>) {
  for (const key of ['material-procurement-sheet', 'estimates-quotations', 'business-proposal', 'scope-of-work']) {
    const source = documents[key];
    if (!source) continue;
    const groups = source.categories?.length ? source.categories : [{ name: key === 'scope-of-work' ? 'Scope of Work' : 'Materials', items: source.items || [] }];
    const categories = groups.map((group: any) => ({
      name: group.name,
      items: (group.items || []).filter((item: any) => !item.hidden && !item.isExcluded && (key !== 'scope-of-work' || item.isIncluded))
        .map((item: any) => ({
          name: item.name || item.particular || item.materialMaster?.name || item.scopeOfWork,
          quantity: Number(item.quantity ?? 0), rate: Number(item.rate ?? item.price ?? 0),
          calc_type: item.calc_type === 'L' ? 'L' : 'M',
          amount: item.calc_type === 'L' ? Number(item.amount ?? 0) : Number(item.quantity ?? 0) * Number(item.rate ?? item.price ?? 0),
          unit_id: item.unit_id || item.unitId || null, unit: typeof item.unit === 'string' ? item.unit : null,
          location: item.location || item.projectSpace?.name || null, notes: item.notes || item.remarks || null,
        })).filter((item: any) => item.name),
    })).filter((group: any) => group.items.length);
    if (categories.length) return categories;
  }
  return [];
}
