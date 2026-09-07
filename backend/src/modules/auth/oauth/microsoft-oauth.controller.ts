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
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import type { RequestWithUser } from '@/common/interfaces/request-with-user-interfaces';
import { MicrosoftAuthService } from '../microsoft-auth.service';
import { OAuthStateService } from './oauth-state.service';

@Controller('auth/microsoft')
export class MicrosoftOAuthController {
  constructor(
    private readonly microsoftAuthService: MicrosoftAuthService,
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
    const state = this.oauthState.sign({ userId, provider: 'microsoft' });
    const scopeList = scopes ? scopes.split(',') : undefined;
    return res.redirect(
      this.microsoftAuthService.buildAuthorizationUrl(state, scopeList),
    );
  }

  // Public: Microsoft redirects here with no auth headers. Trust only the signed state.
  @Get('callback')
  async callback(@Query('code') code: string, @Query('state') state: string) {
    if (!code || !state) throw new BadRequestException('Missing code or state');
    const { userId, provider } = this.oauthState.verify(state);
    if (provider !== 'microsoft')
      throw new BadRequestException('Invalid state');
    const token = await this.microsoftAuthService.handleOAuthCallback(
      code,
      userId,
    );
    return { connected: true, userId: token.userId, scope: token.scope };
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  async status(@Req() req: RequestWithUser) {
    return {
      connected: await this.microsoftAuthService.isConnected(req.user.id),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  async disconnect(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    await this.microsoftAuthService.disconnect(userId);
    return { disconnected: true, userId };
  }
}
