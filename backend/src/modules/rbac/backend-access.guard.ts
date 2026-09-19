import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PATH_METADATA } from '@nestjs/common/constants';
import { AuthGuard } from '@nestjs/passport';
import { AccessService } from './access.service';
import { isSuperadmin } from './access-policy';
import { PERMISSION_KEY } from '../../common/decorator/require-permission.decorator';
import { ProjectScopeService } from './project-scope.service';

/** One entry point protects controllers which previously had no authorization. */
@Injectable()
export class BackendAccessGuard extends AuthGuard('jwt') {
  constructor(
    private readonly access: AccessService,
    private readonly reflector: Reflector,
    private readonly scopes: ProjectScopeService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;
    const controller =
      this.reflector.get<string>(PATH_METADATA, context.getClass()) ?? '';
    const handler =
      this.reflector.get<string>(PATH_METADATA, context.getHandler()) ?? '';
    const req = context.switchToHttp().getRequest();
    const publicAuth =
      controller === 'auth' &&
      req.method === 'POST' &&
      ['login', 'signup', 'forgot-password', 'reset-password'].includes(
        handler,
      );
    const oauthCallback =
      /^auth\/(google|microsoft|zoho)$/.test(controller) &&
      handler === 'callback' &&
      req.method === 'GET';
    if (publicAuth || oauthCallback) return true;
    await super.canActivate(context);
    if (isSuperadmin(req.user)) return true;
    if (
      controller === 'auth' &&
      ['me', 'logout', 'change-password'].includes(handler)
    )
      return true;
    if (controller === 'access') return true; // Each management handler checks its own privilege.
    const resource =
      `${controller}/${handler}`
        .split('/')
        .find((segment) => segment && !segment.startsWith(':')) ?? 'projects';
    const scopeResource = this.scopes.resourceFor(
      controller,
      handler,
      resource,
    );
    if (
      ['reports', 'search', 'activity', 'activity-logs'].includes(resource) ||
      (resource === 'dashboards' && !controller)
    ) {
      throw new ForbiddenException(
        'Cross-project reporting requires Superadmin',
      );
    }
    const filteredCollection =
      ['projects', 'boqs', 'quotations'].includes(controller) &&
      req.method === 'GET' &&
      (handler === '/' || handler === '');
    if (filteredCollection) {
      req.accessChecked = true;
      return true;
    }
    // Security administration changes can grant arbitrary privileges.
    if (
      ['rbac', 'permissions', 'role-permissions', 'role-apps', 'apps'].includes(
        resource,
      ) &&
      !['GET', 'HEAD'].includes(req.method)
    ) {
      throw new ForbiddenException(
        'Only Superadmin may change roles, permissions, or app grants',
      );
    }
    if (resource === 'users' && !['GET', 'HEAD'].includes(req.method)) {
      const selfProfile =
        req.params.id === req.user.id &&
        [':id/profile', ':id/avatar'].includes(handler);
      if (!selfProfile)
        throw new ForbiddenException(
          'Only Superadmin may administer user accounts',
        );
      return true;
    }
    const required = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const action =
      required?.split(':')[1] ??
      (['GET', 'HEAD'].includes(req.method)
        ? 'view'
        : req.method === 'DELETE'
          ? 'delete'
          : /approve|reject|publish|submit|reopen|override/i.test(handler)
            ? 'approve'
            : req.method === 'POST'
              ? 'create'
              : 'edit');
    const projectIds = await this.scopes.resolve(scopeResource, req, handler);
    // Legacy aggregate handlers do not constrain their queries to authorized projects.
    // Do not expose their cross-project results to a scoped account.
    const projectResources = [
      'projects',
      'boqs',
      'quotations',
      'plan-of-actions',
      'project-briefs',
      'budget-estimates',
      'payment-schedules',
      'purchase-orders',
      'work-orders',
      'delivery-challans',
      'projects-phases',
      'command-center',
    ];
    if (
      (projectResources.includes(resource) ||
        this.scopes.isProjectResource(scopeResource)) &&
      ['GET', 'HEAD'].includes(req.method) &&
      !Object.keys(req.params).length &&
      !(
        resource === 'plan-of-actions' &&
        (handler === '/' || handler === '') &&
        req.query.project_id
      )
    ) {
      throw new ForbiddenException(
        'This endpoint requires a project-scoped query',
      );
    }
    if (
      this.scopes.isProjectResource(scopeResource) &&
      !projectIds.length &&
      resource !== 'projects'
    ) {
      throw new ForbiddenException('A project ownership reference is required');
    }
    if (
      resource === 'team' &&
      !['GET', 'HEAD'].includes(req.method) &&
      !projectIds.length
    ) {
      throw new ForbiddenException(
        'Only Superadmin may change internal team access',
      );
    }
    for (const projectId of projectIds.length ? projectIds : [undefined]) {
      await this.access.require(
        req.user,
        required?.split(':')[0] ?? resource,
        action,
        projectId,
      );
      if (
        projectId &&
        (resource === 'team' ||
          /team|members/.test(handler) ||
          req.body?.team_members !== undefined) &&
        !['GET', 'HEAD'].includes(req.method)
      ) {
        await this.access.require(req.user, 'team', 'manage', projectId);
      }
    }
    req.accessChecked = true;
    return true;
  }
}
