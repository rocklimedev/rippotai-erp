import { ForbiddenException } from '@nestjs/common';
import { RolePermissionsService } from './role-permissions.service';
import { RolesService } from './roles.service';
import packages from './permission-packages.json';
import { RolePermissionsCache } from './role-permissions-cache';

describe('Permission delegation boundaries', () => {
  const actor = {
    id: 'operator',
    email: 'ops@example.com',
    roleName: 'STAFF',
    permissions: [
      'role-permissions:grant',
      'role-permissions:assign',
      'role-permissions:revoke',
      'users:read',
    ],
  };
  let grants: any;
  let roles: any;
  let permissions: any;
  let activity: any;
  let service: RolePermissionsService;
  let cache: RolePermissionsCache;
  const transaction = {};
  const database = { transaction: (callback: any) => callback(transaction) };
  beforeEach(() => {
    grants = {
      create: jest.fn().mockResolvedValue({}),
      bulkCreate: jest.fn().mockResolvedValue([]),
      destroy: jest.fn(),
      findOne: jest.fn().mockResolvedValue({ destroy: jest.fn() }),
    };
    roles = {
      findByPk: jest.fn().mockResolvedValue({ id: 'staff', name: 'STAFF' }),
    };
    permissions = {
      findAll: jest
        .fn()
        .mockResolvedValue([{ id: 'read', resource: 'users', action: 'read' }]),
    };
    activity = { create: jest.fn() };
    cache = new RolePermissionsCache();
    cache.set('staff', ['cached:permission'], cache.generation);
    service = new RolePermissionsService(
      grants,
      roles,
      permissions,
      database as any,
      activity,
      cache,
    );
  });

  const operations = [
    (s: RolePermissionsService, a?: any) =>
      s.grant(
        { role_id: 'staff', permission_id: 'read', granted_by: 'spoofed' },
        a,
      ),
    (s: RolePermissionsService, a?: any) =>
      s.bulkAssign(
        { role_id: 'staff', permission_ids: ['read'], granted_by: 'spoofed' },
        a,
      ),
    (s: RolePermissionsService, a?: any) => s.setForRole('staff', ['read'], a),
  ];

  it.each(operations)(
    'requires an actor for all grant paths',
    async (operation) => {
      await expect(operation(service)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(grants.create).not.toHaveBeenCalled();
      expect(grants.bulkCreate).not.toHaveBeenCalled();
      expect(grants.destroy).not.toHaveBeenCalled();
    },
  );

  it.each(operations)(
    'rejects permissions not held before any writes',
    async (operation) => {
      permissions.findAll.mockResolvedValue([
        { id: 'read', resource: 'users', action: 'update' },
      ]);
      await expect(operation(service, actor)).rejects.toThrow(
        'Cannot grant permissions you do not hold',
      );
      expect(grants.create).not.toHaveBeenCalled();
      expect(grants.bulkCreate).not.toHaveBeenCalled();
      expect(grants.destroy).not.toHaveBeenCalled();
    },
  );

  it.each(operations)(
    'accepts held permissions with actor attribution and a transactional audit',
    async (operation) => {
      await operation(service, actor);
      const written =
        grants.create.mock.calls[0]?.[0] ??
        grants.bulkCreate.mock.calls[0]?.[0][0];
      expect(written.granted_by).toBe(actor.id);
      expect(cache.get('staff')).toBeUndefined();
      expect(activity.create).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: actor.id, entity_type: 'Role' }),
        { transaction },
      );
    },
  );

  it.each(['ADMIN', 'SUPERADMIN'])(
    'protects %s roles on grants and revocations',
    async (name) => {
      roles.findByPk.mockResolvedValue({ name });
      await expect(
        service.grant({ role_id: 'protected', permission_id: 'read' }, actor),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        service.revoke('protected', 'read', actor),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(grants.create).not.toHaveBeenCalled();
      expect(grants.findOne).not.toHaveBeenCalled();
    },
  );

  it('requires SUPERADMIN to hold the permissions being delegated too', async () => {
    permissions.findAll.mockResolvedValue([
      { id: 'write', resource: 'users', action: 'update' },
    ]);
    await expect(
      service.grant(
        { role_id: 'staff', permission_id: 'write' },
        { ...actor, roleName: 'SUPERADMIN' },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('checks every package permission before writing any grants', async () => {
    permissions.findAll.mockResolvedValue(
      packages[0].permissions.map((key, i) => {
        const [resource, action] = key.split(':');
        return { id: String(i), resource, action };
      }),
    );
    await expect(
      service.applyPackage('staff', packages[0].id, actor),
    ).rejects.toThrow('Cannot grant permissions you do not hold');
    expect(grants.bulkCreate).not.toHaveBeenCalled();
  });

  it('rejects unknown permission IDs before replacing existing grants', async () => {
    permissions.findAll.mockResolvedValue([]);
    await expect(
      service.setForRole('staff', ['missing'], actor),
    ).rejects.toThrow('Permission not found');
    expect(grants.destroy).not.toHaveBeenCalled();
  });

  it('cannot rename an ordinary role to an administrator role', async () => {
    const roleService = new RolesService(roles, {} as any, database as any);
    await expect(
      roleService.update(
        'staff',
        { name: 'SUPERADMIN' },
        { ...actor, permissions: ['rbac:update'] },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('keeps cached grants until commit completes, then invalidates', async () => {
    const databaseWithCommit = {
      transaction: async (write: any) => {
        const result = await write(transaction);
        expect(cache.get('staff')).toEqual(['cached:permission']);
        return result;
      },
    };
    const writer = new RolePermissionsService(
      grants,
      roles,
      permissions,
      databaseWithCommit as any,
      activity,
      cache,
    );
    await writer.grant({ role_id: 'staff', permission_id: 'read' }, actor);
    expect(cache.get('staff')).toBeUndefined();
  });

  it('does not invalidate when the grant transaction rolls back', async () => {
    activity.create.mockRejectedValue(new Error('audit unavailable'));
    await expect(
      service.grant({ role_id: 'staff', permission_id: 'read' }, actor),
    ).rejects.toThrow('audit unavailable');
    expect(cache.get('staff')).toEqual(['cached:permission']);
  });

  it('invalidates cached grants after revocation or replacement with an empty set', async () => {
    await service.revoke('staff', 'read', actor);
    expect(cache.get('staff')).toBeUndefined();
    cache.set('staff', ['users:read'], cache.generation);
    await service.setForRole('staff', [], actor);
    expect(cache.get('staff')).toBeUndefined();
  });
});
