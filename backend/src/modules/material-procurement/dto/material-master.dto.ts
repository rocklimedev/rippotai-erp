import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
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

  // ============================================================
  // VENDOR
  // ============================================================

  @IsOptional()
  @IsUUID()
  vendor_id?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  model?: string;

  @IsOptional()
  @IsString()
  specification?: string;

  // ============================================================
  // UNIT
  // ============================================================

  @IsUUID()
  @IsNotEmpty()
  unit_id: string;

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

  // ============================================================
  // VENDOR
  // ============================================================

  @IsOptional()
  @IsUUID()
  vendor_id?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  model?: string;

  @IsOptional()
  @IsString()
  specification?: string;

  // ============================================================
  // UNIT
  // ============================================================

  @IsOptional()
  @IsUUID()
  unit_id?: string;

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
