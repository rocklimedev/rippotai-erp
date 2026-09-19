import { Reflector } from '@nestjs/core';
import { PATH_METADATA } from '@nestjs/common/constants';
import { BackendAccessGuard } from './backend-access.guard';

describe('backend authorization entry point', () => {
  let authenticate: jest.SpyInstance;
  let access: any;
  let scopes: any;
  let guard: BackendAccessGuard;
  const context = (controllerPath: string, handlerPath: string, method = 'GET', params = {}, body = {}) => {
    class Controller {}
    function handler() {}
    Reflect.defineMetadata(PATH_METADATA, controllerPath, Controller);
    Reflect.defineMetadata(PATH_METADATA, handlerPath, handler);
    const req = { method, params, body, query: {}, user: { id: 'user', roleName: 'ADMIN' } };
    return { getType: () => 'http', getClass: () => Controller, getHandler: () => handler,
      switchToHttp: () => ({ getRequest: () => req }) } as any;
  };
  beforeEach(() => {
    authenticate = jest.spyOn(Object.getPrototypeOf(BackendAccessGuard.prototype), 'canActivate').mockResolvedValue(true);
    access = { require: jest.fn().mockResolvedValue(undefined) };
    scopes = { resolve: jest.fn().mockResolvedValue([]), isProjectResource: jest.fn().mockReturnValue(false),
      resourceFor: jest.fn((_controller, _handler, fallback) => fallback) };
    guard = new BackendAccessGuard(access, new Reflector(), scopes);
  });
  afterEach(() => jest.restoreAllMocks());
  it('leaves login public but not arbitrary auth endpoints', async () => {
    await guard.canActivate(context('auth', 'login', 'POST'));
    expect(authenticate).not.toHaveBeenCalled();
    await guard.canActivate(context('auth/tokens', '/', 'GET'));
    expect(authenticate).toHaveBeenCalled();
    expect(access.require).toHaveBeenCalled();
  });
  it('does not let Admin edit role grants', async () => {
    await expect(guard.canActivate(context('role-permissions', '/', 'POST'))).rejects.toThrow('Only Superadmin');
  });
  it('checks each resolved project instead of internal role privileges', async () => {
    scopes.resolve.mockResolvedValue(['a', 'b']);
    await guard.canActivate(context('boqs', ':id', 'PATCH', { id: 'boq' }));
    expect(access.require).toHaveBeenCalledWith(expect.anything(), 'boqs', 'edit', 'a');
    expect(access.require).toHaveBeenCalledWith(expect.anything(), 'boqs', 'edit', 'b');
  });
  it('requires team management for an embedded roster update', async () => {
    scopes.resolve.mockResolvedValue(['a']);
    await guard.canActivate(context('plan-of-actions', ':id', 'PATCH', { id: 'poa' }, { team_members: [] }));
    expect(access.require).toHaveBeenCalledWith(expect.anything(), 'team', 'manage', 'a');
  });
  it('does not mistake nested gate collections for the filtered projects list', async () => {
    scopes.resolve.mockResolvedValue(['a']);
    await guard.canActivate(context('projects/:projectId/gates', '/', 'GET', { projectId: 'a' }));
    expect(access.require).toHaveBeenCalledWith(expect.anything(), 'projects', 'view', 'a');
  });
  it('denies unscoped legacy project summaries', async () => {
    await expect(guard.canActivate(context('projects', 'summary'))).rejects.toThrow('project-scoped query');
  });
  it('authenticates even Superadmin', async () => {
    authenticate.mockRejectedValue(new Error('Inactive account'));
    const ctx = context('projects', ':id', 'DELETE', { id: 'a' });
    ctx.switchToHttp().getRequest().user.roleName = 'SUPERADMIN';
    await expect(guard.canActivate(ctx)).rejects.toThrow('Inactive account');
  });
});
