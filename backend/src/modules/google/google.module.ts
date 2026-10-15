import { OAuthTokenCryptoService } from '../auth/oauth/oauth-token-crypto.service';
// google/google.module.ts

import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';

import { GoogleToken } from './models/google-tokens.model';

import { GoogleAuthService } from '../auth/google-auth.service';

import { GoogleCalendarService } from './google-calendar.service';
import { GoogleTasksService } from './google-tasks.service';

import { GoogleCalendarController } from './google-calendar.controller';
import { GoogleTasksController } from './google-tasks.controller';

@Module({
  imports: [SequelizeModule.forFeature([GoogleToken]), ConfigModule],

  controllers: [GoogleCalendarController, GoogleTasksController],

  providers: [
    OAuthTokenCryptoService,
    GoogleAuthService,
    GoogleCalendarService,
    GoogleTasksService,
  ],

  exports: [GoogleAuthService, GoogleCalendarService, GoogleTasksService],
})
export class GoogleModule {}
