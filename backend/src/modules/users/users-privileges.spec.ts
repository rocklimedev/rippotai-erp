import { UsersService } from './users.service';
import { ForbiddenException } from '@nestjs/common';
import { RolePermissionsCache } from '../rbac/role-permissions-cache';

jest.mock('@/modules/cdn/cdn.service', () => ({ CdnService: class {} }));
jest.mock('@/common/mail/mail.service', () => ({ MailService: class {} }));
jest.mock('@/common/security/password-policy', () => ({
  assertNewPassword: jest.fn(),
}));
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('new-secret-hash'),
}));

describe('User privilege boundaries', () => {
  const hr = {
    id: 'hr',
    email: 'hr@example.com',
    roleName: 'STAFF',
    permissions: ['users:update', 'users:create', 'users:delete'],
  };
  const superadmin = { ...hr, id: 'super', roleName: 'SUPERADMIN' };
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  let user: any;
  let users: any;
  let roles: any;
  let sessions: any;
  let audit: any;
  let service: UsersService;
  let cache: RolePermissionsCache;

  beforeEach(() => {
    user = {
      id: 'target',
      role_id: 'staff',
      role: { name: 'STAFF' },
      is_active: true,
      name: 'Target',
      email: 'target@example.com',
    };
    user.update = jest.fn(async (patch) =>
      Object.assign(
        user,
        Object.fromEntries(
          Object.entries(patch).filter(([, v]) => v !== undefined),
        ),
      ),
    );
    user.destroy = jest.fn();
    users = {
      findByPk: jest.fn(async () => user),
      create: jest.fn(),
      sequelize: {
        transaction: jest.fn(async (callback) => {
          const before = { ...user };
          try {
            return await callback(transaction);
          } catch (error) {
            Object.assign(user, before);
            throw error;
          }
        }),
      },
    };
    roles = {
      findByPk: jest.fn(async (id) => ({ id, name: id.toUpperCase() })),
    };
    sessions = { update: jest.fn() };
    audit = { create: jest.fn() };
    cache = new RolePermissionsCache();
    cache.set('staff', ['users:read'], cache.generation);
    cache.set('other', ['documents:read'], cache.generation);
    service = new UsersService(
      users,
      roles,
      {} as any,
      {} as any,
      { notifyUserUpdated: jest.fn() } as any,
      {} as any,
      sessions,
      audit,
      cache,
    );
  });

  it('rejects missing actors before loading a target', async () => {
    await expect(
      service.update(user.id, { name: 'Changed' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(users.findByPk).not.toHaveBeenCalled();
  });

  it.each(['ADMIN', 'SUPERADMIN'])(
    'rejects changes to %s accounts by non-superadmins',
    async (name) => {
      user.role = { name };
      user.role_id = name.toLowerCase();
      for (const dto of [
        { name: 'Changed' },
        { password: 'password' },
        { is_active: true },
        { role_id: 'staff' },
      ]) {
        await expect(service.update(user.id, dto, hr)).rejects.toBeInstanceOf(
          ForbiddenException,
        );
      }
      await expect(service.deactivate(user.id, hr)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      await expect(service.remove(user.id, hr)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(user.update).not.toHaveBeenCalled();
      expect(user.destroy).not.toHaveBeenCalled();
    },
  );

  it.each(['admin', 'superadmin'])(
    'rejects assigning the %s role',
    async (role_id) => {
      await expect(
        service.update(user.id, { role_id }, hr),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        service.create(
          {
            name: 'New',
            email: 'new@example.com',
            password: 'password',
            role_id,
          },
          { ...hr, roleName: 'ADMIN' },
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(user.update).not.toHaveBeenCalled();
      expect(users.create).not.toHaveBeenCalled();
    },
  );

  it.each([hr, superadmin])(
    'rejects changing own role even as $roleName',
    async (actor) => {
      user.id = actor.id;
      await expect(
        service.update(user.id, { role_id: 'other' }, actor),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        service.update(user.id, { role_id: null } as any, actor),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(user.update).not.toHaveBeenCalled();
    },
  );

  it('uses the database identity to reject self-promotion through an alternate ID spelling', async () => {
    user.id = hr.id;
    await expect(
      service.update('HR', { role_id: 'other' }, hr),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(user.update).not.toHaveBeenCalled();
  });

  it.each([
    { password: 'new password' },
    { role_id: 'other' },
    { is_active: false },
  ])('revokes sessions and records security changes for %j', async (dto) => {
    await service.update(user.id, dto, hr);
    expect(sessions.update).toHaveBeenCalledWith(
      { revoked_at: expect.any(Date) },
      { where: { user_id: user.id, revoked_at: null }, transaction },
    );
    expect(audit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: hr.id,
        changes: expect.objectContaining({ sessions_revoked: true }),
      }),
      { transaction },
    );
    expect(JSON.stringify(audit.create.mock.calls)).not.toContain(
      'new-secret-hash',
    );
    expect(JSON.stringify(audit.create.mock.calls)).not.toContain(
      'new password',
    );
  });

  it('allows SUPERADMIN to modify a protected user and revoke their sessions', async () => {
    user.role = { name: 'ADMIN' };
    user.role_id = 'admin';
    await service.update(user.id, { role_id: 'superadmin' }, superadmin);
    expect(user.role_id).toBe('superadmin');
    expect(sessions.update).toHaveBeenCalled();
  });

  it('does not revoke sessions for unchanged security fields or profile edits', async () => {
    await service.update(
      user.id,
      { name: 'New', role_id: user.role_id, is_active: true },
      hr,
    );
    expect(sessions.update).not.toHaveBeenCalled();
  });

  it('invalidates both role caches after a committed role reassignment', async () => {
    await service.update(user.id, { role_id: 'other' }, hr);
    expect(cache.get('staff')).toBeUndefined();
    expect(cache.get('other')).toBeUndefined();
  });

  it('rolls back a security change when session revocation fails', async () => {
    sessions.update.mockRejectedValue(new Error('session storage unavailable'));
    await expect(
      service.update(user.id, { is_active: false }, hr),
    ).rejects.toThrow('session storage unavailable');
    expect(user.is_active).toBe(true);
  });

  it('rolls back a security change when audit storage fails', async () => {
    audit.create.mockRejectedValue(new Error('audit unavailable'));
    await expect(
      service.update(user.id, { role_id: 'other' }, hr),
    ).rejects.toThrow('audit unavailable');
    expect(user.role_id).toBe('staff');
    expect(cache.get('staff')).toEqual(['users:read']);
  });

  it('rechecks a concurrently promoted target inside the transaction', async () => {
    users.findByPk
      .mockResolvedValueOnce({ ...user })
      .mockImplementation(async () => ({ ...user, role_id: 'admin' }));
    await expect(
      service.update(user.id, { password: 'new password' }, hr),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(user.update).not.toHaveBeenCalled();
  });
});
