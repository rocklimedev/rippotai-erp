import { Body, Controller, Get, Headers, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { ClientPortalService } from './client-portal.service';

/** Staff side: client magic links, handover package, and the signed-in client's home. */
@Controller()
@UseGuards(JwtAuthGuard)
export class ClientPortalController {
  constructor(private readonly svc: ClientPortalService) {}

  @Post('client-links')
  create(@Body() dto: any, @CurrentUser() user: any, @Headers('origin') origin?: string) {
    return this.svc.createLink(dto, user, origin);
  }

  @Get('client-links')
  list(@Query('project_id') projectId?: string, @Headers('origin') origin?: string) {
    return this.svc.listLinks(projectId, origin);
  }

  @Post('client-links/:id/revoke')
  revoke(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.revokeLink(id, user);
  }

  @Get('projects/:id/client-responses')
  responses(@Param('id') id: string) {
    return this.svc.responses(id);
  }

  @Get('client-home')
  home(@CurrentUser() user: any, @Headers('origin') origin?: string) {
    return this.svc.clientHome(user, origin);
  }

  @Get('projects/:id/handover-package-status')
  handoverStatus(@Param('id') id: string) {
    return this.svc.handoverStatus(id);
  }

  @Post('projects/:id/handover/prepare-package')
  prepare(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.preparePackage(id, user);
  }

  @Post('projects/:id/handover/deliver')
  deliver(@Param('id') id: string, @Body() body: any, @CurrentUser() user: any, @Headers('origin') origin?: string) {
    return this.svc.deliver(id, body, user, origin);
  }
}

/** Public, token-only endpoints used by /client/:token (no login). */
@Controller('public/client/:token')
export class PublicClientController {
  constructor(private readonly svc: ClientPortalService) {}

  @Get()
  landing(@Param('token') token: string) {
    return this.svc.publicLanding(token);
  }

  @Get('boq/:boqId')
  boq(@Param('token') token: string, @Param('boqId') boqId: string) {
    return this.svc.publicBoq(token, boqId);
  }

  @Post('boq/:boqId/approve')
  approve(@Param('token') token: string, @Param('boqId') boqId: string, @Body() body: any) {
    return this.svc.publicBoqDecision(token, boqId, body);
  }

  @Get('quotations/compare/:cid')
  compare(@Param('token') token: string, @Param('cid') cid: string) {
    return this.svc.publicCompare(token, cid);
  }

  @Post('quotations/select')
  select(@Param('token') token: string, @Body() body: any) {
    return this.svc.publicSelectQuote(token, body);
  }

  @Get('handover')
  handover(@Param('token') token: string) {
    return this.svc.publicHandover(token);
  }

  @Post('handover/accept')
  accept(@Param('token') token: string, @Body() body: any) {
    return this.svc.publicHandoverAccept(token, body);
  }

  @Post('handover/snag')
  snag(@Param('token') token: string, @Body() body: any) {
    return this.svc.publicSnag(token, body);
  }
}
