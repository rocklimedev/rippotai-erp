import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Drawing } from './models/drawing.model';
import { Project } from '@/modules/projects/models/projects.model';
import { DrawingsService } from './drawing.service';
import { DrawingsController } from './drawing.controller';
import { CdnModule } from '@/modules/cdn/cdn.module';

@Module({
  imports: [SequelizeModule.forFeature([Drawing, Project]), CdnModule],
  controllers: [DrawingsController],
  providers: [DrawingsService],
  exports: [DrawingsService],
})
export class DrawingsModule {}
