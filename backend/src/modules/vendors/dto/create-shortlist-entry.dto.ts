import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  Trade,
  WorkingType,
  ShortlistEntryStatus,
} from '@/common/enums/shortlist.enums';
export class CreateShortlistEntryDto {
  @IsUUID()
  @IsNotEmpty()
  project_shortlist_id: string;

  @IsEnum(Trade)
  @IsNotEmpty()
  trade: Trade;

  @IsEnum(WorkingType)
  @IsNotEmpty()
  working_type: WorkingType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sort_order?: number;

  /** Required for VENDOR shortlist; optional for MATERIAL */
  @IsOptional()
  @IsUUID()
  vendor_id?: string;

  /** Required for MATERIAL shortlist */
  @IsOptional()
  @IsUUID()
  material_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name_of_vendor?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  estimate_value?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  quotation_value?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsUUID()
  quotation_id?: string;

  @IsOptional()
  @IsEnum(ShortlistEntryStatus)
  status?: ShortlistEntryStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  is_selected?: boolean;
}
