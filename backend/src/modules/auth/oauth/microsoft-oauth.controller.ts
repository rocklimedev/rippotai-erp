// auth/oauth/microsoft-oauth.controller.ts

import {
  Controller,
  Get,
  Delete,
  Query,
  Res,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';

import type { Response } from 'express';

import { ConfigService } from '@nestjs/config';

import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';

import type { RequestWithUser } from '@/common/interfaces/request-with-user-interfaces';

import { MicrosoftAuthService } from '../microsoft-auth.service';

import { OAuthStateService } from './oauth-state.service';

@Controller('auth/microsoft')
export class MicrosoftOAuthController {
  constructor(
    private readonly microsoftAuthService: MicrosoftAuthService,

    private readonly oauthState: OAuthStateService,

    private readonly config: ConfigService,
  ) {}

  /**
   * Start Microsoft OAuth.
   *
   * GET:
   * /auth/microsoft/authorize
   */
  @UseGuards(JwtAuthGuard)
  @Get('authorize')
  authorize(
    @Req() req: RequestWithUser,
    @Query('scopes') scopes: string | undefined,
    @Res() res: Response,
  ) {
    const userId = req.user.id;

    const state = this.oauthState.sign({
      userId,
      provider: 'microsoft',
    });

    const scopeList = scopes
      ? scopes
          .split(',')
          .map((scope) => scope.trim())
          .filter(Boolean)
      : undefined;

    const authorizationUrl = this.microsoftAuthService.buildAuthorizationUrl(
      state,
      scopeList,
    );

    return res.redirect(authorizationUrl);
  }
  // auth/oauth/microsoft-oauth.controller.ts

  /**
   * Return the Microsoft OAuth URL as JSON (JWT-protected).
   * The frontend calls this via RTK Query (Authorization header
   * is sent normally), then does window.location.assign() with
   * the URL it gets back — mirrors Google/Zoho.
   *
   * GET /auth/microsoft/authorize-url
   */
  @UseGuards(JwtAuthGuard)
  @Get('authorize-url')
  authorizeUrl(
    @Req() req: RequestWithUser,
    @Query('scopes') scopes: string | undefined,
  ) {
    const userId = req.user.id;

    const state = this.oauthState.sign({
      userId,
      provider: 'microsoft',
    });

    const scopeList = scopes
      ? scopes
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;

    const authorizationUrl = this.microsoftAuthService.buildAuthorizationUrl(
      state,
      scopeList,
    );

    return { authorizationUrl };
  }
  /**
   * Microsoft OAuth callback.
   *
   * Microsoft calls this endpoint directly.
   *
   * DO NOT require JWT here because the browser
   * redirect will not contain your INOS JWT.
   */
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error?: string,
    @Query('error_description')
    errorDescription?: string,
    @Res() res?: Response,
  ) {
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') || 'http://localhost:5000';

    /**
     * User denied consent.
     */
    if (error) {
      return res!.redirect(
        `${frontendUrl}/settings/connectors?` +
          new URLSearchParams({
            microsoft: 'error',
            message: errorDescription || error,
          }).toString(),
      );
    }

    if (!code || !state) {
      throw new BadRequestException('Missing Microsoft OAuth code or state');
    }

    /**
     * Verify signed state.
     */
    const { userId, provider } = this.oauthState.verify(state);

    if (provider !== 'microsoft') {
      throw new BadRequestException('Invalid Microsoft OAuth state');
    }

    /**
     * Exchange authorization code.
     */
    await this.microsoftAuthService.handleOAuthCallback(code, userId);

    /**
     * Redirect user back to INOS.
     */
    return res!.redirect(
      `${frontendUrl}/settings/connectors?microsoft=connected`,
    );
  }

  /**
   * Check Microsoft connection.
   */
  @UseGuards(JwtAuthGuard)
  @Get('status')
  async status(@Req() req: RequestWithUser) {
    return {
      connected: await this.microsoftAuthService.isConnected(req.user.id),
    };
  }

  /**
   * Disconnect Microsoft.
   */
  @UseGuards(JwtAuthGuard)
  @Delete()
  async disconnect(@Req() req: RequestWithUser) {
    const userId = req.user.id;

    await this.microsoftAuthService.disconnect(userId);

    return {
      disconnected: true,
      userId,
    };
  }
}
