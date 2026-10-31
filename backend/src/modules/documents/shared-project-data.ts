/** Only fields with the same business meaning belong in this map. */
export const SHARED_PROJECT_FIELDS: Record<string, Record<string, string>> = {
  // Canonical project facts. Every other document reads from / writes back to these.
  Project: {
    site_location: 'siteAddress',
    project_type_id: 'projectTypeId',
    site_area: 'siteArea',
    site_area_unit: 'siteAreaUnit',
    number_of_floors: 'numberOfFloors',
    lift_available: 'liftAvailable',
    client_budget: 'budget',
    desired_start_date: 'desiredStartDate',
    expected_completion_date: 'targetCompletionDate',
  },
  ProjectBrief: {
    siteAddress: 'siteAddress',
    projectTypeId: 'projectTypeId',
    siteArea: 'siteArea',
    siteAreaUnit: 'siteAreaUnit',
    numberOfFloors: 'numberOfFloors',
    liftAvailable: 'liftAvailable',
    initialClientBudget: 'budget',
    desiredStartDate: 'desiredStartDate',
    targetCompletionDate: 'targetCompletionDate',
  },
  SiteRecce: {
    site_address: 'siteAddress',
    carpet_area_sqft: 'siteAreaSqft',
    number_of_floors: 'numberOfFloors',
    lift_available: 'liftAvailable',
    client_name: 'clientName',
    project_name: 'projectName',
  },
  PurchaseOrder: { ship_to_address: 'siteAddress' },
  BudgetEstimate: { location: 'siteAddress', client_name: 'clientName' },
  DeliveryChallan: { site_address: 'siteAddress' },
  WorkOrder: { site_address: 'siteAddress', project_name: 'projectName' },
  Boq: { location: 'siteAddress', client_name: 'clientName' },
};

export const isMissingSharedValue = (value: unknown) =>
  value === null ||
  value === undefined ||
  (typeof value === 'string' && value.trim() === '');

export function missingSharedFields(
  values: Record<string, unknown>,
  mapping: Record<string, string>,
  shared: Record<string, unknown>,
) {
  return Object.fromEntries(
    Object.entries(mapping)
      .filter(
        ([field, key]) =>
          isMissingSharedValue(values[field]) &&
          !isMissingSharedValue(shared[key]),
      )
      .map(([field, key]) => [field, shared[key]]),
  );
}

export function canReceiveSharedData(values: Record<string, unknown>) {
  if (
    values.locked ||
    values.isLocked ||
    values.approved_at ||
    values.approvedAt
  )
    return false;
  const status = String(values.status ?? 'draft').toLowerCase();
  return ['draft', 'pending', 'pending_approval', 'active'].includes(status);
}

const SQFT_PER_UNIT: Record<string, number> = { SQ_FT: 1, GAJ: 9 };

/** Derive the sq-ft area and its inverse so area typed in any unit reaches every document. */
export function normalizeSharedFacts(shared: Record<string, unknown>) {
  const unit = isMissingSharedValue(shared.siteAreaUnit)
    ? 'SQ_FT'
    : String(shared.siteAreaUnit);
  const area = Number(shared.siteArea);
  if (
    isMissingSharedValue(shared.siteAreaSqft) &&
    !isMissingSharedValue(shared.siteArea) &&
    Number.isFinite(area) &&
    SQFT_PER_UNIT[unit]
  )
    shared.siteAreaSqft = Math.round(area * SQFT_PER_UNIT[unit] * 100) / 100;
  if (
    isMissingSharedValue(shared.siteArea) &&
    !isMissingSharedValue(shared.siteAreaSqft) &&
    Number.isFinite(Number(shared.siteAreaSqft))
  ) {
    shared.siteArea = Number(shared.siteAreaSqft);
    if (isMissingSharedValue(shared.siteAreaUnit))
      shared.siteAreaUnit = 'SQ_FT';
  }
  return shared;
}

export interface ProjectRoom {
  name: string;
  area?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  unit?: string | null;
  quantity?: number | null;
  notes?: string | null;
  source?: string;
}

const roomKey = (name: unknown) =>
  String(name ?? '')
    .trim()
    .toLowerCase();

/** Merge room lists in priority order: one entry per name, blanks filled from later lists. */
export function mergeRooms(...lists: ProjectRoom[][]) {
  const rooms = new Map<string, ProjectRoom>();
  for (const list of lists)
    for (const room of list || []) {
      const key = roomKey(room?.name);
      if (!key) continue;
      const current = rooms.get(key);
      if (!current) {
        rooms.set(key, { ...room, name: String(room.name).trim() });
        continue;
      }
      for (const [field, value] of Object.entries(room))
        if (
          isMissingSharedValue((current as any)[field]) &&
          !isMissingSharedValue(value)
        )
          (current as any)[field] = value;
    }
  return [...rooms.values()];
}

const num = (value: unknown) =>
  isMissingSharedValue(value) || !Number.isFinite(Number(value))
    ? null
    : Number(value);

export const roomsFromProjectSpaces = (spaces: any[] = []): ProjectRoom[] =>
  [...spaces]
    .filter((space) => space.isActive !== false && space.is_active !== false)
    .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
    .map((space) => ({
      name: space.name,
      area: num(space.area),
      length: num(space.length),
      width: num(space.width),
      height: num(space.height),
      unit: space.measurementUnit ?? null,
      notes: space.description ?? null,
      source: space.sourceDocument || 'project',
    }));

export const roomsFromBrief = (brief: any): ProjectRoom[] =>
  [...(brief?.spaceRequirements || [])]
    .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
    .map((room) => ({
      name: room.spaceName,
      quantity: num(room.quantity),
      notes:
        [room.requirementDetails, room.notes].filter(Boolean).join('\n') ||
        null,
      source: 'client-brief',
    }));

export const roomsFromRecce = (recce: any): ProjectRoom[] =>
  [...(recce?.rooms || [])]
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
    .map((room) => ({
      name: room.room_name,
      area:
        num(room.area) ??
        (num(room.length) && num(room.width)
          ? Math.round(Number(room.length) * Number(room.width) * 100) / 100
          : null),
      length: num(room.length),
      width: num(room.width),
      height: num(room.height),
      unit: room.measurement_unit ?? null,
      notes: room.notes ?? null,
      source: 'site-recce',
    }));
