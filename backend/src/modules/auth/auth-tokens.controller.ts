import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthTokensService } from './auth-tokens.service';
import { CreateAuthTokenDto } from './dto/auth-token.dto';

@Controller('auth/tokens')
export class AuthTokensController {
  constructor(private readonly authTokensService: AuthTokensService) {}

  @Post()
  create(@Body() dto: CreateAuthTokenDto) {
    return this.authTokensService.create(dto);
  }

  @Get('user/:userId')
  findAllForUser(@Param('userId') userId: string) {
    return this.authTokensService.findAllForUser(userId);
  }

  @Patch(':id/revoke')
  revoke(@Param('id') id: string) {
    return this.authTokensService.revoke(id);
  }

  @Patch('user/:userId/revoke-all')
  revokeAllForUser(@Param('userId') userId: string) {
    return this.authTokensService.revokeAllForUser(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.authTokensService.remove(id);
  }
}
