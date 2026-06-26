import { PartialType } from '@nestjs/mapped-types';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { VendorStatus } from '../../../common/enums';

export class CreateVendorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  company_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @IsOptional()
  @IsUUID()
  vendor_category_id?: string;

  @IsOptional()
  @IsUUID()
  business_type_id?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  contact_number: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  alternate_contact?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(VendorStatus)
  status?: VendorStatus;

  @IsOptional()
  @IsUUID()
  created_by?: string;
}

export class UpdateVendorDto extends PartialType(CreateVendorDto) {
  @IsOptional()
  @IsUUID()
  updated_by?: string;
}
