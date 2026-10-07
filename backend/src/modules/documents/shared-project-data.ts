/** Only fields with the same business meaning belong in this map. */
export const SHARED_PROJECT_FIELDS: Record<string, Record<string, string>> = {
  Project: { site_location: 'siteAddress', project_type_id: 'projectTypeId' },
  ProjectBrief: {
    siteAddress: 'siteAddress', projectTypeId: 'projectTypeId',
    numberOfFloors: 'numberOfFloors', liftAvailable: 'liftAvailable',
  },
  SiteRecce: {
    site_address: 'siteAddress', number_of_floors: 'numberOfFloors',
    lift_available: 'liftAvailable', client_name: 'clientName',
    project_name: 'projectName',
  },
  BudgetEstimate: { location: 'siteAddress', client_name: 'clientName' },
  DeliveryChallan: { site_address: 'siteAddress' },
  WorkOrder: { site_address: 'siteAddress', project_name: 'projectName' },
  Boq: { location: 'siteAddress', client_name: 'clientName' },
};

export const isMissingSharedValue = (value: unknown) =>
  value === null || value === undefined ||
  (typeof value === 'string' && value.trim() === '');

export function missingSharedFields(
  values: Record<string, unknown>, mapping: Record<string, string>,
  shared: Record<string, unknown>,
) {
  return Object.fromEntries(Object.entries(mapping).filter(([field, key]) =>
    isMissingSharedValue(values[field]) && !isMissingSharedValue(shared[key]),
  ).map(([field, key]) => [field, shared[key]]));
}

export function canReceiveSharedData(values: Record<string, unknown>) {
  if (values.locked || values.isLocked || values.approved_at || values.approvedAt) return false;
  const status = String(values.status ?? 'draft').toLowerCase();
  return ['draft', 'pending', 'pending_approval', 'active'].includes(status);
}
