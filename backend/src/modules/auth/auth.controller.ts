import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import { summarizeAccess } from '../rbac/access-catalogue';
import { Public } from '@/common/decorator/public.decorator';
import { AuthThrottle } from '@/common/security/auth-throttle.decorator';
import {
  Body,
  Controller,
  Get,
  Header,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { IsEmail, IsString } from 'class-validator';
import type { Response } from 'express';
import { LoginLockoutException } from '@/common/security/login-protection.service';

import { AuthService } from './auth.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import type { RequestWithUser } from '@/common/interfaces/request-with-user-interfaces';
import { ForgotPasswordService } from './forgot-password.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SignupDto } from './dto/signup.dto';
import { EmailVerificationService } from './email-verification.service';
import {
  RequestEmailVerificationDto,
  VerifyEmailDto,
} from './dto/email-verification.dto';
class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly forgotPasswordService: ForgotPasswordService,
    private readonly emailVerification: EmailVerificationService,
  ) {}

  @RequirePermission('auth:login')
  @Public()
  @AuthThrottle()
  @Post('login')
  @Header('Cache-Control', 'no-store')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response?: Response,
  ) {
    try {
      return await this.authService.login(dto.email, dto.password);
    } catch (error) {
      if (error instanceof LoginLockoutException)
        response?.setHeader('Retry-After', error.retryAfter);
      throw error;
    }
  }
  @RequirePermission('auth:signup')
  @Public()
  @AuthThrottle()
  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @RequirePermission('auth:request-email-verification')
  @Public()
  @AuthThrottle()
  @Post('request-email-verification')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  requestEmailVerification(@Body() dto: RequestEmailVerificationDto) {
    return this.emailVerification.request(dto.email);
  }

  @RequirePermission('auth:verify-email')
  @Public()
  @AuthThrottle()
  @Post('verify-email')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.emailVerification.verify(dto.token);
  }
  @RequirePermission('account:read')
  @Get('me')
  @Header('Cache-Control', 'no-store')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: RequestWithUser) {
    const permissions = (req.user as any)?.permissions ?? [];
    return { user: { ...req.user, access: summarizeAccess(permissions) } };
  }

  @RequirePermission('account:logout')
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: RequestWithUser) {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      await this.authService.logout(token);
    }

    return { success: true };
  }

  @RequirePermission('auth:forgot-password')
  @Public()
  @AuthThrottle()
  @Post('forgot-password')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.forgotPasswordService.forgotPassword(dto);
  }

  @RequirePermission('auth:reset-password')
  @Public()
  @AuthThrottle()
  @Post('reset-password')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @RequirePermission('account:change-password')
  @AuthThrottle()
  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async changePassword(
    @Req() req: RequestWithUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      req.user.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
