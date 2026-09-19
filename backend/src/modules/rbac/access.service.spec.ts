import { AccessService } from './access.service';
import { Role } from './models/role.model';
import { RolePermission } from './models/role_permission.model';
import { RoleApp } from './models/role-app.model';
import { AccessRuleModel } from './models/access-rule.model';
import { TeamMember } from '../users/models/team-member.model';

describe('scoped permissions', () => {
  const service = new AccessService();
  const user = { id: 'user', roleId: 'internal-admin', roleName: 'ADMIN' };
  beforeEach(() => {
    jest.spyOn(TeamMember, 'findAll').mockResolvedValue([{ role_label: 'Designer' }] as any);
    jest.spyOn(Role, 'findAll').mockResolvedValue([{ id: 'project-designer' }] as any);
    jest.spyOn(RolePermission, 'findAll').mockResolvedValue([{ permission: { resource: 'projects', action: 'view' } }] as any);
    jest.spyOn(AccessRuleModel, 'findAll').mockResolvedValue([]);
    jest.spyOn(RoleApp, 'findAll').mockResolvedValue([]);
  });
  afterEach(() => jest.restoreAllMocks());
  it('loads only the requested project membership and PROJECT role', async () => {
    expect(await service.check(user, 'projects', 'view', 'project-a')).toBe(true);
    expect(TeamMember.findAll).toHaveBeenCalledWith({ where: { user_id: 'user', owner_type: 'PROJECT', owner_id: 'project-a' } });
    expect(Role.findAll).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ scope: 'PROJECT' }) }));
    const query: any = (RolePermission.findAll as jest.Mock).mock.calls[0][0];
    expect(Object.values(query.where.role_id)[0]).toBeUndefined();
    expect(Object.getOwnPropertySymbols(query.where.role_id).map(key => query.where.role_id[key])).toEqual([['project-designer']]);
  });
  it('does not substitute internal Admin permissions for a project grant', async () => {
    expect(await service.check(user, 'projects', 'delete', 'project-a')).toBe(false);
  });
  it('denies a different project without membership', async () => {
    (TeamMember.findAll as jest.Mock).mockResolvedValue([]);
    expect(await service.check(user, 'projects', 'view', 'project-b')).toBe(false);
    expect(RolePermission.findAll).not.toHaveBeenCalled();
  });
  it('denies unrecognized project role labels', async () => {
    (Role.findAll as jest.Mock).mockResolvedValue([]);
    expect(await service.check(user, 'projects', 'view', 'project-a')).toBe(false);
  });
  it('lets a user denial override project permissions', async () => {
    (AccessRuleModel.findAll as jest.Mock).mockResolvedValue([{ subject_type: 'USER', subject_id: 'user', effect: 'DENY', resource: 'projects', action: 'view' }]);
    expect(await service.check(user, 'projects', 'view', 'project-a')).toBe(false);
  });
  it('does not let a global user override elevate project permissions', async () => {
    (AccessRuleModel.findAll as jest.Mock).mockResolvedValue([{ subject_type: 'USER', subject_id: 'user', effect: 'ALLOW', resource: 'projects', action: '*' }]);
    expect(await service.check(user, 'projects', 'delete', 'project-a')).toBe(false);
  });
  it('allows Superadmin without inheriting a project role', async () => {
    expect(await service.check({ ...user, roleName: 'SUPERADMIN' }, 'projects', 'delete', 'project-b')).toBe(true);
    expect(TeamMember.findAll).not.toHaveBeenCalled();
  });
});
