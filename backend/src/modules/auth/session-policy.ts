import { UnauthorizedException } from '@nestjs/common';

export const ACCESS_TOKEN_SECONDS = 20 * 60;
export const SESSION_IDLE_MS = 10 * 60 * 1000;

export function assertSessionLifetime(
  payload: { iat?: number; exp?: number },
  session: { expires_at: Date; last_used_at?: Date | null; created_at?: Date },
  now = Date.now(),
) {
  const issued = Number(payload.iat) * 1000;
  const expiry = Number(payload.exp) * 1000;
  const lastUsed = new Date(
    session.last_used_at ?? session.created_at ?? NaN,
  ).getTime();
  if (
    !Number.isFinite(issued) ||
    !Number.isFinite(expiry) ||
    issued > now ||
    expiry <= now ||
    expiry <= issued ||
    expiry - issued > ACCESS_TOKEN_SECONDS * 1000 ||
    !Number.isFinite(lastUsed) ||
    now - lastUsed >= SESSION_IDLE_MS ||
    new Date(session.expires_at).getTime() <= now
  ) {
    throw new UnauthorizedException('Session expired. Sign in again.');
  }
}
