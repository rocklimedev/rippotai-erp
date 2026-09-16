import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

// ============================================================
// CREATE MATERIAL MASTER
// ============================================================

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

// ============================================================
// UPDATE MATERIAL MASTER
// ============================================================

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

// ============================================================
// ADD VENDOR TO MATERIAL
// ============================================================

export class AddMaterialVendorDto {
  // ============================================================
  // VENDOR
  // ============================================================

  @IsUUID()
  @IsNotEmpty()
  vendor_id: string;

  // ============================================================
  // VENDOR MATERIAL CODE
  // ============================================================

  @IsOptional()
  @IsString()
  @MaxLength(100)
  vendor_material_code?: string | null;

  // ============================================================
  // PRICE
  // ============================================================

  @IsOptional()
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @Min(0)
  price?: number | null;

  // ============================================================
  // DISCOUNT
  // ============================================================

  @IsOptional()
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @Min(0)
  @Max(100)
  discount_percent?: number | null;

  // ============================================================
  // LEAD TIME
  // ============================================================

  @IsOptional()
  @IsNumber({
    maxDecimalPlaces: 0,
  })
  @Min(0)
  lead_time_days?: number | null;

  // ============================================================
  // PREFERRED
  // ============================================================

  @IsOptional()
  @IsBoolean()
  is_preferred?: boolean;

  // ============================================================
  // STATUS
  // ============================================================

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// ============================================================
// UPDATE MATERIAL VENDOR
// ============================================================

export class UpdateMaterialVendorDto {
  // ============================================================
  // VENDOR
  // ============================================================

  @IsOptional()
  @IsUUID()
  vendor_id?: string;

  // ============================================================
  // VENDOR MATERIAL CODE
  // ============================================================

  @IsOptional()
  @IsString()
  @MaxLength(100)
  vendor_material_code?: string | null;

  // ============================================================
  // PRICE
  // ============================================================

  @IsOptional()
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @Min(0)
  price?: number | null;

  // ============================================================
  // DISCOUNT
  // ============================================================

  @IsOptional()
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @Min(0)
  @Max(100)
  discount_percent?: number | null;

  // ============================================================
  // LEAD TIME
  // ============================================================

  @IsOptional()
  @IsNumber({
    maxDecimalPlaces: 0,
  })
  @Min(0)
  lead_time_days?: number | null;

  // ============================================================
  // PREFERRED
  // ============================================================

  @IsOptional()
  @IsBoolean()
  is_preferred?: boolean;

  // ============================================================
  // STATUS
  // ============================================================

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
