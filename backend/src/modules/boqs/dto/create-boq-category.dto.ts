import { IsBoolean, IsUUID, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateBoqCategoryDto {
  @IsOptional()
  @IsUUID()
  library_category_id?: string;

  @IsOptional()
  @IsUUID()
  catalog_code?: string;

  @IsOptional()
  @IsBoolean()
  include_items?: boolean;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
}

export class UpdateBoqCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
}
