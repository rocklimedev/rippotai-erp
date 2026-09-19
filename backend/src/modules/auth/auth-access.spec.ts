import { AuthService } from './auth.service';

describe('disabled account sessions', () => {
  it('rejects disabled users before creating a login token', async () => {
    const users = { findOne: jest.fn().mockResolvedValue({ is_active: false }) };
    const tokens = { create: jest.fn() };
    const service = new AuthService({} as any, users as any, {} as any, tokens as any);
    await expect(service.login('a@example.com', 'password')).rejects.toThrow('Invalid credentials');
    expect(tokens.create).not.toHaveBeenCalled();
  });
  it('rejects an existing valid token after the account is disabled', async () => {
    const tokens = {
      findByHash: jest.fn().mockResolvedValue({ user: { id: 'user', is_active: false }, expires_at: new Date(Date.now() + 60000) }),
      touchLastUsed: jest.fn(),
    };
    const service = new AuthService({} as any, {} as any, {} as any, tokens as any);
    await expect(service.getCurrentUserFromPayload({ sub: 'user', jti: 'token' })).rejects.toThrow('inactive');
    expect(tokens.touchLastUsed).not.toHaveBeenCalled();
  });
});
