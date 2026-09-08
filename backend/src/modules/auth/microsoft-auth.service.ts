// microsoft/services/microsoft-auth.service.ts

import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { InjectModel } from '@nestjs/sequelize';

import { MicrosoftToken } from '../microsoft/models/microsoft_tokens.model';

import type { OAuthProviderService } from './oauth/oauth-provider.interface';

interface MicrosoftTokenResponse {
  token_type: string;
  scope: string;
  expires_in: number;
  access_token: string;
  refresh_token?: string;
}

@Injectable()
export class MicrosoftAuthService implements OAuthProviderService {
  private readonly tenantId: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  private readonly authorizeUrl: string;
  private readonly tokenUrl: string;

  private readonly scopes = [
    'openid',
    'profile',
    'email',
    'offline_access',
    'User.Read',
    'Files.ReadWrite',
  ];

  constructor(
    @InjectModel(MicrosoftToken)
    private readonly tokenModel: typeof MicrosoftToken,

    private readonly config: ConfigService,
  ) {
    this.tenantId = this.config.get<string>('MICROSOFT_TENANT_ID') || 'common';

    this.clientId = this.config.get<string>('MICROSOFT_CLIENT_ID') || '';

    this.clientSecret =
      this.config.get<string>('MICROSOFT_CLIENT_SECRET') || '';

    this.redirectUri = this.config.get<string>('MICROSOFT_REDIRECT_URI') || '';

    this.authorizeUrl =
      `https://login.microsoftonline.com/${this.tenantId}` +
      `/oauth2/v2.0/authorize`;

    this.tokenUrl =
      `https://login.microsoftonline.com/${this.tenantId}` +
      `/oauth2/v2.0/token`;

    if (!this.clientId) {
      throw new Error('MICROSOFT_CLIENT_ID is not configured');
    }

    if (!this.clientSecret) {
      throw new Error('MICROSOFT_CLIENT_SECRET is not configured');
    }

    if (!this.redirectUri) {
      throw new Error('MICROSOFT_REDIRECT_URI is not configured');
    }
  }

  /**
   * Build Microsoft OAuth authorization URL.
   */
  buildAuthorizationUrl(state: string, scopes: string[] = this.scopes): string {
    const params = new URLSearchParams({
      client_id: this.clientId,

      response_type: 'code',

      redirect_uri: this.redirectUri,

      response_mode: 'query',

      scope: scopes.join(' '),

      state,
    });

    return `${this.authorizeUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for Microsoft tokens.
   */
  async handleOAuthCallback(
    code: string,
    userId: string,
  ): Promise<MicrosoftToken> {
    const data = await this.exchange({
      code,

      grant_type: 'authorization_code',

      redirect_uri: this.redirectUri,
    });

    if (!data.access_token) {
      throw new InternalServerErrorException(
        'Microsoft did not return an access token',
      );
    }

    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    const existingToken = await this.tokenModel.findOne({
      where: { userId },
    });

    if (existingToken) {
      await existingToken.update({
        accessToken: data.access_token,

        refreshToken: data.refresh_token ?? existingToken.refreshToken,

        scope: data.scope,

        expiresAt,
      });

      return existingToken;
    }

    return this.tokenModel.create({
      userId,

      accessToken: data.access_token,

      refreshToken: data.refresh_token ?? null,

      scope: data.scope,

      expiresAt,
    } as any);
  }

  /**
   * Get a valid Microsoft access token.
   *
   * Automatically refreshes the token when it is
   * expired or about to expire.
   */
  async getValidAccessToken(userId: string): Promise<string> {
    const token = await this.tokenModel.findOne({
      where: { userId },
    });

    if (!token) {
      throw new UnauthorizedException('Microsoft account is not connected');
    }

    const expiresSoon = token.expiresAt.getTime() - Date.now() < 60_000;

    if (!expiresSoon) {
      return token.accessToken;
    }

    if (!token.refreshToken) {
      throw new UnauthorizedException(
        'Microsoft token expired. Please reconnect your Microsoft account.',
      );
    }

    const data = await this.exchange({
      refresh_token: token.refreshToken,

      grant_type: 'refresh_token',
    });

    if (!data.access_token) {
      throw new UnauthorizedException(
        'Microsoft token refresh failed. Please reconnect your account.',
      );
    }

    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    await token.update({
      accessToken: data.access_token,

      refreshToken: data.refresh_token ?? token.refreshToken,

      scope: data.scope || token.scope,

      expiresAt,
    });

    return data.access_token;
  }

  /**
   * Check whether the user has connected Microsoft.
   */
  async isConnected(userId: string): Promise<boolean> {
    const token = await this.tokenModel.findOne({
      where: { userId },
    });

    return !!token;
  }

  /**
   * Disconnect Microsoft account.
   */
  async disconnect(userId: string): Promise<void> {
    await this.tokenModel.destroy({
      where: { userId },
    });
  }

  /**
   * Exchange authorization code or refresh token.
   */
  private async exchange(
    body: Record<string, string>,
  ): Promise<MicrosoftTokenResponse> {
    const params = new URLSearchParams({
      client_id: this.clientId,

      client_secret: this.clientSecret,

      ...body,
    });

    const response = await fetch(this.tokenUrl, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },

      body: params.toString(),
    });

    const text = await response.text();

    if (!response.ok) {
      throw new BadRequestException(`Microsoft token request failed: ${text}`);
    }

    try {
      return JSON.parse(text) as MicrosoftTokenResponse;
    } catch {
      throw new InternalServerErrorException(
        'Invalid response from Microsoft token endpoint',
      );
    }
  }
}
