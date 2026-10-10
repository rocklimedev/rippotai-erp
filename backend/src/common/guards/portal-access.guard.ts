import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorator/public.decorator';
import { PERMISSION_KEY } from '../decorator/require-permission.decorator';
import { isAccountRoute } from '../security/account-route-policy';

/** Global HTTP staff gate, after JWT authentication and before permissions.
 * Only reviewed public routes and narrow account capabilities bypass it.
 * Inactive accounts can inspect /auth/me and log out, but cannot mutate data.
 */
@Injectable()
export class PortalAccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') return true;
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride(IS_PUBLIC_KEY, targets) === true)
      return true;
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (typeof user?.id !== 'string' || !user.id.trim()) {
      // No authenticated user on the request. This guard assumes a JWT auth
      // guard already ran and populated request.user — if it didn't, fail
      // closed rather than silently allowing the request through.
      throw new UnauthorizedException('Authenticated actor required');
    }

    const permission = this.reflector.getAllAndOverride<string>(
      PERMISSION_KEY,
      targets,
    );
    const accountRoute = isAccountRoute(context, permission);
    if (
      user.is_active === false &&
      !(
        accountRoute &&
        ['account:read', 'account:logout'].includes(permission || '')
      )
    ) {
      throw new ForbiddenException(
        'Your account has been deactivated. Contact an administrator.',
      );
    }

    if (accountRoute) return true;
    const role = user.roleName ?? user.role;
    if (
      typeof role !== 'string' ||
      !role.trim() ||
      role.trim().toUpperCase() === 'USER'
    ) {
      throw new ForbiddenException(
        'Your account does not have access to the portal.',
      );
    }

    return true;
  }
}
