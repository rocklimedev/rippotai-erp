import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';

import zohoConfig from './zoho.config';
import { ZohoToken } from './models/zoho-token.model';

import { ZohoAuthService } from './services/zoho-auth.service';
import { ZohoHttpService } from './services/zoho-http.service';

import { ZohoOAuthController } from './zoho-oauth.controller';

import { WorkDriveService } from './workdrive/workdrive.service';
import { WorkDriveController } from './workdrive/workdrive.controller';

import { ZohoCrmService } from './crm/zoho-crm.service';
import { ZohoCrmController } from './crm/zoho-crm.controller';

@Module({
  imports: [
    ConfigModule.forFeature(zohoConfig),

    SequelizeModule.forFeature([ZohoToken]),
  ],

  controllers: [ZohoOAuthController, WorkDriveController, ZohoCrmController],

  providers: [
    ZohoAuthService,
    ZohoHttpService,

    WorkDriveService,
    ZohoCrmService,
  ],

  exports: [ZohoAuthService, ZohoHttpService, WorkDriveService, ZohoCrmService],
})
export class ZohoModule {}
