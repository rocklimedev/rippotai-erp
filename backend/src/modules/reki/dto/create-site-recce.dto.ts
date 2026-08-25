import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { CreateSiteRecceRoomDto } from './create-site-recce-room.dto';

export enum SiteType {
  FLAT = 'FLAT',
  FLOOR = 'FLOOR',
  KOTHI = 'KOTHI',
  RAW = 'RAW',
}

export class CreateSiteRecceDto {
  // ============================================================
  // PROJECT
  // ============================================================

  @IsUUID()
  project_id: string;

  // ============================================================
  // BASIC DETAILS
  // ============================================================

  @IsOptional()
  @IsString()
  @MaxLength(255)
  project_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  client_name?: string;

  @IsOptional()
  @IsString()
  site_address?: string;

  // ============================================================
  // RECCE DETAILS
  // ============================================================

  @IsDateString()
  recce_date: string;

  @IsOptional()
  @IsUUID()
  site_engineer_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  accompanied_by?: string;

  // ============================================================
  // PROPERTY DETAILS
  // ============================================================

  @IsOptional()
  @IsString()
  @MaxLength(100)
  unit_floor_no?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  carpet_area_sqft?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  built_up_area_sqft?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  number_of_rooms?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  number_of_floors?: number;

  // ============================================================
  // SITE TYPE
  // ============================================================

  @IsOptional()
  @IsEnum(SiteType)
  site_type?: SiteType;

  // ============================================================
  // ACCESS
  // ============================================================

  @IsOptional()
  @IsBoolean()
  lift_available?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  lift_size?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  staircase_width?: string;

  @IsOptional()
  @IsString()
  material_entry_point?: string;

  // ============================================================
  // UTILITIES
  // ============================================================

  @IsOptional()
  @IsString()
  water_connection?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  power_load_available?: string;

  @IsOptional()
  @IsString()
  drainage_point_location?: string;

  // ============================================================
  // SOCIETY / RWA
  // ============================================================

  @IsOptional()
  @IsString()
  society_rwa_restrictions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  working_hours_allowed?: string;

  @IsOptional()
  @IsString()
  material_movement_rule?: string;

  // ============================================================
  // EXISTING CONDITION
  // ============================================================

  @IsOptional()
  @IsString()
  existing_condition?: string;

  // ============================================================
  // ROOMS
  // ============================================================

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateSiteRecceRoomDto)
  rooms?: CreateSiteRecceRoomDto[];
}
