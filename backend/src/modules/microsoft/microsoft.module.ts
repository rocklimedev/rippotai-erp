// microsoft/microsoft.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import { MicrosoftToken } from './models/microsoft_tokens.model';
import { MicrosoftAuthService } from '../auth/microsoft-auth.service';
import { MicrosoftOneDriveService } from './microsoft-onedrive.service';

@Module({
  imports: [
    SequelizeModule.forFeature([MicrosoftToken]),
    ConfigModule, // provides ConfigService used in MicrosoftAuthService
  ],
  providers: [MicrosoftAuthService, MicrosoftOneDriveService],
  exports: [
    // Exported so AuthModule's MicrosoftOAuthController can inject it directly.
    MicrosoftAuthService,
    MicrosoftOneDriveService,
  ],
})
export class MicrosoftModule {}
