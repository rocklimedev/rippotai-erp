import { IsOptional, IsNumber, IsBoolean, IsString } from 'class-validator';

export class UpdateInventoryMasterDto {
  @IsOptional()
  @IsString()
  item_code?: string;

  @IsOptional()
  @IsString()
  item_name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  unit_id?: string;

  @IsOptional()
  @IsNumber()
  default_rate?: number;

  // ✅ FIXED
  @IsOptional()
  @IsString()
  brand_id?: string;

  @IsOptional()
  @IsString()
  specification?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
