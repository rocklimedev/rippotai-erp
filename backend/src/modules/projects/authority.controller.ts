import {
  Controller,
  ForbiddenException,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import { AUTHORITY_ROLES, AuthorityService } from './authority.service';

/** Super-authority dashboard. Only ADMIN / SUPERADMIN roles may read it — enforced here, not just in the UI. */
@ApiTags('Command Center')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('command-center/authority')
export class AuthorityController {
  constructor(private readonly authority: AuthorityService) {}

  private assertAuthority(req: {
    user?: { role?: string; roleName?: string };
  }) {
    const role = String(
      req.user?.roleName ?? req.user?.role ?? '',
    ).toUpperCase();
    if (!AUTHORITY_ROLES.includes(role)) {
      throw new ForbiddenException(
        'Only the super authority can open this dashboard.',
      );
    }
  }

  @RequirePermission('command-center:authority')
  @Get('overview')
  overview(@Req() req: any) {
    this.assertAuthority(req);
    return this.authority.overview();
  }
}
