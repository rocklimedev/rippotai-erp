import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuthStateService } from './oauth-state.service';

describe('OAuthStateService', () => {
  const config = new ConfigService({ OAUTH_STATE_SECRET: 'test-oauth-state-secret' });

  it('round-trips state with an unconfigured module JWT service', () => {
    const service = new OAuthStateService(new JwtService(), config);
    const state = { userId: 'user', provider: 'zoho' as const };
    expect(service.verify(service.sign(state))).toMatchObject(state);
  });

  it('uses the same state secret across differently configured modules', () => {
    const signer = new OAuthStateService(new JwtService({ secret: 'module-a' }), config);
    const verifier = new OAuthStateService(new JwtService({ secret: 'module-b' }), config);
    expect(verifier.verify(signer.sign({ userId: 'user', provider: 'zoho' })).userId).toBe('user');
  });

  it('rejects session tokens and missing configuration', () => {
    const service = new OAuthStateService(new JwtService(), config);
    const session = new JwtService({ secret: 'test-oauth-state-secret' }).sign({ userId: 'user' });
    expect(() => service.verify(session)).toThrow();
    expect(() => new OAuthStateService(new JwtService(), new ConfigService()).sign({ userId: 'user', provider: 'zoho' }))
      .toThrow('OAUTH_STATE_SECRET is not configured');
  });
});
