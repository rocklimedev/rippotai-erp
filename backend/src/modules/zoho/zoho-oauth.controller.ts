import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ZohoAuthService } from './services/zoho-auth.service';

@Controller('zoho/oauth')
export class ZohoOAuthController {
  constructor(private readonly zohoAuthService: ZohoAuthService) {}

  /**
   * Send the user here to start the consent flow, e.g.:
   *   GET /zoho/oauth/authorize?ownerKey=user_123
   *   GET /zoho/oauth/authorize?ownerKey=user_123&scopes=WorkDrive.files.ALL,ZohoCRM.modules.ALL
   */
  @Get('authorize')
  authorize(
    @Query('ownerKey') ownerKey: string,
    @Query('scopes') scopes: string,
    @Res() res: Response,
  ) {
    if (!ownerKey)
      throw new BadRequestException('ownerKey query param is required');
    const scopeList = scopes ? scopes.split(',') : undefined;
    const url = this.zohoAuthService.buildAuthorizationUrl(ownerKey, scopeList);
    return res.redirect(url);
  }

  /** Must match ZOHO_REDIRECT_URI exactly, including this path. */
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') ownerKey: string,
  ) {
    if (!code || !ownerKey)
      throw new BadRequestException('Missing code or state');
    const token = await this.zohoAuthService.handleOAuthCallback(
      code,
      ownerKey,
    );
    return { connected: true, ownerKey: token.ownerKey, scope: token.scope };
  }

  @Get('status/:ownerKey')
  async status(@Param('ownerKey') ownerKey: string) {
    return {
      ownerKey,
      connected: await this.zohoAuthService.isConnected(ownerKey),
    };
  }

  @Delete(':ownerKey')
  async disconnect(@Param('ownerKey') ownerKey: string) {
    await this.zohoAuthService.disconnect(ownerKey);
    return { disconnected: true, ownerKey };
  }
}
