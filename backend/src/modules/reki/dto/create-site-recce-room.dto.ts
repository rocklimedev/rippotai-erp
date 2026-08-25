import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer'; // add this import
import { CreateSiteReccePhotoDto } from './create-site-recce-photo.dto';

export enum SiteRecceRoomType {
  LIVING_DINING = 'LIVING_DINING',
  MASTER_BEDROOM = 'MASTER_BEDROOM',
  BEDROOM = 'BEDROOM',
  KITCHEN = 'KITCHEN',
  BATHROOM = 'BATHROOM',
  BALCONY = 'BALCONY',
  OTHER = 'OTHER',
}

export enum MeasurementUnit {
  FT = 'FT',
  M = 'M',
  IN = 'IN',
  CM = 'CM',
}

export class CreateSiteRecceRoomDto {
  @IsString()
  @MaxLength(255)
  room_name: string;

  @IsEnum(SiteRecceRoomType)
  room_type: SiteRecceRoomType;

  @IsOptional()
  @IsInt()
  @Min(0)
  room_number?: number;

  // ============================================================
  // MEASUREMENTS
  // ============================================================

  @IsOptional()
  @IsNumber()
  @Min(0)
  length?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  width?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number;

  @IsOptional()
  @IsEnum(MeasurementUnit)
  measurement_unit?: MeasurementUnit;

  // ============================================================
  // EXISTING CONDITION
  // ============================================================

  @IsOptional()
  @IsString()
  existing_flooring?: string;

  @IsOptional()
  @IsString()
  existing_ceiling?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;

  // ============================================================
  // PHOTOS
  // ============================================================
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateSiteReccePhotoDto) // <-- add this
  photos?: CreateSiteReccePhotoDto[];
}
