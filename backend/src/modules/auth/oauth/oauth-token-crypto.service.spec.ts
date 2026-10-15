import { ConfigService } from '@nestjs/config';
import { GoogleAuthService } from '../google-auth.service';
import { MicrosoftAuthService } from '../microsoft-auth.service';
import { OAuthTokenCryptoService } from './oauth-token-crypto.service';

describe('managed OAuth token encryption', () => {
  const originalFetch = global.fetch;
  const config = new ConfigService({
    OAUTH_VAULT_ADDR: 'https://vault.example',
    OAUTH_VAULT_KEY: 'oauth-tokens',
    OAUTH_VAULT_TOKEN: 'service-identity',
    MICROSOFT_CLIENT_ID: 'client',
    MICROSOFT_CLIENT_SECRET: 'secret',
    MICROSOFT_REDIRECT_URI: 'https://app.example/callback',
  });
  let crypto: OAuthTokenCryptoService;
  let unavailable: boolean;
  let calls: Array<{ url: string; body: any }>;
  beforeEach(() => {
    crypto = new OAuthTokenCryptoService(config);
    unavailable = false;
    calls = [];
    global.fetch = jest.fn(async (url: any, options: any) => {
      if (!String(url).includes('vault.example')) {
        const data = {
          access_token: 'new-access',
          refresh_token: 'new-refresh',
          expires_in: 3600,
        };
        calls.push({ url: String(url), body: String(options.body) });
        return {
          ok: true,
          json: async () => data,
          text: async () => JSON.stringify(data),
        } as any;
      }
      if (unavailable) throw new Error('sensitive upstream error');
      const body = JSON.parse(options.body);
      calls.push({ url: String(url), body });
      // Fake Vault authenticates the context as well as ciphertext.
      if (body.plaintext)
        return {
          ok: true,
          json: async () => ({
            data: {
              ciphertext:
                'vault:v1:' +
                Buffer.from(
                  JSON.stringify([body.context, body.plaintext]),
                ).toString('base64'),
            },
          }),
        } as any;
      const [context, plaintext] = JSON.parse(
        Buffer.from(body.ciphertext.split(':')[2], 'base64').toString(),
      );
      return {
        ok: context === body.context,
        json: async () => ({ data: { plaintext } }),
      } as any;
    }) as any;
  });
  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('binds ciphertext to provider, user and field and rejects plaintext', async () => {
    const value = await crypto.encrypt(
      'secret',
      'google',
      'user',
      'accessToken',
    );
    expect(value).not.toContain('secret');
    expect(await crypto.decrypt(value, 'google', 'user', 'accessToken')).toBe(
      'secret',
    );
    await expect(
      crypto.decrypt(value, 'google', 'other', 'accessToken'),
    ).rejects.toThrow('key service unavailable');
    await expect(
      crypto.decrypt(value, 'microsoft', 'user', 'accessToken'),
    ).rejects.toThrow();
    await expect(
      crypto.decrypt(value, 'google', 'user', 'refreshToken'),
    ).rejects.toThrow();
    await expect(
      crypto.decrypt('plaintext', 'google', 'user', 'accessToken'),
    ).rejects.toThrow('encryption required');
  });

  it.each(['google', 'microsoft'] as const)(
    '%s refresh uses decrypted token and persists only ciphertext',
    async (provider) => {
      const token: any = {
        userId: 'user',
        expiresAt: new Date(0),
        accessToken: await crypto.encrypt(
          'old-access',
          provider,
          'user',
          'accessToken',
        ),
        refreshToken: await crypto.encrypt(
          'old-refresh',
          provider,
          'user',
          'refreshToken',
        ),
      };
      token.update = jest.fn(async (values) => Object.assign(token, values));
      token.save = jest.fn(async () => token);
      const model: any = { findOne: jest.fn(async () => token) };
      const Service = {
        google: GoogleAuthService,
        microsoft: MicrosoftAuthService,
      }[provider];
      const service = new Service(model, config, crypto);
      expect(await service.getValidAccessToken('user')).toBe('new-access');
      expect(token.accessToken).toMatch(/^vault:v1:/);
      expect(token.refreshToken).toMatch(/^vault:v1:/);
      expect(
        await crypto.decrypt(
          token.refreshToken,
          provider,
          'user',
          'refreshToken',
        ),
      ).toBe('new-refresh');
      expect(
        calls.find((call) => !call.url.includes('vault.example'))?.body,
      ).toContain('refresh_token=old-refresh');

      const stored = token.accessToken;
      token.expiresAt = new Date(0);
      token.update.mockClear();
      token.save.mockClear();
      unavailable = true;
      await expect(service.getValidAccessToken('user')).rejects.toThrow(
        'key service unavailable',
      );
      expect(token.accessToken).toBe(stored);
      expect(token.update).not.toHaveBeenCalled();
      expect(token.save).not.toHaveBeenCalled();
    },
  );

  it('fails closed on missing configuration, denied keys, invalid responses and encryption outages', async () => {
    await expect(
      new OAuthTokenCryptoService(new ConfigService()).encrypt(
        'secret',
        'google',
        'user',
        'accessToken',
      ),
    ).rejects.toThrow('key service unavailable');
    for (const response of [
      { ok: false },
      { ok: true, json: async () => ({ data: { ciphertext: 'plaintext' } }) },
    ]) {
      global.fetch = jest.fn().mockResolvedValue(response);
      await expect(
        crypto.encrypt('secret', 'google', 'user', 'accessToken'),
      ).rejects.toThrow('key service unavailable');
    }
    global.fetch = jest.fn().mockRejectedValue(new Error('private details'));
    await expect(
      crypto.encrypt('secret', 'google', 'user', 'accessToken'),
    ).rejects.toThrow('key service unavailable');
  });

  it.each(['google', 'microsoft'] as const)(
    '%s callback cannot write when encryption fails',
    async (provider) => {
      const model: any = {
        findOne: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
      };
      const Service = {
        google: GoogleAuthService,
        microsoft: MicrosoftAuthService,
      }[provider];
      const service = new Service(model, config, crypto);
      // Simulates failure encrypting the refresh token after encrypting access.
      jest
        .spyOn(crypto, 'encrypt')
        .mockResolvedValueOnce('vault:v1:YWNjZXNz')
        .mockRejectedValueOnce(new Error('key unavailable'));
      await expect(service.handleOAuthCallback('code', 'user')).rejects.toThrow(
        'key unavailable',
      );
      expect(model.create).not.toHaveBeenCalled();
      expect(model.upsert).not.toHaveBeenCalled();
    },
  );

  it.each(['google', 'microsoft'] as const)(
    '%s preserves existing refresh ciphertext when provider omits rotation',
    async (provider) => {
      const token: any = {
        userId: 'user',
        expiresAt: new Date(0),
        accessToken: await crypto.encrypt(
          'old-access',
          provider,
          'user',
          'accessToken',
        ),
        refreshToken: await crypto.encrypt(
          'old-refresh',
          provider,
          'user',
          'refreshToken',
        ),
      };
      const original = token.refreshToken;
      token.update = jest.fn(async (values) => Object.assign(token, values));
      token.save = jest.fn(async () => token);
      const model: any = { findOne: jest.fn(async () => token) };
      const Service = {
        google: GoogleAuthService,
        microsoft: MicrosoftAuthService,
      }[provider];
      const service = new Service(model, config, crypto);
      jest
        .spyOn(service as any, 'exchange')
        .mockResolvedValue({ access_token: 'new-access', expires_in: 3600 });
      expect(await service.getValidAccessToken('user')).toBe('new-access');
      expect(token.refreshToken).toBe(original);
    },
  );
});
