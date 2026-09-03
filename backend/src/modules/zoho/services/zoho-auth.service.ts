import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import axios from 'axios';

import { ZohoToken } from '../models/zoho-token.model';
import { ZohoTokenResponse } from '../../../common/interfaces/zoho-token-response.interface';

@Injectable()
export class ZohoAuthService {
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
   * ownerKey is round-tripped through the state parameter so the
   * callback knows which app-side user/org this connection belongs to.
   *
   * Extra scopes can be supplied when a new Zoho service needs
   * permissions beyond the configured defaults.
   */
  buildAuthorizationUrl(ownerKey: string, scopes?: string[]): string {
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
      state: ownerKey,
    });

    return `${this.accountsBaseUrl}/oauth/v2/auth?${params.toString()}`;
  }

  // ============================================================
  // OAUTH CALLBACK
  // ============================================================

  /**
   * Exchanges an authorization code for tokens and persists them.
   */
  async handleOAuthCallback(
    code: string,
    ownerKey: string,
  ): Promise<ZohoToken> {
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
      where: { ownerKey },
    });

    if (!token) {
      token = await this.zohoTokenModel.create({
        ownerKey,
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
        `No refresh token stored for "${token.ownerKey}". ` +
          'Re-authorize via /zoho/oauth/authorize.',
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
   * Returns a token guaranteed to be valid for the next minute.
   *
   * Automatically refreshes the token if it is expired or
   * within one minute of expiry.
   */
  async getValidToken(ownerKey: string): Promise<ZohoToken> {
    const token = await this.zohoTokenModel.findOne({
      where: { ownerKey },
    });

    if (!token) {
      throw new BadRequestException(
        `No Zoho connection found for "${ownerKey}". ` +
          'Authorize first via /zoho/oauth/authorize.',
      );
    }

    const oneMinuteMs = 60_000;

    if (token.expiresAt.getTime() - oneMinuteMs <= Date.now()) {
      this.logger.debug(
        `Access token for "${ownerKey}" ` +
          'expired/near-expiry, refreshing...',
      );

      return this.refreshAccessToken(token);
    }

    return token;
  }

  // ============================================================
  // CONNECTION STATUS
  // ============================================================

  async isConnected(ownerKey: string): Promise<boolean> {
    return (
      (await this.zohoTokenModel.count({
        where: { ownerKey },
      })) > 0
    );
  }

  // ============================================================
  // DISCONNECT
  // ============================================================

  async disconnect(ownerKey: string): Promise<void> {
    await this.zohoTokenModel.destroy({
      where: { ownerKey },
    });
  }
}
