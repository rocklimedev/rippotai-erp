import {
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';

// Single source of truth for the L/M discriminator, mirrored from
// BoqItem.calc_type ('M' = measured: amount derived from quantity * rate,
// 'L' = lump sum: amount entered directly).
export type CalcType = 'M' | 'L';
const CALC_TYPES: CalcType[] = ['M', 'L'];

export class CreateBoqItemDto {
  @IsUUID()
  boq_category_id: string;

  @IsOptional()
  @IsUUID()
  library_item_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsUUID()
  unit_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rate?: number;

  @IsOptional()
  @IsIn(CALC_TYPES)
  calc_type?: CalcType;

  // Only meaningful when calc_type === 'L'; ignored (recomputed from
  // quantity * rate) otherwise.
  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @IsOptional()
  @IsObject()
  detail?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
}

export class UpdateBoqItemDto {
  @IsOptional()
  @IsUUID()
  boq_category_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsUUID()
  unit_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rate?: number;

  @IsOptional()
  @IsIn(CALC_TYPES)
  calc_type?: CalcType;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @IsOptional()
  @IsObject()
  detail?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
}
