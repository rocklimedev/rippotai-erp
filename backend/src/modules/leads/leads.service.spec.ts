import { LeadsService } from './leads.service';
import { LeadStage } from '@/common/enums/leads.enums';

describe('Lead document stage updates', () => {
  const actor = { id: 'user', name: 'User' };

  function setup(
    evidence: Record<string, number | string>,
    stages: LeadStage[],
  ) {
    const leads = stages.map((stage, index) => ({ id: String(index), stage }));
    const model = { findAll: jest.fn().mockResolvedValue(leads) };
    const service = new LeadsService(
      {} as any,
      {} as any,
      model as any,
      {} as any,
      {} as any,
      {} as any,
    );
    jest.spyOn(service as any, 'select').mockResolvedValue([evidence]);
    jest.spyOn(service, 'moveStage').mockResolvedValue({} as any);
    return service;
  }

  it('advances early leads after recce without regressing later or closed stages', async () => {
    const service = setup({ recce: 1, proposal: 0 }, [
      LeadStage.CAPTURE,
      LeadStage.QUAL,
      LeadStage.PROP,
      LeadStage.LOST,
      LeadStage.CONTRACT,
    ]);
    await service.syncProjectStage('project', actor);
    expect(service.moveStage).toHaveBeenCalledTimes(2);
    expect(service.moveStage).toHaveBeenCalledWith(actor, '0', LeadStage.DISC);
    expect(service.moveStage).toHaveBeenCalledWith(actor, '1', LeadStage.DISC);
  });

  it('moves to proposal when saved and uploaded proposal evidence exists', async () => {
    const service = setup({ recce: 1, proposal: 1 }, [
      LeadStage.DISC,
      LeadStage.NEGO,
    ]);
    await service.syncProjectStage('project', actor);
    expect(service.moveStage).toHaveBeenCalledTimes(1);
    expect(service.moveStage).toHaveBeenCalledWith(actor, '0', LeadStage.PROP);
  });

  it('does not advance leads without document evidence', async () => {
    const service = setup({ recce: 0, proposal: 0 }, [LeadStage.CAPTURE]);
    await service.syncProjectStage('project', actor);
    expect(service.moveStage).not.toHaveBeenCalled();
  });

  it.each([
    [{ brief: 1 }, LeadStage.QUAL],
    [{ recce: 1, brief: 1 }, LeadStage.DISC],
    [{ proposal: 1 }, LeadStage.PROP],
    [{ proposal: 1, negotiation: 1 }, LeadStage.NEGO],
    [{ contract: 1 }, LeadStage.CONTRACT],
    [{ contract: 1, handoff: 1 }, LeadStage.HANDOFF],
  ])('uses the furthest evidenced stage for %j', async (evidence, expected) => {
    const service = setup(evidence, [
      LeadStage.CAPTURE,
      LeadStage.NURTURE,
      LeadStage.LOST,
      LeadStage.HANDOFF,
    ]);
    await service.syncProjectStage('project', actor);
    expect(service.moveStage).toHaveBeenCalledTimes(1);
    expect(service.moveStage).toHaveBeenCalledWith(actor, '0', expected);
  });

  it('does not mark a published plan as won without an approved contract', async () => {
    const service = setup({ handoff: 1, contract: 0 }, [LeadStage.CAPTURE]);
    await service.syncProjectStage('project', actor);
    expect(service.moveStage).not.toHaveBeenCalled();
  });

  it('advances signed contracts to handoff and handles string SQL flags', async () => {
    const service = setup({ contract: '1', handoff: '1' }, [
      LeadStage.CONTRACT,
    ]);
    await service.syncProjectStage('project', actor);
    expect(service.moveStage).toHaveBeenCalledWith(
      actor,
      '0',
      LeadStage.HANDOFF,
    );
    const empty = setup({ recce: '0', proposal: '0' }, [LeadStage.CAPTURE]);
    await empty.syncProjectStage('project', actor);
    expect(empty.moveStage).not.toHaveBeenCalled();
  });

  it('binds every evidence query to the linked project', async () => {
    const service = setup({}, []);
    await service.syncProjectStage('project', actor);
    const [sql, params] = (service as any).select.mock.calls[0];
    expect(params).toHaveLength((sql.match(/\?/g) || []).length);
    expect(params.every((id: string) => id === 'project')).toBe(true);
  });

  it('mirrors the discovery stage as Site Visit in Bigin', () => {
    const service = setup({ recce: 1, proposal: 0 }, []);
    expect((service as any).biginPayload({ stage: LeadStage.DISC }).Stage).toBe(
      'Site Visit',
    );
  });

  it('reconciles existing project documents before querying filtered board results', async () => {
    const findAll = jest
      .fn()
      .mockResolvedValueOnce([{ projectId: 'existing-project' }])
      .mockResolvedValueOnce([]);
    const service = new LeadsService(
      {} as any,
      {} as any,
      { findAll } as any,
      {} as any,
      {} as any,
      {} as any,
    );
    const sync = jest
      .spyOn(service, 'syncProjectStage')
      .mockImplementation(async () => {
        expect(findAll).toHaveBeenCalledTimes(1);
      });
    jest.spyOn(service as any, 'hydrate').mockResolvedValue([]);
    await (service as any).listDeals({ stage: LeadStage.DISC });
    expect(sync).toHaveBeenCalledWith('existing-project', {
      id: '',
      name: 'Project documents',
    });
    expect(findAll).toHaveBeenCalledTimes(2);
  });

  it('waits for document transactions to commit before updating leads', async () => {
    const hooks: Record<string, Function> = {};
    const models = Object.fromEntries(
      [
        'SiteRecce',
        'BusinessProposal',
        'BudgetEstimate',
        'ProjectBrief',
        'ScopeOfWork',
        'PlanOfAction',
        'Document',
        'Lead',
      ].map((name) => [
        name,
        {
          addHook: (_event: string, _name: string, callback: Function) => {
            hooks[name] = callback;
          },
        },
      ]),
    );
    const service = new LeadsService(
      {} as any,
      {} as any,
      { sequelize: { models } } as any,
      {} as any,
      {} as any,
      {} as any,
    );
    const sync = jest.spyOn(service, 'syncProjectStage').mockResolvedValue();
    const transaction = { afterCommit: jest.fn() };
    service.onModuleInit();
    expect(Object.keys(hooks).sort()).toEqual(Object.keys(models).sort());
    await hooks.SiteRecce(
      { project_id: 'project', created_by: 'user' },
      { transaction },
    );
    expect(sync).not.toHaveBeenCalled();
    await transaction.afterCommit.mock.calls[0][0]();
    expect(sync).toHaveBeenCalledWith('project', {
      id: 'user',
      name: 'Project documents',
    });
  });
});
