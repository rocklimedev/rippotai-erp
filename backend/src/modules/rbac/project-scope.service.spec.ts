import { ProjectScopeService } from './project-scope.service';

describe('project ownership resolution', () => {
  const record = (data: any) => ({ get: (key: any) => typeof key === 'string' ? data[key] : data });
  let scope: ProjectScopeService;
  beforeEach(() => {
    const model = (table: string, rows: any) => ({
      getTableName: () => table, rawAttributes: {},
      findByPk: jest.fn(async id => rows[id] ? record(rows[id]) : null),
    });
    scope = new ProjectScopeService({ models: {
      projects: model('projects', { a: { id: 'a' }, b: { id: 'b' } }),
      boqs: model('boqs', { boq: { id: 'boq', project_id: 'b' } }),
      quotations: model('quotations', { quote: { id: 'quote', projectId: 'a' } }),
      members: model('team_members', { member: { owner_type: 'BOQ', owner_id: 'boq' } }),
    } } as any);
  });
  it('resolves camelCase project fields from stored rows', async () => {
    expect(await scope.fromRecord('quotations', 'quote')).toEqual(['a']);
  });
  it('resolves polymorphic team ownership through BOQ', async () => {
    expect(await scope.fromRecord('team_members', 'member')).toEqual(['b']);
  });
  it('does not replace record ownership with a forged query parameter', async () => {
    expect(await scope.resolve('boqs', { params: { id: 'boq' }, query: { project_id: 'a' } })).toEqual(['b', 'a']);
  });
  it('checks all bulk source records', async () => {
    expect(await scope.resolve('boqs', { params: {}, body: { quotation_ids: ['quote'], boq_ids: ['boq'] } })).toEqual(['b', 'a']);
  });
  it('fails closed on missing records', async () => {
    await expect(scope.fromRecord('boqs', 'missing')).rejects.toThrow('Referenced record not found');
  });
});
