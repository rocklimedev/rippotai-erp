import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { map } from 'rxjs';
import {
  FILE_SCOPES,
  fileScope,
  signFileReference,
  normalizeFileLink,
  privateFileKey,
} from './file-access';

// Only authorized JSON responses mint links. Stored references never expire;
// the browser URL does. No endpoint accepts a reference to mint arbitrary links.
export function resolveFileLinks(
  data: unknown,
  permissions: string[],
): unknown {
  if (data == null || Buffer.isBuffer(data) || data instanceof StreamableFile)
    return data;
  return JSON.parse(
    JSON.stringify(data, (_key, value) => {
      if (typeof value !== 'string') return value;
      const key = privateFileKey(value);
      if (!key) return value;
      const scope = fileScope(key);
      return scope && permissions.includes(FILE_SCOPES[scope])
        ? signFileReference(value)
        : null;
    }),
  );
}

@Injectable()
export class FileLinksInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    if (context.getType() !== 'http') return next.handle();
    const request = context.switchToHttp().getRequest();
    const permissions = request.user?.permissions;
    if (request.body && typeof request.body === 'object') {
      request.body = JSON.parse(
        JSON.stringify(request.body, (_key, value) =>
          typeof value === 'string' ? normalizeFileLink(value) : value,
        ),
      );
    }
    return next
      .handle()
      .pipe(
        map((data) =>
          resolveFileLinks(data, Array.isArray(permissions) ? permissions : []),
        ),
      );
  }
}
