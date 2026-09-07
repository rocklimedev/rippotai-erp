// auth/oauth/zoho-oauth.controller.ts

import {
  Controller,
  Get,
  Delete,
  Query,
  Req,
  BadRequestException,
} from '@nestjs/common';

import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { UseGuards } from '@nestjs/common';

import type { RequestWithUser } from '@/common/interfaces/request-with-user-interfaces';

import { ZohoAuthService } from '../zoho-auth.service';
import { OAuthStateService } from './oauth-state.service';

@Controller('auth/zoho')
export class ZohoOAuthController {
  constructor(
    private readonly zohoAuthService: ZohoAuthService,
    private readonly oauthState: OAuthStateService,
  ) {}

  /**
   * Authenticated API endpoint.
   *
   * The frontend calls this using the normal RTK Query request,
   * which includes Authorization: Bearer <JWT>.
   *
   * We return the Zoho URL instead of redirecting from this endpoint.
   */
  @UseGuards(JwtAuthGuard)
  @Get('authorize-url')
  authorizeUrl(@Req() req: RequestWithUser, @Query('scopes') scopes?: string) {
    const userId = req.user.id;

    const state = this.oauthState.sign({
      userId,
      provider: 'zoho',
    });

    const scopeList = scopes
      ? scopes.split(',').map((scope) => scope.trim())
      : undefined;

    const authorizationUrl = this.zohoAuthService.buildAuthorizationUrl(
      state,
      scopeList,
    );

    return {
      authorizationUrl,
    };
  }

  /**
   * Zoho redirects here.
   *
   * This endpoint MUST remain public because Zoho does not send
   * your application's JWT Authorization header.
   */
  @Get('callback')
  async callback(@Query('code') code: string, @Query('state') state: string) {
    if (!code || !state) {
      throw new BadRequestException('Missing code or state');
    }

    const { userId, provider } = this.oauthState.verify(state);

    if (provider !== 'zoho') {
      throw new BadRequestException('Invalid OAuth provider');
    }

    const token = await this.zohoAuthService.handleOAuthCallback(code, userId);

    return {
      connected: true,
      userId: token.userId,
      scope: token.scope,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  async status(@Req() req: RequestWithUser) {
    return {
      connected: await this.zohoAuthService.isConnected(req.user.id),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  async disconnect(@Req() req: RequestWithUser) {
    const userId = req.user.id;

    await this.zohoAuthService.disconnect(userId);

    return {
      disconnected: true,
      userId,
    };
  }
}
