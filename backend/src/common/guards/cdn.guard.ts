import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class CdnGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const token = request.headers['x-cdn-secret'];

    if (!token) {
      throw new UnauthorizedException('Missing CDN token');
    }

    if (token !== process.env.CDN_INTERNAL_SECRET) {
      throw new UnauthorizedException('Invalid CDN token');
    }

    return true;
  }
}
