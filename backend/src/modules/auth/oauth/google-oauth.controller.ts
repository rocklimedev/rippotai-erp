// auth/oauth/google-oauth.controller.ts
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
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import type { RequestWithUser } from '@/common/interfaces/request-with-user-interfaces';
import { GoogleAuthService } from '../google-auth.service';
import { OAuthStateService } from './oauth-state.service';

@Controller('auth/google')
export class GoogleOAuthController {
  constructor(
    private readonly googleAuthService: GoogleAuthService,
    private readonly oauthState: OAuthStateService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('authorize')
  authorize(
    @Req() req: RequestWithUser,
    @Query('scopes') scopes: string,
    @Res() res: Response,
  ) {
    const userId = req.user.id;
    const state = this.oauthState.sign({ userId, provider: 'google' });
    const scopeList = scopes ? scopes.split(',') : undefined;
    return res.redirect(
      this.googleAuthService.buildAuthorizationUrl(state, scopeList),
    );
  }

  // Public: Google redirects here with no auth headers, so no guard —
  // trust only the signed state, never req.user.
  @Get('callback')
  async callback(@Query('code') code: string, @Query('state') state: string) {
    if (!code || !state) throw new BadRequestException('Missing code or state');
    const { userId, provider } = this.oauthState.verify(state);
    if (provider !== 'google') throw new BadRequestException('Invalid state');
    const token = await this.googleAuthService.handleOAuthCallback(
      code,
      userId,
    );
    return { connected: true, userId: token.userId, scope: token.scope };
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  async status(@Req() req: RequestWithUser) {
    return { connected: await this.googleAuthService.isConnected(req.user.id) };
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  async disconnect(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    await this.googleAuthService.disconnect(userId);
    return { disconnected: true, userId };
  }
}
