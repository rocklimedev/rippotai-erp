import { AccessMatrixService } from './access-matrix.service';

describe('independent launcher access', () => {
  const actor = {
    id: 'admin',
    roleName: 'SUPERADMIN',
    permissions: ['role-apps:update', 'role-permissions:assign', 'projects:read'],
  };

  function setup() {
    const transaction = { LOCK: { UPDATE: 'UPDATE' } };
    const roles = { findByPk: jest.fn().mockResolvedValue({ name: 'STAFF' }) };
    const permissions = {
      findAll: jest.fn().mockResolvedValue([{ id: 'p', resource: 'projects', action: 'read' }]),
    };
    const grants = { bulkCreate: jest.fn(), findAll: jest.fn().mockResolvedValue([]) };
    const launcher = { findOrCreate: jest.fn(), destroy: jest.fn() };
    const apps = { findOrCreate: jest.fn() };
    const activity = { create: jest.fn() };
    const sequelize = { transaction: (fn: (value: typeof transaction) => unknown) => fn(transaction) };
    const cache = { invalidate: jest.fn() };
    const service = new AccessMatrixService(
      roles as any, permissions as any, grants as any, launcher as any,
      apps as any, activity as any, sequelize as any, cache as any,
    );
    return { service, grants, launcher };
  }

  it.each([true, false])('updates the Projects tile to %s without touching module grants', async (enabled) => {
    const { service, grants, launcher } = setup();
    await expect(service.setLauncherApp('staff', 'projects', enabled, actor))
      .resolves.toEqual({ on_launcher: enabled });
    expect(grants.findAll).not.toHaveBeenCalled();
    expect(grants.bulkCreate).not.toHaveBeenCalled();
    expect(enabled ? launcher.findOrCreate : launcher.destroy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { role_id: 'staff', app_code: 'projects' } }),
    );
  });

  it('grants Projects module access without changing the launcher', async () => {
    const { service, grants, launcher } = setup();
    jest.spyOn(service, 'getForRole').mockResolvedValue({} as any);
    await service.setForRole('staff', { apps: { projects: 'view' } }, actor);
    expect(grants.bulkCreate).toHaveBeenCalledWith(
      [{ role_id: 'staff', permission_id: 'p', granted_by: 'admin' }],
      expect.anything(),
    );
    expect(launcher.findOrCreate).not.toHaveBeenCalled();
    expect(launcher.destroy).not.toHaveBeenCalled();
  });
});
