import { PartialType } from '@nestjs/mapped-types';
import { CreateVendorTenderResponseDto } from './create-vendor-tender-response.dto';

export class UpdateVendorTenderResponseDto extends PartialType(CreateVendorTenderResponseDto) {}
