import { validateAssignment } from './team-assignment';
import { User } from './models/user.model';
import { Role } from '../rbac/models/role.model';

describe('team role assignment', () => {
  beforeEach(() => {
    jest.spyOn(User, 'findByPk').mockResolvedValue({ is_active: true } as any);
    jest.spyOn(Role, 'findOne').mockResolvedValue({ name: 'Designer' } as any);
  });
  afterEach(() => jest.restoreAllMocks());
  it('validates a project role independently of internal memberships', async () => {
    expect(await validateAssignment('user', ' Designer ', 'PROJECT')).toBe('Designer');
    expect(Role.findOne).toHaveBeenCalledWith({ where: { name: 'Designer', scope: 'PROJECT' }, transaction: undefined });
  });
  it('rejects an internal label with no matching project role', async () => {
    (Role.findOne as jest.Mock).mockResolvedValue(null);
    await expect(validateAssignment('user', 'Admin', 'PROJECT')).rejects.toThrow('Unknown project role');
  });
  it('rejects disabled users', async () => {
    (User.findByPk as jest.Mock).mockResolvedValue({ is_active: false });
    await expect(validateAssignment('user', 'Designer', 'PROJECT')).rejects.toThrow('active users');
  });
  it('rejects missing labels', async () => {
    await expect(validateAssignment('user', ' ', 'PROJECT')).rejects.toThrow('valid role label');
  });
});
