import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ProjectBrief } from './models/project-brief.model';
import { BriefController } from './brief.controller';
import { BriefService } from './brief.service';

@Module({
  imports: [SequelizeModule.forFeature([ProjectBrief])],
  controllers: [BriefController],
  providers: [BriefService],
  exports: [BriefService],
})
export class BriefModule {}
