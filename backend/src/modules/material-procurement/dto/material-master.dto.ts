import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMaterialMasterDto {
  // ============================================================
  // MATERIAL IDENTIFICATION
  // ============================================================

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  material_code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  // ============================================================
  // CLASSIFICATION
  // ============================================================

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sub_category?: string;

  // ============================================================
  // BRAND / PRODUCT INFORMATION
  // ============================================================

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

  // ============================================================
  // VENDOR
  // ============================================================

  @IsOptional()
  @IsUUID()
  vendor_id?: string | null;

  // ============================================================
  // UNIT
  // ============================================================

  @IsUUID()
  @IsNotEmpty()
  unit_id: string;

  // ============================================================
  // PRICE
  // ============================================================

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number | null;

  // ============================================================
  // TAX
  // ============================================================

  @IsOptional()
  @IsString()
  @MaxLength(30)
  hsn_code?: string;

  // ============================================================
  // DESCRIPTION
  // ============================================================

  @IsOptional()
  @IsString()
  description?: string;

  // ============================================================
  // STATUS
  // ============================================================

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateMaterialMasterDto {
  // ============================================================
  // MATERIAL IDENTIFICATION
  // ============================================================

  @IsOptional()
  @IsString()
  @MaxLength(50)
  material_code?: string;

  // ============================================================
  // BASIC INFORMATION
  // ============================================================

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  // ============================================================
  // CLASSIFICATION
  // ============================================================

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sub_category?: string;

  // ============================================================
  // BRAND / PRODUCT INFORMATION
  // ============================================================

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

  // ============================================================
  // VENDOR
  // ============================================================

  @IsOptional()
  @IsUUID()
  vendor_id?: string | null;

  // ============================================================
  // UNIT
  // ============================================================

  @IsOptional()
  @IsUUID()
  unit_id?: string;

  // ============================================================
  // PRICE
  // ============================================================

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number | null;

  // ============================================================
  // TAX
  // ============================================================

  @IsOptional()
  @IsString()
  @MaxLength(30)
  hsn_code?: string;

  // ============================================================
  // DESCRIPTION
  // ============================================================

  @IsOptional()
  @IsString()
  description?: string;

  // ============================================================
  // STATUS
  // ============================================================

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
