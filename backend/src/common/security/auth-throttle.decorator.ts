import { applyDecorators, SetMetadata } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { createHmac, randomBytes } from 'crypto';

export const AUTH_THROTTLE_KEY = 'authThrottle';
const trackerSecret = randomBytes(32);

export function configuredPositiveInteger(key: string, fallback: number) {
  const value = Number(process.env[key] ?? fallback);
  if (!Number.isSafeInteger(value) || value <= 0)
    throw new Error(`${key} must be a positive integer`);
  return value;
}

// Never persist or log email addresses, bearer tokens or reset tokens as tracker keys.
export function authTracker(req: any) {
  const email =
    typeof req.body?.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : '';
  const reset = typeof req.body?.token === 'string' ? req.body.token : '';
  const session =
    typeof req.headers?.authorization === 'string'
      ? req.headers.authorization
      : '';
  const identity = email || reset || session || 'unidentified';
  return createHmac('sha256', trackerSecret)
    .update(`${req.ip ?? 'unknown'}:${identity}`)
    .digest('hex');
}

export function AuthThrottle(kind: 'entry' | 'token' = 'entry') {
  return applyDecorators(
    SetMetadata(AUTH_THROTTLE_KEY, true),
    Throttle({
      default: {
        limit: () =>
          configuredPositiveInteger(
            kind === 'entry' ? 'AUTH_RATE_LIMIT_MAX' : 'TOKEN_RATE_LIMIT_MAX',
            kind === 'entry' ? 10 : 120,
          ),
        ttl: () => configuredPositiveInteger('AUTH_RATE_LIMIT_TTL_MS', 60_000),
        getTracker: authTracker,
      },
    }),
  );
}
