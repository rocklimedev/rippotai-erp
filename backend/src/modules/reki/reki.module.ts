import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { SiteRecceController } from './reki.controller';
import { SiteRecceService } from './reki.service';

import { SiteRecce } from './models/site-recce.model';
import { SiteRecceRoom } from './models/site-recce-room.model';
import { SiteReccePhoto } from './models/site-recce-photo.model';

import { Project } from '@/modules/projects/models/projects.model';
import { User } from '@/modules/users/models/user.model';

import { CdnModule } from '@/modules/cdn/cdn.module';

@Module({
  imports: [
    // ==========================================================
    // DATABASE MODELS
    // ==========================================================

    SequelizeModule.forFeature([
      SiteRecce,
      SiteRecceRoom,
      SiteReccePhoto,
      Project,
      User,
    ]),

    // ==========================================================
    // CDN
    // ==========================================================

    CdnModule,
  ],

  // ============================================================
  // CONTROLLER
  // ============================================================

  controllers: [SiteRecceController],

  // ============================================================
  // SERVICES
  // ============================================================

  providers: [SiteRecceService],

  // ============================================================
  // EXPORTS
  // ============================================================

  exports: [SiteRecceService],
})
export class SiteRecceModule {}
