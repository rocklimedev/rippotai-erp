import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@/modules/users/models/user.model';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user?: User;
}

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): User | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();

    return request.user;
  },
);
