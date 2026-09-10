import { IsUUID, IsString, IsOptional, IsInt, IsDateString, MaxLength } from 'class-validator';

export class CreateVendorProcurementDto {
  @IsUUID(4)
  procurement_category_id: string;

  @IsOptional()
  @IsInt()
  s_no?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  vendor_name?: string;

  @IsOptional()
  @IsDateString()
  estimate_finalised_date?: string;

  @IsOptional()
  @IsDateString()
  quotation_finalised_date?: string;

  @IsOptional()
  @IsDateString()
  labour_start_date?: string;

  @IsOptional()
  @IsDateString()
  labour_end_date?: string;

  @IsOptional()
  @IsDateString()
  material_purchase_date?: string;

  @IsOptional()
  @IsDateString()
  material_received_date?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateVendorProcurementDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  vendor_name?: string;

  @IsOptional()
  @IsDateString()
  estimate_finalised_date?: string;

  @IsOptional()
  @IsDateString()
  quotation_finalised_date?: string;

  @IsOptional()
  @IsDateString()
  labour_start_date?: string;

  @IsOptional()
  @IsDateString()
  labour_end_date?: string;

  @IsOptional()
  @IsDateString()
  material_purchase_date?: string;

  @IsOptional()
  @IsDateString()
  material_received_date?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
