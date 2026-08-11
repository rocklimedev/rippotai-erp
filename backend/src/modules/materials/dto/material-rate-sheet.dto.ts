import { PartialType } from '@nestjs/mapped-types';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateMaterialRateSheetDto {
  @IsUUID()
  @IsOptional()
  vendor_id?: string;

  @IsUUID()
  @IsOptional()
  project_id?: string;

  @IsString()
  material_name: string;

  @IsUUID()
  @IsOptional()
  unit_id?: string;

  @IsNumber()
  @Min(0)
  rate: number;

  @IsString()
  @IsOptional()
  availability?: string;

  @IsDateString()
  @IsOptional()
  valid_until?: string;
}

export class UpdateMaterialRateSheetDto extends PartialType(
  CreateMaterialRateSheetDto,
) {}
