import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MaterialRequirement } from './models/material-requirement.model';
import { MaterialRequirementsService } from './material-requirements.service';
import { MaterialRequirementsController } from './material-requirements.controller';

@Module({
  imports: [SequelizeModule.forFeature([MaterialRequirement])],
  providers: [MaterialRequirementsService],
  controllers: [MaterialRequirementsController],
  exports: [MaterialRequirementsService],
})
export class MaterialRequirementsModule {}
