import { ProjectsService } from './projects.service';
import { TeamMember } from '../users/models/team-member.model';

function member(name: string, label: string, projectLabel?: string) {
  return {
    role_label: projectLabel,
    user: { name, role_label: label, is_active: true },
  } as TeamMember;
}

describe('project document people', () => {
  const findAll = jest.fn();
  const service = new ProjectsService(null!, null!, null!, null!, null!, {
    findAll,
  } as any);
  const getTeam = jest.spyOn(service, 'getTeam');

  beforeEach(() => jest.resetAllMocks());

  it('uses an organization principal outside the project and a labeled project lead', async () => {
    getTeam.mockResolvedValue([member('Asha', ' project  LEAD ')]);
    findAll.mockResolvedValue([{ name: 'Ravi' }]);

    await expect(service.getDocumentPeople('project')).resolves.toEqual({
      architect: 'Ravi',
      lead: 'Asha',
    });
  });

  it('prefers explicit project assignments over user labels', async () => {
    getTeam.mockResolvedValue([
      member('Ravi', 'Principal Architect'),
      member('Asha', '', 'Principal Architect'),
      member('Leena', '', 'Project Lead'),
    ]);

    await expect(service.getDocumentPeople('project')).resolves.toEqual({
      architect: 'Asha',
      lead: 'Leena',
    });
    expect(findAll).not.toHaveBeenCalled();
  });

  it('skips inactive team members and leaves ambiguous organization defaults unset', async () => {
    const inactive = member('Ravi', 'Principal Architect');
    inactive.user.is_active = false;
    getTeam.mockResolvedValue([inactive]);
    findAll.mockResolvedValue([{ name: 'Asha' }, { name: 'Leena' }]);

    await expect(service.getDocumentPeople('project')).resolves.toEqual({
      architect: '',
      lead: '',
    });
  });
});
