import {
  assertSessionLifetime,
  ACCESS_TOKEN_SECONDS,
  SESSION_IDLE_MS,
} from './session-policy';

describe('Session lifetimes', () => {
  const now = 1_800_000_000_000;
  const payload = { iat: now / 1000 - 60, exp: now / 1000 + 1140 };
  const session = {
    expires_at: new Date(now + 1140_000),
    last_used_at: new Date(now - 1000),
  };
  it('accepts a recently used session', () => {
    expect(() => assertSessionLifetime(payload, session, now)).not.toThrow();
  });
  it('rejects legacy week-long JWTs even if their database session is active', () => {
    expect(() =>
      assertSessionLifetime(
        { ...payload, exp: payload.iat + 7 * 86400 },
        session,
        now,
      ),
    ).toThrow('Session expired');
  });
  it('accepts a day-long session after hours of inactivity', () => {
    expect(() => assertSessionLifetime(
      { iat: now / 1000 - 12 * 3600, exp: now / 1000 + 12 * 3600 },
      { expires_at: new Date(now + 12 * 3600_000), last_used_at: new Date(now - 12 * 3600_000) },
      now,
    )).not.toThrow();
  });
  it('expires an idle session at one day', () => {
    expect(() =>
      assertSessionLifetime(
        payload,
        { ...session, last_used_at: new Date(now - SESSION_IDLE_MS) },
        now,
      ),
    ).toThrow('Session expired');
  });
  it('uses creation time when no request has touched a session', () => {
    expect(() =>
      assertSessionLifetime(
        payload,
        {
          ...session,
          last_used_at: null,
          created_at: new Date(now - SESSION_IDLE_MS),
        },
        now,
      ),
    ).toThrow('Session expired');
  });
  it('rejects tokens without timestamps or beyond their hard expiry', () => {
    expect(() => assertSessionLifetime({}, session, now)).toThrow();
    expect(() =>
      assertSessionLifetime(payload, session, payload.exp * 1000),
    ).toThrow();
    expect(ACCESS_TOKEN_SECONDS).toBe(86400);
  });
});
