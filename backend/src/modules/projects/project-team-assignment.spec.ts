import { ProjectsService } from './projects.service';

describe('project team assignments', () => {
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  const projects = {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    sequelize: { transaction: jest.fn() },
  };
  const assignments = {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const users = { findByPk: jest.fn() };
  const service = new ProjectsService(
    projects as any,
    assignments as any,
    { logProjectCreated: jest.fn() } as any,
    { notifyProjectCreated: jest.fn() } as any,
    null!,
    users as any,
  );
  const projectData = { name: 'Studio', site_location: 'Delhi' };

  beforeEach(() => {
    jest.resetAllMocks();
    projects.sequelize.transaction.mockImplementation((work) => work(transaction));
    projects.create.mockResolvedValue({ id: 'project' });
    projects.findByPk.mockResolvedValue({ id: 'project' });
    assignments.findAll.mockResolvedValue([]);
    users.findByPk.mockResolvedValue({ name: 'Staff member', is_active: true });
  });

  it('saves a principal and multiple leads in the project creation transaction', async () => {
    await service.create({
      ...projectData,
      team_members: [
        { user_id: 'architect', role_label: 'Principal Architect' },
        { user_id: 'lead-1', role_label: 'Project Lead', is_primary: true },
        { user_id: 'lead-2', role_label: 'Project Lead' },
      ],
    });

    expect(projects.create).toHaveBeenCalledWith(expect.anything(), { transaction });
    expect(assignments.create.mock.calls.map(([member, options]) => [
      member.user_id, member.team_id, member.role_label, options.transaction,
    ])).toEqual([
      ['architect', null, 'Principal Architect', transaction],
      ['lead-1', null, 'Project Lead', transaction],
      ['lead-2', null, 'Project Lead', transaction],
    ]);
  });

  it('rejects two principals before creating the project, regardless of case and spacing', async () => {
    await expect(service.create({
      ...projectData,
      team_members: [
        { user_id: 'architect-1', role_label: 'Principal Architect' },
        { user_id: 'architect-2', role_label: ' principal  architect ' },
      ],
    })).rejects.toThrow('only one Principal Architect');
    expect(projects.create).not.toHaveBeenCalled();
  });

  it('rejects adding or promoting a second principal on an existing project', async () => {
    assignments.findAll.mockResolvedValue([{ id: 'first', role_label: 'Principal Architect' }]);
    assignments.findOne.mockResolvedValue({ id: 'other', role_label: 'Project Lead' });

    await expect(service.addTeamMember('project', {
      user_id: 'another',
      role_label: 'Principal Architect',
    })).rejects.toThrow('only one Principal Architect');
    await expect(service.updateTeamMember('project', 'other', {
      role_label: 'Principal Architect',
    })).rejects.toThrow('only one Principal Architect');
    expect(projects.findByPk).toHaveBeenCalledWith('project', { transaction, lock: 'UPDATE' });
    expect(assignments.create).not.toHaveBeenCalled();
  });
});
