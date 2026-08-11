import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Estimate } from './models/estimate.model';
import { EstimateItem } from './models/estimate-item.model';
import { EstimatesService } from './estimates.service';
import { EstimatesController } from './estimates.controller';
import { Quotation } from './models/quotations.model';

@Module({
  imports: [SequelizeModule.forFeature([Estimate, EstimateItem, Quotation])],
  controllers: [EstimatesController],
  providers: [EstimatesService],
  exports: [EstimatesService, SequelizeModule],
})
export class EstimatesModule {}
