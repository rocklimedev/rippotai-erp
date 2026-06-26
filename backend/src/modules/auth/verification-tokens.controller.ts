import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { VerificationTokensService } from './verification-tokens.service';
import { CreateVerificationTokenDto } from './dto/verification-token.dto';

@Controller('auth/verification-tokens')
export class VerificationTokensController {
  constructor(
    private readonly verificationTokensService: VerificationTokensService,
  ) {}

  @Post()
  create(@Body() dto: CreateVerificationTokenDto) {
    return this.verificationTokensService.create(dto);
  }

  @Get('validate')
  findValidByToken(@Query('token') token: string) {
    return this.verificationTokensService.findValidByToken(token);
  }

  @Patch(':id/consume')
  consume(@Param('id') id: string) {
    return this.verificationTokensService.consume(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.verificationTokensService.remove(id);
  }
}
