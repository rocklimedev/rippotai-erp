import { PartialType } from '@nestjs/mapped-types';
import { CreateVendorSiteMeasurementDto } from './create-vendor-site-measurement.dto';

export class UpdateVendorSiteMeasurementDto extends PartialType(CreateVendorSiteMeasurementDto) {}
