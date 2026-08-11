import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MaterialRateSheet } from './models/material-rate-sheet.model';
import { MaterialRateSheetsService } from './material-rate-sheets.service';
import { MaterialRateSheetsController } from './material-rate-sheets.controller';

@Module({
  imports: [SequelizeModule.forFeature([MaterialRateSheet])],
  providers: [MaterialRateSheetsService],
  controllers: [MaterialRateSheetsController],
  exports: [MaterialRateSheetsService],
})
export class MaterialRateSheetsModule {}
