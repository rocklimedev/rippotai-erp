import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { PATH_METADATA } from '@nestjs/common/constants';
import { PERMISSION_KEY } from '../decorator/require-permission.decorator';
import {
  isProjectFinancialField,
  PROJECT_FINANCIAL_VALUES_PERMISSION,
} from '../security/project-financial-values';

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

export function stripSecrets<T>(
  data: T,
  omitField?: (key: string) => boolean,
): T {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;
  if (Buffer.isBuffer(data) || data instanceof StreamableFile) return data;
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      if (SECRET_KEYS.has(key) || omitField?.(key)) return undefined;
      if (
        omitField &&
        typeof value === 'string' &&
        ['text', 'message'].includes(key)
      ) {
        return value
          .replace(/^Proposal quoted at ₹[\d,.]+/, 'Proposal quoted')
          .replace(/^Proposal of ₹[\d,.]+ sent/, 'Proposal sent');
      }
      return value;
    }),
  );
}

@Injectable()
export class StripSecretsInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const request =
      ctx.getType() === 'http' ? ctx.switchToHttp().getRequest() : undefined;
    const permissions = request?.user?.permissions;
    if (
      ctx.getType() !== 'http' ||
      (Array.isArray(permissions) &&
        permissions.includes(PROJECT_FINANCIAL_VALUES_PERMISSION))
    ) {
      return next.handle().pipe(map((data) => stripSecrets(data)));
    }
    const handler = ctx.getHandler();
    const controller = ctx.getClass();
    const permission =
      Reflect.getMetadata(PERMISSION_KEY, handler) ??
      Reflect.getMetadata(PERMISSION_KEY, controller);
    const route = Reflect.getMetadata(PATH_METADATA, handler);
    const prefix = Reflect.getMetadata(PATH_METADATA, controller);
    return next
      .handle()
      .pipe(
        map((data) =>
          stripSecrets(data, (key) =>
            isProjectFinancialField(
              key,
              permission,
              route,
              prefix,
              request?.params?.app,
            ),
          ),
        ),
      );
  }
}
