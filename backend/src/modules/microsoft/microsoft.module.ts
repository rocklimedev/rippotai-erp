// microsoft/microsoft.module.ts

import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { MicrosoftToken } from './models/microsoft_tokens.model';

import { MicrosoftAuthService } from '../auth/microsoft-auth.service';
import { MicrosoftOAuthController } from '../auth/oauth/microsoft-oauth.controller';

import { OAuthStateService } from '../auth/oauth/oauth-state.service';

import { MicrosoftOneDriveService } from './microsoft-onedrive.service';
import { MicrosoftOneDriveController } from './microsoft-onedrive.controller';

@Module({
  imports: [
    ConfigModule,

    SequelizeModule.forFeature([MicrosoftToken]),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:
          config.get<string>('JWT_SECRET') ||
          config.get<string>('JWT_ACCESS_SECRET'),

        signOptions: {
          expiresIn: '10m',
        },
      }),
    }),
  ],

  controllers: [MicrosoftOAuthController, MicrosoftOneDriveController],

  providers: [
    MicrosoftAuthService,
    MicrosoftOneDriveService,
    OAuthStateService,
  ],

  exports: [MicrosoftAuthService, MicrosoftOneDriveService],
})
export class MicrosoftModule {}
