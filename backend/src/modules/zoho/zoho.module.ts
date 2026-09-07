import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { JwtModule } from '@nestjs/jwt';

import zohoConfig from './zoho.config';
import { ZohoToken } from './models/zoho-token.model';

import { ZohoAuthService } from '../auth/zoho-auth.service';
import { ZohoHttpService } from './services/zoho-http.service';

import { ZohoOAuthController } from '../auth/oauth/zoho-oauth.controller';
import { OAuthStateService } from '../auth/oauth/oauth-state.service';

import { WorkDriveService } from './workdrive/workdrive.service';
import { WorkDriveController } from './workdrive/workdrive.controller';

import { ZohoCrmService } from './crm/zoho-crm.service';
import { ZohoCrmController } from './crm/zoho-crm.controller';

import { ZohoCliqService } from './cliq/zoho-cliq.service';
import { ZohoCliqController } from './cliq/zoho-cliq.controller';

@Module({
  imports: [
    ConfigModule.forFeature(zohoConfig),

    SequelizeModule.forFeature([ZohoToken]),

    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],

  controllers: [
    ZohoOAuthController,
    WorkDriveController,
    ZohoCrmController,
    ZohoCliqController,
  ],

  providers: [
    ZohoAuthService,
    ZohoHttpService,
    OAuthStateService,
    WorkDriveService,
    ZohoCrmService,
    ZohoCliqService,
  ],

  exports: [
    ZohoAuthService,
    ZohoHttpService,
    OAuthStateService,
    WorkDriveService,
    ZohoCrmService,
    ZohoCliqService,
  ],
})
export class ZohoModule {}
