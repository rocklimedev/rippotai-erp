import {
  RolePermissionsCache,
  ROLE_PERMISSION_TTL_MS,
} from './role-permissions-cache';
import { PermissionsService } from './permissions.service';
import { RolesService } from './roles.service';

describe('Role permission cache lifecycle', () => {
  let cache: RolePermissionsCache;
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-23T06:00:00Z'));
    cache = new RolePermissionsCache();
  });
  afterEach(() => jest.useRealTimers());

  it('caches empty permission sets and expires them without sliding the TTL', () => {
    cache.set('role', [], cache.generation);
    expect(cache.get('role')).toEqual([]);
    jest.advanceTimersByTime(ROLE_PERMISSION_TTL_MS - 1);
    expect(cache.get('role')).toEqual([]);
    jest.advanceTimersByTime(1);
    expect(cache.get('role')).toBeUndefined();
  });

  it('rejects stale cache fills after invalidation', () => {
    const generation = cache.generation;
    cache.invalidate('role');
    cache.set('role', ['users:update'], generation);
    expect(cache.get('role')).toBeUndefined();
  });

  it.each(['update', 'remove'] as const)(
    'clears cached roles after permission catalogue %s',
    async (method) => {
      cache.set('role', ['users:read'], cache.generation);
      const permission = { update: jest.fn(), destroy: jest.fn() };
      const service = new PermissionsService(
        { findByPk: jest.fn().mockResolvedValue(permission) } as any,
        cache,
      );
      if (method === 'update')
        await service.update('permission', { action: 'update' });
      else await service.remove('permission');
      expect(cache.get('role')).toBeUndefined();
    },
  );

  it.each(['update', 'remove'] as const)(
    'invalidates a cached role after role %s',
    async (method) => {
      cache.set('role', ['users:read'], cache.generation);
      const role = { name: 'STAFF', update: jest.fn(), destroy: jest.fn() };
      const service = new RolesService(
        { findByPk: jest.fn().mockResolvedValue(role) } as any,
        {} as any,
        { transaction: (write: any) => write({}) } as any,
        cache,
      );
      const actor = {
        id: 'admin',
        roleName: 'ADMIN',
        permissions: [`rbac:${method === 'remove' ? 'delete' : 'update'}`],
      };
      if (method === 'update')
        await service.update('role', { description: 'Changed' }, actor);
      else await service.remove('role', actor);
      expect(cache.get('role')).toBeUndefined();
    },
  );
});
