import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMaterialMasterDto {
  @IsString()
  @MaxLength(50)
  material_code: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sub_category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  model?: string;

  @IsOptional()
  @IsString()
  specification?: string;

  @IsString()
  @MaxLength(30)
  default_unit: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  hsn_code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateMaterialMasterDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sub_category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  model?: string;

  @IsOptional()
  @IsString()
  specification?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  default_unit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  hsn_code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
