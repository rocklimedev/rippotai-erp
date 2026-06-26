import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';

import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { IsEmail, IsString } from 'class-validator';

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto.email, dto.password);

    res.cookie('access_token', result.token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return result;
  }

  @Get('me')
  async me(@Req() req: Request) {
    const auth = req.headers.authorization;

    if (!auth) {
      throw new UnauthorizedException('No Authorization header');
    }

    const token = auth.replace('Bearer ', '');

    return this.authService.getCurrentUser(token);
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.access_token;

    if (token) {
      await this.authService.logout(token);
    }

    res.clearCookie('access_token');

    return {
      success: true,
    };
  }
}
