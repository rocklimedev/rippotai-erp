import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorator/public.decorator';

/** Restrict operational diagnostics beyond the global JWT/permission checks. */
@Injectable()
export class SystemAdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (
      this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) === true
    )
      return true;
    const actor = context.switchToHttp().getRequest().user;
    if (typeof actor?.id !== 'string' || !actor.id.trim())
      throw new UnauthorizedException('Authentication required');
    if (
      actor.is_active !== true ||
      !['ADMIN', 'SUPERADMIN'].includes(actor.roleName)
    ) {
      throw new ForbiddenException('Administrator access required');
    }
    return true;
  }
}
