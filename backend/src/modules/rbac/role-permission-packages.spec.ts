import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RolePermissionsService } from './role-permissions.service';
import packages from './permission-packages.json';
import catalogue from '../../common/security/route-catalogue.json';

describe('permission packages', () => {
  it('uses unique package IDs and explicit registered capabilities', () => {
    const registered = new Set(catalogue.filter((r) => !r.public).map((r) => r.permission));
    expect(new Set(packages.map((p) => p.id)).size).toBe(packages.length);
    for (const p of packages) {
      expect(new Set(p.permissions).size).toBe(p.permissions.length);
      for (const permission of p.permissions) expect(registered.has(permission)).toBe(true);
    }
  });
  const transaction = {};
  let grants: any;
  let roles: any;
  let permissions: any;
  let service: RolePermissionsService;

  beforeEach(() => {
    grants = { bulkCreate: jest.fn().mockResolvedValue([]) };
    roles = { findByPk: jest.fn().mockResolvedValue({ id: 'any-role' }) };
    permissions = { findAll: jest.fn().mockResolvedValue(packages[0].permissions.map((key, i) => {
      const [resource, action] = key.split(':');
      return { id: `permission-${i}`, resource, action };
    })) };
    service = new RolePermissionsService(grants, roles, permissions, {
      transaction: (fn: any) => fn(transaction),
    } as any);
  });

  it('applies a package to an arbitrary role with additive, duplicate-safe grants', async () => {
    await service.applyPackage('any-role', packages[0].id);
    expect(grants.bulkCreate).toHaveBeenCalledWith(
      expect.arrayContaining([{ role_id: 'any-role', permission_id: 'permission-0', granted_by: null }]),
      { transaction, ignoreDuplicates: true },
    );
    expect(grants.bulkCreate.mock.calls[0][0]).toHaveLength(packages[0].permissions.length);
  });

  it('rejects an incomplete catalogue before writing grants', async () => {
    permissions.findAll.mockResolvedValue([]);
    await expect(service.applyPackage('any-role', packages[0].id)).rejects.toBeInstanceOf(BadRequestException);
    expect(grants.bulkCreate).not.toHaveBeenCalled();
  });

  it('rejects unknown packages and missing roles', async () => {
    await expect(service.applyPackage('any-role', 'unknown')).rejects.toBeInstanceOf(NotFoundException);
    roles.findByPk.mockResolvedValue(null);
    await expect(service.applyPackage('unknown-role', packages[0].id)).rejects.toBeInstanceOf(NotFoundException);
    expect(grants.bulkCreate).not.toHaveBeenCalled();
  });
});
