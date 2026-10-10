import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import { Public } from '@/common/decorator/public.decorator';
import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { ClientPortalService } from './client-portal.service';

/** Staff side: client magic links, handover package, and the signed-in client's home. */
@Controller()
@UseGuards(JwtAuthGuard)
export class ClientPortalController {
  constructor(private readonly svc: ClientPortalService) {}

  @RequirePermission('client-portal:create')
  @Post('client-links')
  create(
    @Body() dto: any,
    @CurrentUser() user: any,
    @Headers('origin') origin?: string,
  ) {
    return this.svc.createLink(dto, user, origin);
  }

  @RequirePermission('client-portal:read')
  @Get('client-links')
  list(
    @Query('project_id') projectId?: string,
    @Headers('origin') origin?: string,
  ) {
    return this.svc.listLinks(projectId, origin);
  }

  @RequirePermission('client-portal:revoke')
  @Post('client-links/:id/revoke')
  revoke(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.revokeLink(id, user);
  }

  @RequirePermission('client-portal:read')
  @Get('projects/:id/client-responses')
  responses(@Param('id') id: string) {
    return this.svc.responses(id);
  }

  @RequirePermission('client-home:read-own')
  @Get('client-home')
  home(@CurrentUser() user: any, @Headers('origin') origin?: string) {
    return this.svc.clientHome(user, origin);
  }

  @RequirePermission('client-portal:read')
  @Get('projects/:id/handover-package-status')
  handoverStatus(@Param('id') id: string) {
    return this.svc.handoverStatus(id);
  }

  @RequirePermission('client-portal:prepare')
  @Post('projects/:id/handover/prepare-package')
  prepare(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.preparePackage(id, user);
  }

  @RequirePermission('client-portal:deliver')
  @Post('projects/:id/handover/deliver')
  deliver(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: any,
    @Headers('origin') origin?: string,
  ) {
    return this.svc.deliver(id, body, user, origin);
  }
}

/** Public, token-only endpoints used by /client/:token (no login). */
@Controller('public/client/:token')
export class PublicClientController {
  constructor(private readonly svc: ClientPortalService) {}

  @RequirePermission('client-token:read')
  @Public()
  @Get()
  landing(@Param('token') token: string) {
    return this.svc.publicLanding(token);
  }

  @RequirePermission('client-token:read')
  @Public()
  @Get('boq/:boqId')
  boq(@Param('token') token: string, @Param('boqId') boqId: string) {
    return this.svc.publicBoq(token, boqId);
  }

  @RequirePermission('client-token:approve')
  @Public()
  @Post('boq/:boqId/approve')
  approve(
    @Param('token') token: string,
    @Param('boqId') boqId: string,
    @Body() body: any,
  ) {
    return this.svc.publicBoqDecision(token, boqId, body);
  }

  @RequirePermission('client-token:read')
  @Public()
  @Get('quotations/compare/:cid')
  compare(@Param('token') token: string, @Param('cid') cid: string) {
    return this.svc.publicCompare(token, cid);
  }

  @RequirePermission('client-token:create')
  @Public()
  @Post('quotations/select')
  select(@Param('token') token: string, @Body() body: any) {
    return this.svc.publicSelectQuote(token, body);
  }

  @RequirePermission('client-token:read')
  @Public()
  @Get('handover')
  handover(@Param('token') token: string) {
    return this.svc.publicHandover(token);
  }

  @RequirePermission('client-token:accept')
  @Public()
  @Post('handover/accept')
  accept(@Param('token') token: string, @Body() body: any) {
    return this.svc.publicHandoverAccept(token, body);
  }

  @RequirePermission('client-token:create')
  @Public()
  @Post('handover/snag')
  snag(@Param('token') token: string, @Body() body: any) {
    return this.svc.publicSnag(token, body);
  }
}
