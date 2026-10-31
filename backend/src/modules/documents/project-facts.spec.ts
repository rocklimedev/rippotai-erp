import {
  SHARED_PROJECT_FIELDS,
  mergeRooms,
  normalizeSharedFacts,
  roomsFromBrief,
  roomsFromRecce,
} from './shared-project-data';
import { SharedProjectDataService } from './shared-project-data.service';

describe('canonical project facts', () => {
  it('maps the same facts on the project and every document that collects them', () => {
    const keys = (model: string) =>
      Object.values(SHARED_PROJECT_FIELDS[model]).sort();
    for (const key of [
      'siteAddress',
      'siteArea',
      'siteAreaUnit',
      'numberOfFloors',
      'liftAvailable',
      'budget',
      'desiredStartDate',
      'targetCompletionDate',
    ]) {
      expect(keys('Project')).toContain(key);
      expect(keys('ProjectBrief')).toContain(key);
    }
    expect(SHARED_PROJECT_FIELDS.SiteRecce.carpet_area_sqft).toBe(
      'siteAreaSqft',
    );
    expect(SHARED_PROJECT_FIELDS.PurchaseOrder.ship_to_address).toBe(
      'siteAddress',
    );
  });

  it('converts site area between units in both directions', () => {
    expect(
      normalizeSharedFacts({ siteArea: 200, siteAreaUnit: 'GAJ' }).siteAreaSqft,
    ).toBe(1800);
    expect(normalizeSharedFacts({ siteArea: '1450.5' }).siteAreaSqft).toBe(
      1450.5,
    );
    expect(normalizeSharedFacts({ siteAreaSqft: 900 })).toEqual({
      siteAreaSqft: 900,
      siteArea: 900,
      siteAreaUnit: 'SQ_FT',
    });
    // "OTHER" units cannot be converted, so no sq-ft value is invented.
    expect(
      normalizeSharedFacts({ siteArea: 3, siteAreaUnit: 'OTHER' }).siteAreaSqft,
    ).toBeUndefined();
  });

  it('merges rooms by name, keeping the first value and filling blanks', () => {
    const brief = roomsFromBrief({
      spaceRequirements: [
        { spaceName: 'Kitchen', requirementDetails: 'Island', sortOrder: 1 },
        { spaceName: 'Master Bedroom', sortOrder: 0 },
      ],
    });
    const recce = roomsFromRecce({
      rooms: [
        { room_name: ' kitchen ', length: 12, width: 10, area: 120 },
        { room_name: 'Puja', area: 20 },
      ],
    });
    expect(mergeRooms(brief, recce)).toEqual([
      expect.objectContaining({ name: 'Master Bedroom' }),
      expect.objectContaining({
        name: 'Kitchen',
        notes: 'Island',
        length: 12,
        area: 120,
        source: 'client-brief',
      }),
      expect.objectContaining({ name: 'Puja', area: 20 }),
    ]);
  });
});

describe('room write-back', () => {
  function spaceRow(values: Record<string, any>) {
    return {
      values,
      get: (key: string) => values[key],
      update: jest.fn(async (patch) => Object.assign(values, patch)),
    };
  }

  it('adds new rooms to project spaces and fills only empty sizes', async () => {
    const kitchen = spaceRow({
      name: 'Kitchen',
      slug: 'kitchen',
      sortOrder: 1,
      description: 'Typed by user',
      area: null,
    });
    const deleted = spaceRow({
      name: 'Store',
      slug: 'store',
      sortOrder: 2,
      deletedAt: new Date(),
    });
    const ProjectSpace = {
      findAll: jest.fn(async () => [kitchen, deleted]),
      create: jest.fn(async (values) => spaceRow(values)),
    };
    const service = new SharedProjectDataService({
      models: { ProjectSpace },
    } as any);
    await service.syncRooms('p1', [
      { name: 'kitchen', area: 120, notes: 'Other notes' },
      { name: 'Store', area: 30 },
      { name: 'Living Room', area: 300, source: 'site-recce' },
    ]);
    expect(kitchen.update).toHaveBeenCalledWith(
      { area: 120 },
      expect.anything(),
    );
    expect(deleted.update).not.toHaveBeenCalled();
    expect(ProjectSpace.create).toHaveBeenCalledTimes(1);
    expect(ProjectSpace.create.mock.calls[0][0]).toMatchObject({
      projectId: 'p1',
      name: 'Living Room',
      slug: 'living-room',
      sortOrder: 3,
      area: 300,
      sourceDocument: 'site-recce',
    });
  });

  it('returns canonical rooms and client facts in the prefill context', async () => {
    const project = {
      associations: { client: {} },
      findByPk: jest.fn(async () => ({
        get: (key: string) =>
          ({
            name: 'Villa',
            site_location: 'Plot 4',
            site_area: 200,
            site_area_unit: 'GAJ',
            client: {
              get: (k: string) =>
                ({ name: 'Mehra', phone: '98100', email: 'm@x.in' })[k],
            },
          })[key],
      })),
    };
    const ProjectSpace = {
      findAll: jest.fn(async () => [
        {
          get: () => ({ name: 'Kitchen', sortOrder: 1, area: '120.00' }),
        },
      ]),
    };
    const service = new SharedProjectDataService({
      models: { Project: project, ProjectSpace },
    } as any);
    const context = await service.prefill('p1', 'client-brief');
    expect(context.shared).toMatchObject({
      siteAddress: 'Plot 4',
      siteArea: 200,
      siteAreaSqft: 1800,
      clientName: 'Mehra',
      clientPhone: '98100',
      clientEmail: 'm@x.in',
      roomCount: 1,
      rooms: [expect.objectContaining({ name: 'Kitchen', area: 120 })],
    });
    expect(context.sources.siteArea).toEqual({ sequence: 'project', id: 'p1' });
    expect(context.sources.clientPhone).toEqual({
      sequence: 'client',
      id: 'p1',
    });
  });
});

describe('BOQ sections from rooms', () => {
  it('falls back to one empty section per room when nothing is priced yet', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { boqCategoriesFromPrefill } = require('./document-prefill');
    expect(
      boqCategoriesFromPrefill({}, [{ name: 'Kitchen' }, { name: '' }]),
    ).toEqual([{ name: 'Kitchen', items: [] }]);
    expect(
      boqCategoriesFromPrefill(
        {
          'scope-of-work': {
            items: [{ scopeOfWork: 'Paint', isIncluded: true }],
          },
        },
        [{ name: 'Kitchen' }],
      )[0].name,
    ).toBe('Scope of Work');
  });

  it('derives a room area from length x width when the recce left it blank', () => {
    expect(
      roomsFromRecce({ rooms: [{ room_name: 'A', length: 12, width: 10 }] })[0]
        .area,
    ).toBe(120);
  });
});
