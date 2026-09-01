import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorator/require-permission.decorator';
import { CurrentUserPayload } from '../interfaces/current-user-payload.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const request = context.switchToHttp().getRequest();
    const user: CurrentUserPayload | undefined = request.user;
    if (!user) {
      throw new ForbiddenException('No authenticated user on request.');
    }

    if (!user.permissions?.includes(required)) {
      throw new ForbiddenException(
        `Missing permission "${required}" — required to perform this gate action.`,
      );
    }
    return true;
  }
}
