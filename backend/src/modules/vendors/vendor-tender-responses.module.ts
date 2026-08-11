import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { VendorTenderResponse } from './models/vendor-tender-response.model';
import { VendorTenderResponsesService } from './vendor-tender-responses.service';
import { VendorTenderResponsesController } from './vendor-tender-responses.controller';
import { EstimatesModule } from '../quotations/estimates.module';

@Module({
  imports: [
    SequelizeModule.forFeature([VendorTenderResponse]),
    EstimatesModule,
  ],
  controllers: [VendorTenderResponsesController],
  providers: [VendorTenderResponsesService],
  exports: [VendorTenderResponsesService, SequelizeModule],
})
export class VendorTenderResponsesModule {}
