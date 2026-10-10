import { CommandCenterService } from './command-center.service';
import { CommandCenterCacheService } from './command-center-cache.service';
import { ProjectDashboardService } from './project-dashboard.service';
import { PhaseRollupState } from '../../common/enums/command-center.enum';

jest.mock('../cdn/cdn.service', () => ({ CdnService: class {} }));

describe('Shared portfolio read model', () => {
  function setup() {
    const entries = new Map<string, string>();
    const cache = new CommandCenterCacheService(
      {
        status: 'ready',
        get: async (key: string) => entries.get(key) ?? null,
        set: async (key: string, value: string) => {
          entries.set(key, value);
          return 'OK';
        },
      } as any,
      { getDatabaseName: () => 'test', modelManager: { models: [] } } as any,
    );
    const service: any = Object.create(CommandCenterService.prototype);
    Object.assign(service, {
      cache,
      projectModel: {
        findAll: jest
          .fn()
          .mockResolvedValue([{ id: 'a', approved_value: '125.50' }]),
      },
      openSiteQcFailures: jest.fn().mockResolvedValue([]),
      buildProjectRow: jest.fn().mockResolvedValue({
        id: 'a',
        name: 'Alpha',
        code: 'A',
        location: 'Delhi',
        health: { key: 'OK' },
        phases: [
          {
            phaseNumber: 10,
            state: PhaseRollupState.COMPLETE,
            docsTotal: 1,
            docsDone: 1,
          },
        ],
      }),
    });
    return { service, cache };
  }

  it('builds projects once for simultaneous portfolio, KPI and commercial reads', async () => {
    const { service } = setup();
    const [rows, kpis, commercial] = await Promise.all([
      service.getPortfolio({}),
      service.getKpis(),
      service.getCommercial(),
    ]);
    expect(rows).toHaveLength(1);
    expect(kpis.value).toBe(125.5);
    expect(commercial).toMatchObject({
      totalValue: 125.5,
      approvedValue: 125.5,
      approved: 1,
    });
    expect(service.projectModel.findAll).toHaveBeenCalledTimes(1);
    expect(service.openSiteQcFailures).toHaveBeenCalledTimes(1);
    await service.getPortfolio({ search: 'missing' });
    expect(await service.getPortfolio({ search: 'Alpha' })).toHaveLength(1);
    expect(service.projectModel.findAll).toHaveBeenCalledTimes(1);
  });

  it('rebuilds dependent projections after invalidation', async () => {
    const { service, cache } = setup();
    await service.getKpis();
    service.projectModel.findAll.mockResolvedValue([
      { id: 'a', approved_value: '200' },
    ]);
    await cache.invalidate();
    expect((await service.getKpis()).value).toBe(200);
    expect((await service.getCommercial()).totalValue).toBe(200);
    expect(service.projectModel.findAll).toHaveBeenCalledTimes(2);
  });

  it('keeps parameterized dashboard aggregates separate and reuses identical requests', async () => {
    const { cache } = setup();
    const query = jest.fn().mockResolvedValue([]);
    const dashboard = new ProjectDashboardService(
      {} as any,
      {} as any,
      {} as any,
      { query } as any,
      cache,
    );
    await dashboard.getProjectsProgressTrend(3);
    await dashboard.getProjectsProgressTrend(6);
    await dashboard.getProjectsProgressTrend(3);
    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls.map((call) => call[1].replacements.months)).toEqual(
      [3, 6],
    );
  });
});
