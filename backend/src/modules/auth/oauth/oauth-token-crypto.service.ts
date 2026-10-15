import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type TokenProvider = 'google' | 'microsoft';
export type TokenField = 'accessToken' | 'refreshToken';

/** Vault holds the non-exportable, derived AES-GCM key; DB stores ciphertext only. */
@Injectable()
export class OAuthTokenCryptoService {
  constructor(private readonly config: ConfigService) {}

  async encrypt(
    value: string,
    provider: TokenProvider,
    userId: string,
    field: TokenField,
  ): Promise<string> {
    if (!value)
      throw new ServiceUnavailableException('OAuth token encryption failed');
    return this.request(
      'encrypt',
      { plaintext: Buffer.from(value).toString('base64') },
      provider,
      userId,
      field,
    );
  }

  async decrypt(
    value: string,
    provider: TokenProvider,
    userId: string,
    field: TokenField,
  ): Promise<string> {
    if (!/^vault:v\d+:[A-Za-z0-9+/=]+$/.test(value)) {
      throw new ServiceUnavailableException('OAuth token encryption required');
    }
    const plaintext = await this.request(
      'decrypt',
      { ciphertext: value },
      provider,
      userId,
      field,
    );
    return Buffer.from(plaintext, 'base64').toString('utf8');
  }

  private async request(
    operation: 'encrypt' | 'decrypt',
    body: Record<string, string>,
    provider: TokenProvider,
    userId: string,
    field: TokenField,
  ): Promise<string> {
    try {
      const address = new URL(
        this.config.getOrThrow<string>('OAUTH_VAULT_ADDR'),
      );
      if (
        address.protocol !== 'https:' ||
        address.username ||
        address.password ||
        address.search ||
        address.hash
      )
        throw new Error();
      const key = this.config.getOrThrow<string>('OAUTH_VAULT_KEY');
      if (!/^[a-zA-Z0-9_-]+$/.test(key)) throw new Error();
      const response = await fetch(
        `${address.toString().replace(/\/$/, '')}/v1/transit/${operation}/${key}`,
        {
          method: 'POST',
          redirect: 'error',
          signal: AbortSignal.timeout(5000),
          headers: {
            'Content-Type': 'application/json',
            'X-Vault-Token':
              this.config.getOrThrow<string>('OAUTH_VAULT_TOKEN'),
          },
          body: JSON.stringify({
            ...body,
            context: Buffer.from(
              JSON.stringify(['oauth', provider, userId, field]),
            ).toString('base64'),
          }),
        },
      );
      if (!response.ok) throw new Error();
      const result = (await response.json()) as {
        data?: { ciphertext?: string; plaintext?: string };
      };
      const value =
        operation === 'encrypt'
          ? result.data?.ciphertext
          : result.data?.plaintext;
      if (
        !value ||
        (operation === 'encrypt' && !/^vault:v\d+:[A-Za-z0-9+/=]+$/.test(value))
      )
        throw new Error();
      return value;
    } catch {
      // Never attach Vault responses, credentials, ciphertext or provider tokens.
      throw new ServiceUnavailableException(
        'OAuth token key service unavailable',
      );
    }
  }
}
