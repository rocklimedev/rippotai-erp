import { Op } from 'sequelize';
import { AuthService } from './auth.service';
import {
  AuthTokensService,
  SESSION_TOUCH_INTERVAL_MS,
} from './auth-tokens.service';
import {
  RolePermissionsCache,
  ROLE_PERMISSION_TTL_MS,
} from '../rbac/role-permissions-cache';

describe('Authenticated request database cost', () => {
  let cache: RolePermissionsCache;
  let auth: AuthService;
  let model: any;
  let tokens: AuthTokensService;
  let session: any;
  let payload: any;
  let permissions: string[];

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-23T06:00:00Z'));
    const now = Date.now();
    payload = {
      jti: 'session-secret',
      role_id: 'staff',
      iat: now / 1000 - 120,
      exp: now / 1000 + 1080,
    };
    session = {
      id: 'session',
      revoked_at: null,
      expires_at: new Date(now + 1080_000),
      last_used_at: new Date(now),
      user: {
        id: 'user',
        email: 'staff@example.com',
        email_verified_at: new Date(now),
        email_verified_address: 'staff@example.com',
        is_active: true,
        role_id: 'staff',
        role: { id: 'staff', name: 'STAFF' },
      },
    };
    permissions = ['users:read'];
    model = {
      findOne: jest.fn(async (options) => {
        const include = options.include[0].include[0].include;
        return {
          ...session,
          user: {
            ...session.user,
            role: {
              ...session.user.role,
              ...(include
                ? {
                    rolePermissions: permissions.map((key) => {
                      const [resource, action] = key.split(':');
                      return { permission: { resource, action } };
                    }),
                  }
                : {}),
            },
          },
        };
      }),
      update: jest.fn(async (patch) => {
        Object.assign(session, patch);
        return [1];
      }),
    };
    cache = new RolePermissionsCache();
    tokens = new AuthTokensService(model);
    auth = new AuthService({} as any, {} as any, tokens, {} as any, cache);
  });
  afterEach(() => jest.useRealTimers());

  const joined = (call: any) =>
    call[0].include[0].include[0].include !== undefined;

  it('uses one joined SELECT on a cold cache, then one lighter SELECT and no writes per warm request', async () => {
    const first = await auth.getCurrentUserFromPayload(payload);
    expect(first.permissions).toEqual(['users:read']);
    expect(model.findOne).toHaveBeenCalledTimes(1);
    expect(joined(model.findOne.mock.calls[0])).toBe(true);
    first.permissions.push('users:update');
    const results = await Promise.all(
      Array.from({ length: 25 }, () => auth.getCurrentUserFromPayload(payload)),
    );
    expect(model.findOne).toHaveBeenCalledTimes(26);
    expect(
      model.findOne.mock.calls.slice(1).every((call: any) => !joined(call)),
    ).toBe(true);
    expect(
      results.every((result) => result.permissions.join() === 'users:read'),
    ).toBe(true);
    expect(model.update).not.toHaveBeenCalled();
  });

  it('expires permissions after an absolute TTL even under continuous traffic', async () => {
    await auth.getCurrentUserFromPayload(payload);
    jest.advanceTimersByTime(ROLE_PERMISSION_TTL_MS - 1);
    permissions = ['documents:read'];
    expect((await auth.getCurrentUserFromPayload(payload)).permissions).toEqual(
      ['users:read'],
    );
    jest.advanceTimersByTime(1);
    expect((await auth.getCurrentUserFromPayload(payload)).permissions).toEqual(
      ['documents:read'],
    );
    expect(model.findOne.mock.calls.map(joined)).toEqual([true, false, true]);
  });

  it('never authorizes using the JWT role when the database role has changed', async () => {
    cache.set('staff', ['users:update'], cache.generation);
    session.user.role_id = 'viewer';
    session.user.role = { id: 'viewer', name: 'VIEWER' };
    const user = await auth.getCurrentUserFromPayload(payload);
    expect(user.role_id).toBe('viewer');
    expect(user.permissions).toEqual(['users:read']);
    expect(model.findOne.mock.calls.map(joined)).toEqual([false, true]);
  });

  it('retries a lookup invalidated while its database query was in flight', async () => {
    let release!: (value: any) => void;
    const stale = {
      ...session,
      user: {
        ...session.user,
        role: {
          ...session.user.role,
          rolePermissions: [
            { permission: { resource: 'users', action: 'update' } },
          ],
        },
      },
    };
    model.findOne.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    const request = auth.getCurrentUserFromPayload(payload);
    cache.invalidate('staff');
    release(stale);
    expect((await request).permissions).toEqual(['users:read']);
    expect(cache.get('staff')).toEqual(['users:read']);
    expect(model.findOne).toHaveBeenCalledTimes(2);
  });

  it.each(['revoked', 'disabled', 'unverified', 'idle', 'expired'])(
    'still rejects a %s session on a cache hit',
    async (state) => {
      cache.set('staff', ['users:read'], cache.generation);
      if (state === 'revoked') session.revoked_at = new Date();
      if (state === 'disabled') session.user.is_active = false;
      if (state === 'unverified') session.user.email_verified_at = null;
      if (state === 'idle')
        session.last_used_at = new Date(Date.now() - 600_000);
      if (state === 'expired') session.expires_at = new Date(Date.now() - 1);
      await expect(auth.getCurrentUserFromPayload(payload)).rejects.toThrow();
      expect(model.findOne).toHaveBeenCalledTimes(1);
      expect(model.update).not.toHaveBeenCalled();
    },
  );

  it('coalesces touches from a dashboard burst and persists no more than once per minute', async () => {
    session.last_used_at = new Date(Date.now() - SESSION_TOUCH_INTERVAL_MS);
    await Promise.all(
      Array.from({ length: 50 }, () => auth.getCurrentUserFromPayload(payload)),
    );
    expect(model.findOne).toHaveBeenCalledTimes(50);
    expect(model.update).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(SESSION_TOUCH_INTERVAL_MS - 1);
    await auth.getCurrentUserFromPayload(payload);
    expect(model.update).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(1);
    await auth.getCurrentUserFromPayload(payload);
    expect(model.update).toHaveBeenCalledTimes(2);
  });

  it('uses a database time predicate so separate processes cannot both write a recent session', async () => {
    const stale = new Date(Date.now() - SESSION_TOUCH_INTERVAL_MS);
    await tokens.touchLastUsed(session.id, stale);
    const where = model.update.mock.calls[0][1].where;
    expect(where.id).toBe(session.id);
    expect(where.revoked_at[Op.is]).toBeNull();
    expect(where[Op.or]).toEqual([
      { last_used_at: { [Op.lte]: stale } },
      { last_used_at: { [Op.is]: null } },
    ]);
  });

  it('allows a failed touch to retry instead of suppressing persistence for a minute', async () => {
    model.update.mockRejectedValueOnce(new Error('database unavailable'));
    await expect(tokens.touchLastUsed(session.id)).rejects.toThrow(
      'database unavailable',
    );
    await tokens.touchLastUsed(session.id);
    expect(model.update).toHaveBeenCalledTimes(2);
  });
});
