import { Module } from '@nestjs/common';
import { RolePermission } from '../rbac/models/role_permission.model';
import { Permission } from '../rbac/models/permission.model';
import { SequelizeModule } from '@nestjs/sequelize';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { AuthTokensController } from './auth-tokens.controller';
import { ZohoOAuthController } from './oauth/zoho-oauth.controller';
import { GoogleOAuthController } from './oauth/google-oauth.controller';
import { MicrosoftOAuthController } from './oauth/microsoft-oauth.controller';

import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import { AuthTokensService } from './auth-tokens.service';
import { VerificationTokensService } from './verification-tokens.service';
import { OAuthStateService } from './oauth/oauth-state.service';
import { JwtStrategy } from '@/common/strategies/jwt.strategy';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { User } from '@/modules/users/models/user.model';
import { AuthToken } from './models/auth-token.model';
import { VerificationToken } from './models/verification-token.model';
import { ForgotPasswordService } from './forgot-password.service';
import { PasswordResetToken } from './models/password-reset-token.model';
import { MailService } from '@/common/mail/mail.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ZohoModule } from '@/modules/zoho/zoho.module';
import { GoogleModule } from '../google/google.module';
import { MicrosoftModule } from '../microsoft/microsoft.module';
import { RolePermissionsCacheModule } from '../rbac/role-permissions-cache';
import { DistributedSecurityModule } from '@/common/security/distributed-security.module';

@Module({
  imports: [
    DistributedSecurityModule,
    RolePermissionsCacheModule,
    SequelizeModule.forFeature([
      RolePermission,
      Permission,
      User,
      AuthToken,
      VerificationToken,
      PasswordResetToken,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // Signs/verifies the OAuth `state` param. Separate secret from your
    // session JWTs is safer — add OAUTH_STATE_SECRET to your env.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('OAUTH_STATE_SECRET'),
        signOptions: {
          expiresIn: '10m',
        },
      }),
    }),
    ZohoModule,
    GoogleModule,
    MicrosoftModule,
  ],
  controllers: [
    AuthController,
    AuthTokensController,
    ZohoOAuthController,
    GoogleOAuthController,
    MicrosoftOAuthController,
  ],
  providers: [
    EmailVerificationService,
    AuthService,
    AuthTokensService,
    VerificationTokensService,
    ForgotPasswordService,
    MailService,
    JwtStrategy,
    JwtAuthGuard,
    OAuthStateService,
  ],
  exports: [
    OAuthStateService,
    AuthService,
    AuthTokensService,
    VerificationTokensService,
    JwtAuthGuard,
  ],
})
export class AuthModule {}
