import { LeadsService } from './leads.service';
import { LeadStage } from '@/common/enums/leads.enums';

describe('Lead document stage updates', () => {
  const actor = { id: 'user', name: 'User' };

  function setup(evidence: { recce: number; proposal: number }, stages: LeadStage[]) {
    const leads = stages.map((stage, index) => ({ id: String(index), stage }));
    const model = { findAll: jest.fn().mockResolvedValue(leads) };
    const service = new LeadsService({} as any, {} as any, model as any, {} as any, {} as any, {} as any);
    jest.spyOn(service as any, 'select').mockResolvedValue([evidence]);
    jest.spyOn(service, 'moveStage').mockResolvedValue({} as any);
    return service;
  }

  it('advances early leads after recce without regressing later or closed stages', async () => {
    const service = setup({ recce: 1, proposal: 0 }, [LeadStage.CAPTURE, LeadStage.QUAL, LeadStage.PROP, LeadStage.LOST, LeadStage.CONTRACT]);
    await service.syncProjectStage('project', actor);
    expect(service.moveStage).toHaveBeenCalledTimes(2);
    expect(service.moveStage).toHaveBeenCalledWith(actor, '0', LeadStage.DISC);
    expect(service.moveStage).toHaveBeenCalledWith(actor, '1', LeadStage.DISC);
  });

  it('moves to proposal when saved and uploaded proposal evidence exists', async () => {
    const service = setup({ recce: 1, proposal: 1 }, [LeadStage.DISC, LeadStage.NEGO]);
    await service.syncProjectStage('project', actor);
    expect(service.moveStage).toHaveBeenCalledTimes(1);
    expect(service.moveStage).toHaveBeenCalledWith(actor, '0', LeadStage.PROP);
  });

  it('does not advance leads without document evidence', async () => {
    const service = setup({ recce: 0, proposal: 0 }, [LeadStage.CAPTURE]);
    await service.syncProjectStage('project', actor);
    expect(service.moveStage).not.toHaveBeenCalled();
  });

  it('mirrors the discovery stage as Site Visit in Bigin', () => {
    const service = setup({ recce: 1, proposal: 0 }, []);
    expect((service as any).biginPayload({ stage: LeadStage.DISC }).Stage).toBe('Site Visit');
  });

  it('waits for document transactions to commit before updating leads', async () => {
    const hooks: Record<string, Function> = {};
    const models = Object.fromEntries(['SiteRecce', 'BusinessProposal', 'Document', 'Lead'].map((name) => [name, {
      addHook: (_event: string, _name: string, callback: Function) => { hooks[name] = callback; },
    }]));
    const service = new LeadsService({} as any, {} as any, { sequelize: { models } } as any, {} as any, {} as any, {} as any);
    const sync = jest.spyOn(service, 'syncProjectStage').mockResolvedValue();
    const transaction = { afterCommit: jest.fn() };
    service.onModuleInit();
    await hooks.SiteRecce({ project_id: 'project', created_by: 'user' }, { transaction });
    expect(sync).not.toHaveBeenCalled();
    await transaction.afterCommit.mock.calls[0][0]();
    expect(sync).toHaveBeenCalledWith('project', { id: 'user', name: 'Project documents' });
  });
});
