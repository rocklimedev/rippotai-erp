// microsoft/services/microsoft-auth.service.ts
import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { MicrosoftToken } from '../microsoft/models/microsoft_tokens.model';

import type { OAuthProviderService } from './oauth/oauth-provider.interface';

const TENANT = 'common'; // use a specific tenant id instead if you only support work/school accounts
const MS_AUTH_URL = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/authorize`;
const MS_TOKEN_URL = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`;
const DEFAULT_SCOPES = ['Files.ReadWrite', 'offline_access', 'User.Read'];

@Injectable()
export class MicrosoftAuthService implements OAuthProviderService {
  constructor(
    @InjectModel(MicrosoftToken)
    private readonly tokenModel: typeof MicrosoftToken,
    private readonly config: ConfigService,
  ) {}

  buildAuthorizationUrl(
    state: string,
    scopes: string[] = DEFAULT_SCOPES,
  ): string {
    const params = new URLSearchParams({
      client_id: this.config.get('MICROSOFT_CLIENT_ID')!,
      redirect_uri: this.config.get('MICROSOFT_REDIRECT_URI')!,
      response_type: 'code',
      response_mode: 'query',
      scope: scopes.join(' '),
      state,
    });
    return `${MS_AUTH_URL}?${params.toString()}`;
  }

  async handleOAuthCallback(code: string, userId: string) {
    const data = await this.exchange({
      code,
      grant_type: 'authorization_code',
      redirect_uri: this.config.get('MICROSOFT_REDIRECT_URI')!,
    });

    const expiresAt = new Date(Date.now() + data.expires_in * 1000);
    await this.tokenModel.upsert({
      userId,
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? null, // MS returns a new one on every refresh too
      scope: data.scope,
      expiresAt,
    } as any);

    return (await this.tokenModel.findOne({ where: { userId } }))!;
  }

  async getValidAccessToken(userId: string): Promise<string> {
    const token = await this.tokenModel.findOne({ where: { userId } });
    if (!token)
      throw new UnauthorizedException('Microsoft account not connected');

    const isExpiringSoon = token.expiresAt.getTime() - Date.now() < 60_000;
    if (!isExpiringSoon) return token.accessToken;

    if (!token.refreshToken) {
      throw new UnauthorizedException(
        'Microsoft token expired and no refresh token is available; reconnect required',
      );
    }

    const data = await this.exchange({
      refresh_token: token.refreshToken,
      grant_type: 'refresh_token',
    });

    const expiresAt = new Date(Date.now() + data.expires_in * 1000);
    // Microsoft rotates refresh tokens on every use — always persist the new one.
    await token.update({
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? token.refreshToken,
      expiresAt,
    });
    return data.access_token;
  }

  async isConnected(userId: string): Promise<boolean> {
    return !!(await this.tokenModel.findOne({ where: { userId } }));
  }

  async disconnect(userId: string): Promise<void> {
    await this.tokenModel.destroy({ where: { userId } });
  }

  private async exchange(body: Record<string, string>) {
    const res = await fetch(MS_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.config.get('MICROSOFT_CLIENT_ID')!,
        client_secret: this.config.get('MICROSOFT_CLIENT_SECRET')!,
        ...body,
      }),
    });
    if (!res.ok) {
      throw new InternalServerErrorException(
        `Microsoft token request failed: ${await res.text()}`,
      );
    }
    return res.json() as Promise<{
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope: string;
    }>;
  }
}
