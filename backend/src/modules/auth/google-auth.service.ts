// google/services/google-auth.service.ts
import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { GoogleToken } from '../google/models/google-tokens.model';
import type { OAuthProviderService } from './oauth/oauth-provider.interface';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const DEFAULT_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/tasks',
];

@Injectable()
export class GoogleAuthService implements OAuthProviderService {
  constructor(
    @InjectModel(GoogleToken) private readonly tokenModel: typeof GoogleToken,
    private readonly config: ConfigService,
  ) {}

  buildAuthorizationUrl(
    state: string,
    scopes: string[] = DEFAULT_SCOPES,
  ): string {
    const params = new URLSearchParams({
      client_id: this.config.get('GOOGLE_CLIENT_ID')!,
      redirect_uri: this.config.get('GOOGLE_REDIRECT_URI')!,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes.join(' '),
      state,
    });
    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
  }

  async handleOAuthCallback(code: string, userId: string) {
    const data = await this.exchange({
      code,
      grant_type: 'authorization_code',
      redirect_uri: this.config.get('GOOGLE_REDIRECT_URI')!,
    });

    const expiresAt = new Date(Date.now() + data.expires_in * 1000);
    await this.tokenModel.upsert({
      userId,
      accessToken: data.access_token,
      // Google only returns refresh_token on first consent (or with prompt=consent).
      // Preserve the existing one on reconnect instead of overwriting with undefined.
      ...(data.refresh_token ? { refreshToken: data.refresh_token } : {}),
      scope: data.scope,
      expiresAt,
    } as any);

    return (await this.tokenModel.findOne({ where: { userId } }))!;
  }

  /** Returns a live access token, refreshing it first if it's expired or about to expire. */
  async getValidAccessToken(userId: string): Promise<string> {
    const token = await this.tokenModel.findOne({ where: { userId } });
    if (!token) throw new UnauthorizedException('Google account not connected');

    const isExpiringSoon = token.expiresAt.getTime() - Date.now() < 60_000; // 1 min buffer
    if (!isExpiringSoon) return token.accessToken;

    if (!token.refreshToken) {
      throw new UnauthorizedException(
        'Google token expired and no refresh token is available; reconnect required',
      );
    }

    const data = await this.exchange({
      refresh_token: token.refreshToken,
      grant_type: 'refresh_token',
    });

    const expiresAt = new Date(Date.now() + data.expires_in * 1000);
    await token.update({ accessToken: data.access_token, expiresAt });
    return data.access_token;
  }

  async isConnected(userId: string): Promise<boolean> {
    return !!(await this.tokenModel.findOne({ where: { userId } }));
  }

  async disconnect(userId: string): Promise<void> {
    await this.tokenModel.destroy({ where: { userId } });
  }

  private async exchange(body: Record<string, string>) {
    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.config.get('GOOGLE_CLIENT_ID')!,
        client_secret: this.config.get('GOOGLE_CLIENT_SECRET')!,
        ...body,
      }),
    });
    if (!res.ok) {
      throw new InternalServerErrorException(
        `Google token request failed: ${await res.text()}`,
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
