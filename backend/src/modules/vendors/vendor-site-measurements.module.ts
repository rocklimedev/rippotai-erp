import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { VendorSiteMeasurement } from './models/vendor-site-measurement.model';
import { VendorSiteMeasurementsService } from './vendor-site-measurements.service';
import { VendorSiteMeasurementsController } from './vendor-site-measurements.controller';

@Module({
  imports: [SequelizeModule.forFeature([VendorSiteMeasurement])],
  controllers: [VendorSiteMeasurementsController],
  providers: [VendorSiteMeasurementsService],
  exports: [VendorSiteMeasurementsService, SequelizeModule],
})
export class VendorSiteMeasurementsModule {}
