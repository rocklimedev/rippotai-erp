import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorator/require-permission.decorator';
import { CurrentUserPayload } from '../interfaces/current-user-payload.interface';
import { IS_PUBLIC_KEY } from '../decorator/public.decorator';
import { isAccountRoute } from '../security/account-route-policy';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') return true;
    if (
      this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) === true
    )
      return true;
    const required = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required)
      throw new ForbiddenException('Route permission is not configured');

    const request = context.switchToHttp().getRequest();
    const user: CurrentUserPayload | undefined = request.user;
    if (typeof user?.id !== 'string' || !user.id.trim()) {
      throw new UnauthorizedException('Authenticated actor required');
    }

    if (isAccountRoute(context, required)) {
      if (required === 'profile:update-own' && request.params?.id !== user.id) {
        throw new ForbiddenException('Only your own profile may be updated');
      }
      return true;
    }
    if (
      !Array.isArray(user.permissions) ||
      !user.permissions.includes(required)
    ) {
      throw new ForbiddenException(`Missing permission "${required}"`);
    }
    return true;
  }
}
