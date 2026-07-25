import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { AuthTokensController } from './auth-tokens.controller';
import { VerificationTokensController } from './verification-tokens.controller';

import { AuthService } from './auth.service';
import { AuthTokensService } from './auth-tokens.service';
import { VerificationTokensService } from './verification-tokens.service';
import { JwtStrategy } from '@/common/strategies/jwt.strategy';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { User } from '@/modules/users/models/user.model';
import { AuthToken } from './models/auth-token.model';
import { VerificationToken } from './models/verification-token.model';
import { ForgotPasswordService } from './forgot-password.service';
import { PasswordResetToken } from './models/password-reset-token.model';
import { MailService } from '@/common/mail/mail.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      User,
      AuthToken,
      VerificationToken,
      PasswordResetToken,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [
    AuthController,
    AuthTokensController,
    VerificationTokensController,
  ],
  providers: [
    AuthService,
    AuthTokensService,
    VerificationTokensService,
    ForgotPasswordService,
    MailService,
    JwtStrategy,
    JwtAuthGuard,
  ],
  exports: [
    AuthService,
    AuthTokensService,
    VerificationTokensService,
    JwtAuthGuard,
  ],
})
export class AuthModule {}
