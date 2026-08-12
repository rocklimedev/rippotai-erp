import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { MaterialRateSheet } from './models/material-rate-sheet.model';
import { MaterialRequirement } from './models/material-requirement.model';

import { MaterialRateSheetsService } from './material-rate-sheets.service';
import { MaterialRequirementsService } from './material-requirements.service';

import { MaterialRateSheetsController } from './material-rate-sheets.controller';
import { MaterialRequirementsController } from './material-requirements.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([MaterialRateSheet, MaterialRequirement]),
  ],

  providers: [MaterialRateSheetsService, MaterialRequirementsService],

  controllers: [MaterialRateSheetsController, MaterialRequirementsController],

  exports: [MaterialRateSheetsService, MaterialRequirementsService],
})
export class MaterialsModule {}
