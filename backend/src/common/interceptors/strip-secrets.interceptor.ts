import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

/**
 * Last line of defence: removes secret columns (password hashes, token hashes,
 * OAuth tokens) from every JSON response, however deeply they are nested
 * (e.g. `preparedByUser.password_hash` on an include).
 */
export const SECRET_KEYS = new Set([
  'password_hash',
  'passwordHash',
  'token_hash',
  'tokenHash',
  'refreshToken',
  'refresh_token',
  'accessToken',
  'access_token',
  'client_secret',
  'clientSecret',
]);

export function stripSecrets<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;
  if (Buffer.isBuffer(data) || data instanceof StreamableFile) return data;
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      SECRET_KEYS.has(key) ? undefined : value,
    ),
  );
}

@Injectable()
export class StripSecretsInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => stripSecrets(data)));
  }
}
