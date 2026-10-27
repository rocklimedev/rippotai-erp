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

  it('shares one evidence snapshot across concurrent views and rebuilds after writes', async () => {
    const { service, cache } = setup();
    service.docTypeModel = { findAll: jest.fn(async () => [{ id: 'type' }]) };
    service.evidence = { resolveMany: jest.fn(async () => new Map([['type', { satisfied: true }]])) };
    const [portfolio, phase] = await Promise.all([
      service.getProjectEvidence('project'), service.getProjectEvidence('project'),
    ]);
    expect(portfolio.get('type').satisfied).toBe(true);
    expect(phase.get('type').satisfied).toBe(true);
    expect(service.evidence.resolveMany).toHaveBeenCalledTimes(1);
    await service.getProjectEvidence('project');
    expect(service.evidence.resolveMany).toHaveBeenCalledTimes(1);
    await cache.invalidate();
    await service.getProjectEvidence('project');
    expect(service.evidence.resolveMany).toHaveBeenCalledTimes(2);
    await service.getProjectEvidence('other-project');
    expect(service.evidence.resolveMany).toHaveBeenCalledTimes(3);
  });

  it('does not evaluate gates for summary panels, but does for expanded phase detail', async () => {
    const { service } = setup();
    service.mustFindProject = jest.fn(async () => ({ id: 'project' }));
    service.phaseModel = { findByPk: jest.fn(async () => ({ id: 'phase', module: 'DOCUMENTS' })) };
    service.docTypeModel = { findAll: jest.fn(async () => []) };
    service.taskDefModel = { findAll: jest.fn(async () => []) };
    service.taskExecModel = { findAll: jest.fn(async () => []) };
    service.getProjectEvidence = jest.fn(async () => new Map());
    service.gateEngine = { listProjectGates: jest.fn(async () => []) };
    await service.getPhaseSummary('project', 'phase');
    expect(service.gateEngine.listProjectGates).not.toHaveBeenCalled();
    await service.getPhaseDetail('project', 'phase');
    expect(service.gateEngine.listProjectGates).toHaveBeenCalledTimes(1);
  });

  it('finishes one project before starting the next portfolio rollup', async () => {
    const { service } = setup();
    service.projectModel.findAll.mockResolvedValue([{ id: 'a' }, { id: 'b' }]);
    let finishFirst!: () => void;
    const first = new Promise<void>((resolve) => {
      finishFirst = resolve;
    });
    let startedFirst!: () => void;
    const started = new Promise<void>((resolve) => {
      startedFirst = resolve;
    });
    service.buildProjectRow.mockImplementation(
      async (project: { id: string }) => {
        if (project.id === 'a') {
          startedFirst();
          await first;
        }
        return { id: project.id, phases: [] };
      },
    );
    const pending = service.getPortfolio({});
    await started;
    expect(service.buildProjectRow).toHaveBeenCalledTimes(1);
    finishFirst();
    expect((await pending).map((row: { id: string }) => row.id)).toEqual([
      'a',
      'b',
    ]);
    expect(service.buildProjectRow).toHaveBeenCalledTimes(2);
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
