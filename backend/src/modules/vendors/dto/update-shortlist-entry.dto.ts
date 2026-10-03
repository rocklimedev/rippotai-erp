import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import {
  Trade,
  WorkingType,
  ShortlistEntryStatus,
} from '@/common/enums/shortlist.enums';

export class UpdateShortlistEntryDto {
  @IsOptional()
  @IsEnum(Trade)
  trade?: Trade;

  @IsOptional()
  @IsEnum(WorkingType)
  working_type?: WorkingType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sort_order?: number;

  @IsOptional()
  @IsUUID()
  vendor_id?: string | null;

  @IsOptional()
  @IsUUID()
  material_id?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name_of_vendor?: string | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  estimate_value?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  quotation_value?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsUUID()
  quotation_id?: string | null;

  @IsOptional()
  @IsEnum(ShortlistEntryStatus)
  status?: ShortlistEntryStatus;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsBoolean()
  is_selected?: boolean;
}
