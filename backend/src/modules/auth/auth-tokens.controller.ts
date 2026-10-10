import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthTokensService } from './auth-tokens.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { AuthThrottle } from '@/common/security/auth-throttle.decorator';
import type { CurrentUserPayload } from '@/common/interfaces/current-user-payload.interface';

@Controller('auth/tokens')
@UseGuards(JwtAuthGuard)
@AuthThrottle('token')
export class AuthTokensController {
  constructor(private readonly authTokensService: AuthTokensService) {}

  @RequirePermission('sessions:read-own')
  @Get('user/:userId')
  findAllForUser(
    @Param('userId') userId: string,
    @CurrentUser() actor: CurrentUserPayload,
  ) {
    return this.authTokensService.listSessions(userId, actor);
  }

  @RequirePermission('sessions:revoke-own')
  @Patch(':id/revoke')
  revoke(@Param('id') id: string, @CurrentUser() actor: CurrentUserPayload) {
    return this.authTokensService.revokeSession(id, actor);
  }

  @RequirePermission('sessions:revoke-own')
  @Patch('user/:userId/revoke-all')
  revokeAllForUser(
    @Param('userId') userId: string,
    @CurrentUser() actor: CurrentUserPayload,
  ) {
    return this.authTokensService.revokeUserSessions(userId, actor);
  }

  @RequirePermission('auth-tokens:delete')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() actor: CurrentUserPayload) {
    return this.authTokensService.deleteSession(id, actor);
  }
}
