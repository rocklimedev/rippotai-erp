import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { App } from './models/app.model';
import { AppsController } from './apps.controller';
import { AppsService } from './apps.service';

@Module({
  imports: [SequelizeModule.forFeature([App])],
  controllers: [AppsController],
  providers: [AppsService],
  exports: [AppsService],
})
export class AppsModule {}
