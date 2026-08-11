import { PartialType } from '@nestjs/mapped-types';
import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateSiteInventoryItemDto {
  @IsUUID()
  project_id: string;

  @IsString()
  material_name: string;

  @IsUUID()
  @IsOptional()
  unit_id?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  quantity_on_hand?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  reorder_level?: number;

  @IsString()
  @IsOptional()
  location_on_site?: string;
}

export class UpdateSiteInventoryItemDto extends PartialType(
  CreateSiteInventoryItemDto,
) {}
