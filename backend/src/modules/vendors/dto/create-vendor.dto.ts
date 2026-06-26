import { IsEnum, IsOptional, IsString } from 'class-validator';
import { VendorCategory } from '@/common/enums';
import { VendorBusinessType } from '@/common/enums';
export class CreateVendorDto {
  @IsString()
  name: string;

  @IsString()
  contactNumber: string;

  @IsOptional()
  @IsEnum(VendorCategory)
  vendorCategory?: VendorCategory;

  @IsOptional()
  @IsEnum(VendorBusinessType)
  typeOfBusiness?: VendorBusinessType;
}
