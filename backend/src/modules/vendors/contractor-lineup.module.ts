import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ContractorLineup } from './models/contractor-lineup.model';
import { ContractorLineupService } from './contractor-lineup.service';
import { ContractorLineupController } from './contractor-lineup.controller';

@Module({
  imports: [SequelizeModule.forFeature([ContractorLineup])],
  controllers: [ContractorLineupController],
  providers: [ContractorLineupService],
  exports: [ContractorLineupService, SequelizeModule],
})
export class ContractorLineupModule {}
