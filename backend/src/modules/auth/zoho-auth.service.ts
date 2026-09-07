// zoho/services/zoho-auth.service.ts
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import axios from 'axios';
import { ZohoToken } from '../zoho/models/zoho-token.model';
import { ZohoTokenResponse } from '@/common/interfaces/zoho-token-response.interface';
import type { RefreshableOAuthProviderService } from './oauth/oauth-provider.interface';

@Injectable()
export class ZohoAuthService implements RefreshableOAuthProviderService {
  private readonly logger = new Logger(ZohoAuthService.name);

  constructor(
    @InjectModel(ZohoToken)
    private readonly zohoTokenModel: typeof ZohoToken,
    private readonly configService: ConfigService,
  ) {}

  // ============================================================
  // CONFIG
  // ============================================================

  private get clientId(): string {
    return this.configService.getOrThrow<string>('zoho.clientId');
  }

  private get clientSecret(): string {
    return this.configService.getOrThrow<string>('zoho.clientSecret');
  }

  private get redirectUri(): string {
    return this.configService.getOrThrow<string>('zoho.redirectUri');
  }

  private get accountsBaseUrl(): string {
    return this.configService.getOrThrow<string>('zoho.accountsBaseUrl');
  }

  private get defaultScopes(): string[] {
    return this.configService.get<string[]>('zoho.defaultScopes') ?? [];
  }

  // ============================================================
  // AUTHORIZATION URL
  // ============================================================

  /**
   * Builds the URL to send the user's browser to for consent.
   *
   * `state` is a signed token (from OAuthStateService) that round-trips
   * the userId + provider through Zoho's redirect — never a raw userId.
   *
   * Extra scopes can be supplied when a new Zoho service needs
   * permissions beyond the configured defaults.
   */
  buildAuthorizationUrl(state: string, scopes?: string[]): string {
    const selectedScopes = scopes?.length ? scopes : this.defaultScopes;

    if (!selectedScopes.length) {
      throw new BadRequestException(
        'No Zoho OAuth scopes have been configured.',
      );
    }

    const scopeList = selectedScopes.join(',');

    const params = new URLSearchParams({
      scope: scopeList,
      client_id: this.clientId,
      response_type: 'code',
      access_type: 'offline',
      redirect_uri: this.redirectUri,
      prompt: 'consent',
      state,
    });

    return `${this.accountsBaseUrl}/oauth/v2/auth?${params.toString()}`;
  }

  // ============================================================
  // OAUTH CALLBACK
  // ============================================================

  /**
   * Exchanges an authorization code for tokens and persists them
   * against the given userId (already resolved + verified from state
   * by the controller before this is called).
   */
  async handleOAuthCallback(code: string, userId: string): Promise<ZohoToken> {
    const { data } = await axios.post<ZohoTokenResponse>(
      `${this.accountsBaseUrl}/oauth/v2/token`,
      null,
      {
        params: {
          code,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: this.redirectUri,
          grant_type: 'authorization_code',
        },
      },
    );

    if (!data.access_token) {
      this.logger.error(`Zoho token exchange failed: ${JSON.stringify(data)}`);

      throw new BadRequestException('Failed to obtain access token from Zoho');
    }

    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    let token = await this.zohoTokenModel.findOne({
      where: { userId },
    });

    if (!token) {
      token = await this.zohoTokenModel.create({
        userId,
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? null,
        apiDomain: data.api_domain ?? null,
        scope: data.scope ?? null,
        expiresAt,
      });
    } else {
      token.accessToken = data.access_token;

      token.apiDomain = data.api_domain ?? token.apiDomain;

      token.scope = data.scope ?? token.scope;

      token.expiresAt = expiresAt;

      // Zoho may only return refresh_token during
      // the initial authorization.
      if (data.refresh_token) {
        token.refreshToken = data.refresh_token;
      }

      await token.save();
    }

    return token;
  }

  // ============================================================
  // REFRESH TOKEN
  // ============================================================

  private async refreshAccessToken(token: ZohoToken): Promise<ZohoToken> {
    if (!token.refreshToken) {
      throw new BadRequestException(
        `No refresh token stored for user "${token.userId}". ` +
          'Re-authorize via /auth/zoho/authorize.',
      );
    }

    const { data } = await axios.post<ZohoTokenResponse>(
      `${this.accountsBaseUrl}/oauth/v2/token`,
      null,
      {
        params: {
          refresh_token: token.refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token',
        },
      },
    );

    if (!data.access_token) {
      this.logger.error(`Zoho token refresh failed: ${JSON.stringify(data)}`);

      throw new BadRequestException('Failed to refresh Zoho access token');
    }

    token.accessToken = data.access_token;

    token.apiDomain = data.api_domain ?? token.apiDomain;

    token.expiresAt = new Date(Date.now() + data.expires_in * 1000);

    await token.save();

    return token;
  }

  // ============================================================
  // GET VALID TOKEN
  // ============================================================

  /**
   * Returns an access token guaranteed to be valid for the next minute,
   * automatically refreshing it first if expired or near-expiry.
   *
   * Named getValidAccessToken (not getValidToken) and returns a plain
   * string to match RefreshableOAuthProviderService, same shape as
   * GoogleAuthService/MicrosoftAuthService.
   */
  async getValidAccessToken(userId: string): Promise<string> {
    const token = await this.zohoTokenModel.findOne({
      where: { userId },
    });

    if (!token) {
      throw new BadRequestException(
        `No Zoho connection found for this user. ` +
          'Authorize first via /auth/zoho/authorize.',
      );
    }

    const oneMinuteMs = 60_000;

    if (token.expiresAt.getTime() - oneMinuteMs <= Date.now()) {
      this.logger.debug(
        `Access token for user "${userId}" expired/near-expiry, refreshing...`,
      );

      const refreshed = await this.refreshAccessToken(token);
      return refreshed.accessToken;
    }

    return token.accessToken;
  }
  /**
   * Returns the Zoho-assigned api_domain for this user (varies by
   * data center, e.g. www.zohoapis.com vs www.zohoapis.eu). Used by
   * ZohoHttpService to default the axios baseURL.
   */
  async getApiDomain(userId: string): Promise<string | null> {
    const token = await this.zohoTokenModel.findOne({
      where: { userId },
      attributes: ['apiDomain'],
    });
    return token?.apiDomain ?? null;
  }
  // ============================================================
  // CONNECTION STATUS
  // ============================================================

  async isConnected(userId: string): Promise<boolean> {
    return (
      (await this.zohoTokenModel.count({
        where: { userId },
      })) > 0
    );
  }

  // ============================================================
  // DISCONNECT
  // ============================================================

  async disconnect(userId: string): Promise<void> {
    await this.zohoTokenModel.destroy({
      where: { userId },
    });
  }
}
