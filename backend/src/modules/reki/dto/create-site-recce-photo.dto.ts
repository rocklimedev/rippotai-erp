import { IsInt, IsOptional, IsString, Min, MaxLength } from 'class-validator';

export class CreateSiteReccePhotoDto {
  @IsInt()
  @Min(1)
  shot_number: number;

  // ============================================================
  // LAYOUT
  // ============================================================

  @IsOptional()
  @IsString()
  layout_image_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  layout_file_name?: string;

  // ============================================================
  // PHOTO
  // ============================================================

  @IsOptional()
  @IsString()
  photo_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  photo_file_name?: string;

  // ============================================================
  // CAMERA METADATA
  // ============================================================

  @IsOptional()
  @IsString()
  @MaxLength(255)
  standing_position?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  camera_direction?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
