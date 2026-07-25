import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

/**
 * PortalAccessGuard
 * ------------------
 * Blocks access to the main portal in two cases:
 *
 *  - user.role === 'USER'      → the default signup role has no portal access
 *  - user.is_active === false  → the account has been deactivated
 *
 * The user can still log in and authenticate normally (JWT is issued, /auth/me
 * still works) — this guard only blocks whatever route(s) it's applied to.
 * That lets the frontend log the user in, discover the block via /auth/me,
 * and redirect to a "No Access" page instead of the portal.
 *
 * Usage: apply AFTER your JWT auth guard so `request.user` is populated.
 *
 *   @UseGuards(JwtAuthGuard, PortalAccessGuard)
 *   @Controller('projects')
 *   export class ProjectsController { ... }
 *
 * Do NOT apply this to auth endpoints (/auth/login, /auth/me, /auth/logout,
 * /auth/change-password, etc.) — those must stay reachable so the login flow
 * and the "why can't I get in" check both keep working.
 */
@Injectable()
export class PortalAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      // No authenticated user on the request. This guard assumes a JWT auth
      // guard already ran and populated request.user — if it didn't, fail
      // closed rather than silently allowing the request through.
      throw new ForbiddenException('Not authenticated.');
    }

    if (user.is_active === false) {
      throw new ForbiddenException(
        'Your account has been deactivated. Contact an administrator.',
      );
    }

    if (user.role === 'USER') {
      throw new ForbiddenException(
        'Your account does not have access to the portal.',
      );
    }

    return true;
  }
}
