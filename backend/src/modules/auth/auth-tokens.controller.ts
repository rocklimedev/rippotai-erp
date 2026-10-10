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
import type { CurrentUserPayload } from '@/common/interfaces/current-user-payload.interface';

@Controller('auth/tokens')
@UseGuards(JwtAuthGuard)
export class AuthTokensController {
  constructor(private readonly authTokensService: AuthTokensService) {}

  @Get('user/:userId')
  findAllForUser(
    @Param('userId') userId: string,
    @CurrentUser() actor: CurrentUserPayload,
  ) {
    return this.authTokensService.listSessions(userId, actor);
  }

  @Patch(':id/revoke')
  revoke(@Param('id') id: string, @CurrentUser() actor: CurrentUserPayload) {
    return this.authTokensService.revokeSession(id, actor);
  }

  @Patch('user/:userId/revoke-all')
  revokeAllForUser(
    @Param('userId') userId: string,
    @CurrentUser() actor: CurrentUserPayload,
  ) {
    return this.authTokensService.revokeUserSessions(userId, actor);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() actor: CurrentUserPayload) {
    return this.authTokensService.deleteSession(id, actor);
  }
}
