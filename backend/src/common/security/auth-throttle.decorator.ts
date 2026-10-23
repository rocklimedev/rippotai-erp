import { applyDecorators, SetMetadata } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { createHmac } from 'crypto';

export const AUTH_THROTTLE_KEY = 'authThrottle';
export const AUTH_THROTTLE_KIND = 'authThrottleKind';

export function trackerHash(scope: string, identity: string) {
  const secret = process.env.AUTH_TRACKER_SECRET || process.env.JWT_SECRET;
  if (!secret)
    throw new Error(
      'AUTH_TRACKER_SECRET or JWT_SECRET is required for shared rate tracking',
    );
  return createHmac('sha256', secret)
    .update(JSON.stringify([scope, identity]))
    .digest('hex');
}

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
  const route = String(req.route?.path || '');
  // Ignore extra body fields: an attacker must not rotate a fake email to
  // evade the reset/verification token's abuse budget before DTO validation.
  const tokenRoute = /\/(reset-password|verify-email)$/.test(route);
  const identity = tokenRoute
    ? reset || 'unidentified'
    : email || session || 'unidentified';
  return trackerHash(
    'auth-request',
    JSON.stringify([req.ip ?? 'unknown', identity]),
  );
}

export function AuthThrottle(kind: 'entry' | 'token' = 'entry') {
  return applyDecorators(
    SetMetadata(AUTH_THROTTLE_KEY, true),
    SetMetadata(AUTH_THROTTLE_KIND, kind),
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
