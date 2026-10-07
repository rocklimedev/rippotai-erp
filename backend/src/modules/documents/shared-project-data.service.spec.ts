import { SharedProjectDataService } from './shared-project-data.service';

function row(values: Record<string, unknown>) {
  return {
    get: (key: string | object) => typeof key === 'string' ? values[key] : { ...values },
    set: jest.fn((patch) => Object.assign(values, patch)),
  };
}

function model(name: string, records: ReturnType<typeof row>[]) {
  const hooks: Record<string, Function> = {};
  return {
    name, hooks,
    rawAttributes: { projectId: {}, createdAt: {}, status: {}, siteAddress: {} },
    findAll: jest.fn(async (options) => records.filter(record => record.get('projectId') === options.where.projectId)),
    update: jest.fn(async () => [1]),
    addHook: (event: string, _name: string, callback: Function) => { hooks[event] = callback; },
  };
}

describe('SharedProjectDataService', () => {
  it('prefers the previous document over master data and never reads future documents', async () => {
    const brief = model('ProjectBrief', [row({ id: 'brief-a', projectId: 'a', siteAddress: 'Brief address' })]);
    const recce = model('SiteRecce', []);
    recce.rawAttributes = { project_id: {}, updated_at: {} } as any;
    recce.findAll.mockResolvedValue([row({ id: 'recce-a', project_id: 'a', site_address: 'Recce address', lift_available: false })]);
    const future = model('BudgetEstimate', [row({ projectId: 'a', location: 'Future address' })]);
    const project = { associations: {}, findByPk: jest.fn(async () => row({ site_location: 'Master address', name: 'Project A' })) };
    const service = new SharedProjectDataService({ models: { ProjectBrief: brief, SiteRecce: recce, BudgetEstimate: future, Project: project } } as any);
    const transaction = {};
    const context = await service.prefill('a', 'scope-of-work', transaction as any);
    expect(context.shared.siteAddress).toBe('Recce address');
    expect(context.shared.liftAvailable).toBe(false);
    expect(context.shared.projectName).toBe('Project A');
    expect(context.sources.siteAddress).toEqual({ sequence: 'site-recce', id: 'recce-a' });
    expect(future.findAll).not.toHaveBeenCalled();
    expect(recce.findAll).toHaveBeenCalledWith(expect.objectContaining({ where: { project_id: 'a' }, transaction }));
  });
  it('uses earlier steps for missing fields and skips cancelled source documents', async () => {
    const brief = model('ProjectBrief', [row({ id: 'brief-a', projectId: 'a', siteAddress: 'Brief address' })]);
    const recce = model('SiteRecce', []);
    recce.rawAttributes = { project_id: {}, updated_at: {} } as any;
    recce.findAll.mockResolvedValue([row({ id: 'cancelled', status: 'CANCELLED', site_address: 'Wrong address' }), row({ id: 'recce-a', site_address: null })]);
    const service = new SharedProjectDataService({ models: { ProjectBrief: brief, SiteRecce: recce } } as any);
    const context = await service.prefill('a', 'scope-of-work');
    expect(context.shared.siteAddress).toBe('Brief address');
    expect(context.documents['site-recce'].id).toBe('recce-a');
    await expect(service.prefill('a', 'unknown')).rejects.toThrow('Unknown document sequence');
  });
  it('fetches values only from the requested project', async () => {
    const brief = model('ProjectBrief', [row({ projectId: 'a', siteAddress: 'Site A' }), row({ projectId: 'b', siteAddress: 'Site B' })]);
    const service = new SharedProjectDataService({ models: { ProjectBrief: brief } } as any);
    expect(await service.fetch('a')).toEqual({ siteAddress: 'Site A' });
  });

  it('fills a new document in the caller transaction and persists added fields', async () => {
    const brief = model('ProjectBrief', [row({ projectId: 'a', siteAddress: 'Site A', liftAvailable: false })]);
    const service = new SharedProjectDataService({ models: { ProjectBrief: brief } } as any);
    service.onModuleInit();
    const draft = row({ projectId: 'a', status: 'draft', siteAddress: '' });
    const transaction = {};
    const options = { transaction, fields: ['projectId'] };
    await brief.hooks.beforeValidate(draft, options);
    expect(draft.get('siteAddress')).toBe('Site A');
    expect(draft.get('liftAvailable')).toBe(false);
    expect(options.fields).toContain('siteAddress');
    expect(brief.findAll).toHaveBeenCalledWith(expect.objectContaining({ transaction }));
  });

  it('backfills draft blanks while protecting manual values and approved versions', async () => {
    const source = row({ id: 'source', projectId: 'a', status: 'draft', siteAddress: 'Site A' });
    const brief = model('ProjectBrief', [source,
      row({ id: 'blank', projectId: 'a', status: 'draft', siteAddress: null }),
      row({ id: 'manual', projectId: 'a', status: 'draft', siteAddress: 'Custom' }),
      row({ id: 'approved', projectId: 'a', status: 'approved', siteAddress: null }),
      row({ id: 'other-project', projectId: 'b', status: 'draft', siteAddress: null }),
    ]);
    const service = new SharedProjectDataService({ models: { ProjectBrief: brief } } as any);
    service.onModuleInit();
    const transaction = {};
    await brief.hooks.afterSave(source, { transaction });
    expect(brief.update).toHaveBeenCalledTimes(1);
    expect(brief.update).toHaveBeenCalledWith({ siteAddress: 'Site A' }, {
      where: { id: 'blank', siteAddress: null, status: 'draft' }, transaction, hooks: false,
    });
  });
});
