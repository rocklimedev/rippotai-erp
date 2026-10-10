import 'reflect-metadata';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { readFileSync } from 'fs';
import { PortalAccessGuard } from '../guards/portal-access.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { PERMISSION_KEY } from '../decorator/require-permission.decorator';
import { IS_PUBLIC_KEY } from '../decorator/public.decorator';
import { ACCOUNT_ROUTES } from './account-route-policy';

const { scan, artefacts } = require('../../../scripts/catalogue-routes.cjs');
const routes = scan();
const reflector = new Reflector();
const portal = new PortalAccessGuard(reflector);
const permissions = new PermissionsGuard(reflector);
function context(route: any, user: any, params = {}): ExecutionContext {
  const controller = class {};
  Object.defineProperty(controller, 'name', { value: route.controller });
  const handler = function () {};
  Object.defineProperty(handler, 'name', { value: route.handler });
  if (route.permission)
    Reflect.defineMetadata(PERMISSION_KEY, route.permission, handler);
  if (route.public) Reflect.defineMetadata(IS_PUBLIC_KEY, true, handler);
  return {
    getType: () => 'http',
    getClass: () => controller,
    getHandler: () => handler,
    switchToHttp: () => ({ getRequest: () => ({ user, params }) }),
  } as unknown as ExecutionContext;
}

it('keeps all route annotations, module catalogue, migration and documentation in sync', () => {
  for (const [file, content] of artefacts(routes))
    expect(readFileSync(file, 'utf8')).toBe(content);
  expect(routes.length).toBeGreaterThan(900);
  expect(routes.filter((r) => r.public)).toHaveLength(17);
  for (const [key, permission] of Object.entries(ACCOUNT_ROUTES)) {
    expect(
      routes.some(
        (r) =>
          `${r.controller}.${r.handler}` === key &&
          r.permission === permission &&
          !r.public,
      ),
    ).toBe(true);
  }
});

describe.each(
  routes.filter(
    (r) => !r.public && !ACCOUNT_ROUTES[`${r.controller}.${r.handler}`],
  ),
)('$method $path ($permission)', (route) => {
  it('denies USER, missing roles/actors, inactive staff and absent/wrong grants; accepts the exact staff grant', () => {
    const base = {
      id: 'staff',
      roleName: 'STAFF',
      is_active: true,
      permissions: [route.permission],
    };
    for (const user of [
      { ...base, roleName: 'USER' },
      { ...base, roleName: ' user ' },
      { ...base, roleName: null },
      { ...base, id: null },
      { ...base, id: ' ' },
      { ...base, is_active: false },
    ])
      expect(() => portal.canActivate(context(route, user))).toThrow();
    for (const grants of [
      undefined,
      [],
      ['unrelated:update'],
      ['*'],
      route.permission,
    ]) {
      expect(() =>
        permissions.canActivate(
          context(route, { ...base, permissions: grants }),
        ),
      ).toThrow();
    }
    expect(portal.canActivate(context(route, base))).toBe(true);
    expect(permissions.canActivate(context(route, base))).toBe(true);
    expect(() =>
      permissions.canActivate(
        context(route, { ...base, roleName: 'ADMIN', permissions: [] }),
      ),
    ).toThrow();
  });
});

it('fails closed for newly added routes without permission metadata', () => {
  const ctx = context(
    { controller: 'NewController', handler: 'create' },
    { id: 'staff', roleName: 'ADMIN', permissions: ['*'] },
  );
  expect(portal.canActivate(ctx)).toBe(true);
  expect(() => permissions.canActivate(ctx)).toThrow(
    'Route permission is not configured',
  );
});

it('preserves public flows and scoped account capabilities without staff grants', () => {
  for (const route of routes.filter((r) => r.public)) {
    expect(portal.canActivate(context(route, undefined))).toBe(true);
    expect(permissions.canActivate(context(route, undefined))).toBe(true);
  }
  for (const route of routes.filter(
    (r) => ACCOUNT_ROUTES[`${r.controller}.${r.handler}`],
  )) {
    const ctx = context(
      route,
      { id: 'self', roleName: 'USER', permissions: [] },
      { id: 'self' },
    );
    expect(portal.canActivate(ctx)).toBe(true);
    expect(permissions.canActivate(ctx)).toBe(true);
  }
});

it('denies changing another profile and restricts inactive account capabilities', () => {
  const profile = routes.find(
    (r) => r.controller === 'UsersController' && r.handler === 'updateProfile',
  );
  expect(() =>
    permissions.canActivate(context(profile, { id: 'self' }, { id: 'other' })),
  ).toThrow('Only your own profile');
  for (const route of routes.filter(
    (r) => ACCOUNT_ROUTES[`${r.controller}.${r.handler}`],
  )) {
    const ctx = context(route, {
      id: 'self',
      roleName: 'USER',
      is_active: false,
    });
    if (['account:read', 'account:logout'].includes(route.permission))
      expect(portal.canActivate(ctx)).toBe(true);
    else expect(() => portal.canActivate(ctx)).toThrow('deactivated');
  }
});
