import { createCipheriv, createHash, randomBytes } from 'crypto';
import { Test } from '@nestjs/testing';
import { ClientLinkCrypto } from './client-link-crypto';
import { ClientPortalService } from './client-portal.service';

jest.mock('archiver', () => jest.fn());
jest.mock('../cdn/cdn.service', () => ({ CdnService: class {} }));
jest.mock('../engagement/notifications.service', () => ({
  NotificationsService: class {},
}));

const secret = () => randomBytes(32).toString('base64');
const config = () => ({
  CLIENT_LINK_KEY_ID: 'first',
  CLIENT_LINK_ENCRYPTION_SECRET: secret(),
});

describe('Client-link encryption', () => {
  it('keeps unreadable active links listed and revocable', async () => {
    const service: any = Object.create(ClientPortalService.prototype);
    Object.assign(service, {
      tokenCrypto: new ClientLinkCrypto(config()),
      select: jest.fn().mockResolvedValue([
        {
          id: 'existing',
          token_enc: 'unrecoverable',
          expires_at: new Date(Date.now() + 60_000),
          revoked_at: null,
        },
      ]),
      exec: jest.fn().mockResolvedValue(undefined),
    });
    const [link] = await service.listLinks(undefined);
    expect(link).toMatchObject({
      id: 'existing',
      state: 'active',
      redisplay_status: 'unavailable',
      url: null,
    });
    expect(await service.revokeLink('existing', { id: 'staff' })).toEqual({
      id: 'existing',
      state: 'revoked',
    });
    expect(service.exec).toHaveBeenCalledWith(
      expect.stringContaining('SET revoked_at'),
      ['staff', 'existing'],
    );
  });

  it('rejects missing/weak secrets even when JWT_SECRET exists', () => {
    expect(() => new ClientLinkCrypto({ JWT_SECRET: secret() })).toThrow();
    expect(
      () =>
        new ClientLinkCrypto({
          ...config(),
          CLIENT_LINK_ENCRYPTION_SECRET: '',
        }),
    ).toThrow('required');
    expect(
      () =>
        new ClientLinkCrypto({
          ...config(),
          CLIENT_LINK_ENCRYPTION_SECRET: 'weak',
        }),
    ).toThrow();
  });

  it('prevents service startup with missing configuration', async () => {
    const saved = process.env.CLIENT_LINK_ENCRYPTION_SECRET;
    delete process.env.CLIENT_LINK_ENCRYPTION_SECRET;
    try {
      await expect(
        Test.createTestingModule({
          providers: [
            {
              provide: ClientPortalService,
              useFactory: () =>
                new ClientPortalService({} as any, {} as any, {} as any),
            },
          ],
        }).compile(),
      ).rejects.toThrow();
    } finally {
      if (saved !== undefined)
        process.env.CLIENT_LINK_ENCRYPTION_SECRET = saved;
    }
  });

  it('uses random authenticated envelopes independent of JWT rotation', () => {
    const env = config();
    const crypto = new ClientLinkCrypto(env);
    const enc = crypto.encrypt('token');
    expect(enc).not.toBe(crypto.encrypt('token'));
    expect(
      new ClientLinkCrypto({ ...env, JWT_SECRET: 'changed' }).decrypt(enc),
    ).toBe('token');
    expect(crypto.decrypt(enc.replace('first', 'other'))).toBeNull();
    const parts = enc.split('.');
    parts[3] = randomBytes(16).toString('base64url');
    expect(crypto.decrypt(parts.join('.'))).toBeNull();
    expect(new ClientLinkCrypto(config()).decrypt(enc)).toBeNull();
    expect(crypto.decrypt('malformed')).toBeNull();
  });

  it('retains read access during rotation and rewraps without changing tokens', () => {
    const old = config();
    const token = 'existing-active-link';
    const enc = new ClientLinkCrypto(old).encrypt(token);
    const next = {
      CLIENT_LINK_KEY_ID: 'next',
      CLIENT_LINK_ENCRYPTION_SECRET: secret(),
    };
    const rotating = new ClientLinkCrypto({
      ...next,
      CLIENT_LINK_PREVIOUS_KEYS: JSON.stringify({
        first: old.CLIENT_LINK_ENCRYPTION_SECRET,
      }),
    });
    expect(rotating.decrypt(enc)).toBe(token);
    const migrated = rotating.encrypt(rotating.decrypt(enc)!);
    expect(migrated.startsWith('v1.next.')).toBe(true);
    expect(new ClientLinkCrypto(next).decrypt(migrated)).toBe(token);
    expect(new ClientLinkCrypto(next).decrypt(enc)).toBeNull();
  });

  it('reads legacy data only with an explicitly supplied key', () => {
    const key = createHash('sha256')
      .update('historical-test-material')
      .digest();
    const cipher = createCipheriv('aes-256-gcm', key, Buffer.alloc(12, 1));
    const data = Buffer.concat([cipher.update('legacy-token'), cipher.final()]);
    const enc = [Buffer.alloc(12, 1), cipher.getAuthTag(), data]
      .map((b) => b.toString('base64url'))
      .join('.');
    expect(new ClientLinkCrypto(config()).decrypt(enc)).toBeNull();
    const crypto = new ClientLinkCrypto({
      ...config(),
      CLIENT_LINK_LEGACY_KEY: key.toString('base64'),
    });
    expect(crypto.decrypt(enc)).toBe('legacy-token');
    expect(crypto.encrypt('new-token').startsWith('v1.')).toBe(true);
  });

  it('rejects malformed or ambiguous keyrings', () => {
    for (const value of ['bad', 'null', '[]', '{"first":"bad"}']) {
      expect(
        () =>
          new ClientLinkCrypto({
            ...config(),
            CLIENT_LINK_PREVIOUS_KEYS: value,
          }),
      ).toThrow();
    }
    expect(
      () =>
        new ClientLinkCrypto({ ...config(), CLIENT_LINK_LEGACY_KEY: 'bad' }),
    ).toThrow();
  });
});
