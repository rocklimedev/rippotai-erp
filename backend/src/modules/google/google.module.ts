// google/google.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import { GoogleToken } from './models/google-tokens.model';
import { GoogleAuthService } from '../auth/google-auth.service';
import { GoogleCalendarService } from './google-calendar.service';
import { GoogleTasksService } from './google-tasks.service';

@Module({
  imports: [
    SequelizeModule.forFeature([GoogleToken]),
    ConfigModule, // provides ConfigService used in GoogleAuthService
  ],
  providers: [GoogleAuthService, GoogleCalendarService, GoogleTasksService],
  exports: [
    // Exported so AuthModule's GoogleOAuthController can inject it directly.
    GoogleAuthService,
    // Exported so any feature module (e.g. a calendar-sync module) can
    // inject these without reaching into GoogleAuthService itself.
    GoogleCalendarService,
    GoogleTasksService,
  ],
})
export class GoogleModule {}
