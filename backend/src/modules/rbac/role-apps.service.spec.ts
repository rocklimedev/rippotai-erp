import { RoleAppsService } from './role-apps.service';

describe('saving current launcher app access', () => {
  const setup = () => {
    const transaction = { id: 'transaction' };
    const grants = {
      sequelize: { transaction: jest.fn((run) => run(transaction)) },
      destroy: jest.fn().mockResolvedValue(0),
      bulkCreate: jest.fn().mockResolvedValue([]),
    };
    const apps = { bulkCreate: jest.fn().mockResolvedValue([]) };
    const service = new RoleAppsService(grants as any, {} as any, apps as any);
    return { service, grants, apps, transaction };
  };

  it('registers new launcher codes before saving grants and preserves legacy grants', async () => {
    const { service, grants, apps, transaction } = setup();
    await service.setForRole('role', ['design', 'build', 'crm'], 'admin');
    expect(apps.bulkCreate).toHaveBeenCalledWith([
      { code: 'design', name: 'Design', is_active: true },
      { code: 'build', name: 'Build', is_active: true },
    ], { ignoreDuplicates: true, transaction });
    expect(apps.bulkCreate.mock.invocationCallOrder[0]).toBeLessThan(grants.destroy.mock.invocationCallOrder[0]);
    expect(grants.bulkCreate).toHaveBeenCalledWith([
      { role_id: 'role', app_code: 'design', granted_by: 'admin' },
      { role_id: 'role', app_code: 'build', granted_by: 'admin' },
      { role_id: 'role', app_code: 'crm', granted_by: 'admin' },
    ], { transaction });
  });

  it('can clear all access without registering or inserting apps', async () => {
    const { service, grants, apps, transaction } = setup();
    expect(await service.setForRole('role', [])).toEqual([]);
    expect(apps.bulkCreate).not.toHaveBeenCalled();
    expect(grants.destroy).toHaveBeenCalledWith({ where: { role_id: 'role' }, transaction });
    expect(grants.bulkCreate).not.toHaveBeenCalled();
  });
});
