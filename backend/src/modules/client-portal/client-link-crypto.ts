import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from 'crypto';

/** Versioned envelopes; previous keys are read-only and never selected for writes. */
export class ClientLinkCrypto {
  private readonly keys = new Map<string, Buffer>();
  private readonly id: string;
  private readonly legacyKey?: Buffer;

  constructor(env: NodeJS.ProcessEnv = process.env) {
    this.id = env.CLIENT_LINK_KEY_ID || '';
    if (!/^[a-zA-Z0-9_-]{1,32}$/.test(this.id)) {
      throw new Error(
        'CLIENT_LINK_KEY_ID is required (1-32 letters, digits, underscores or hyphens)',
      );
    }
    const derive = (secret: unknown): Buffer => {
      if (
        typeof secret !== 'string' ||
        !/^[A-Za-z0-9+/]{43}=$/.test(secret) ||
        Buffer.from(secret, 'base64').length !== 32
      ) {
        throw new Error(
          'Client-link secrets must be base64-encoded 32 random bytes',
        );
      }
      return Buffer.from(
        hkdfSync(
          'sha256',
          Buffer.from(secret, 'base64'),
          'rippotai:client-links:v1',
          'token-encryption:aes-256-gcm',
          32,
        ),
      );
    };
    if (!env.CLIENT_LINK_ENCRYPTION_SECRET)
      throw new Error('CLIENT_LINK_ENCRYPTION_SECRET is required');
    this.keys.set(this.id, derive(env.CLIENT_LINK_ENCRYPTION_SECRET));
    let previous: unknown;
    try {
      previous = JSON.parse(env.CLIENT_LINK_PREVIOUS_KEYS || '{}');
    } catch {
      throw new Error('CLIENT_LINK_PREVIOUS_KEYS must be a JSON object');
    }
    if (!previous || typeof previous !== 'object' || Array.isArray(previous))
      throw new Error('CLIENT_LINK_PREVIOUS_KEYS must be a JSON object');
    for (const [id, secret] of Object.entries(previous)) {
      if (!/^[a-zA-Z0-9_-]{1,32}$/.test(id) || this.keys.has(id))
        throw new Error('Invalid or duplicate client-link key ID');
      this.keys.set(id, derive(secret));
    }
    if (env.CLIENT_LINK_LEGACY_KEY) {
      const value = env.CLIENT_LINK_LEGACY_KEY;
      if (
        !/^[A-Za-z0-9+/]{43}=$/.test(value) ||
        Buffer.from(value, 'base64').length !== 32
      )
        throw new Error(
          'CLIENT_LINK_LEGACY_KEY must be a base64-encoded 32-byte key',
        );
      this.legacyKey = Buffer.from(value, 'base64');
    }
  }

  encrypt(token: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.keys.get(this.id)!, iv);
    cipher.setAAD(Buffer.from(`v1.${this.id}`));
    const ciphertext = Buffer.concat([
      cipher.update(token, 'utf8'),
      cipher.final(),
    ]);
    return [
      'v1',
      this.id,
      ...[iv, cipher.getAuthTag(), ciphertext].map((b) =>
        b.toString('base64url'),
      ),
    ].join('.');
  }

  decrypt(value: string | null): string | null {
    if (!value) return null;
    try {
      const parts = value.split('.');
      const versioned = parts.length === 5 && parts[0] === 'v1';
      if (!versioned && parts.length !== 3) return null;
      const key = versioned ? this.keys.get(parts[1]) : this.legacyKey;
      if (!key) return null;
      const [iv, tag, ciphertext] = (versioned ? parts.slice(2) : parts).map(
        (p) => {
          if (!/^[A-Za-z0-9_-]+$/.test(p)) throw new Error('Invalid envelope');
          return Buffer.from(p, 'base64url');
        },
      );
      if (iv.length !== 12 || tag.length !== 16) return null;
      const decipher = createDecipheriv('aes-256-gcm', key, iv);
      if (versioned) decipher.setAAD(Buffer.from(`v1.${parts[1]}`));
      decipher.setAuthTag(tag);
      return Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]).toString('utf8');
    } catch {
      return null;
    }
  }
}
