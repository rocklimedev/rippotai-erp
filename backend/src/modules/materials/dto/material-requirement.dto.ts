import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { MaterialRequirementStatus } from '../models/material-requirement.model';

export class CreateMaterialRequirementDto {
  @IsUUID()
  project_id: string;

  @IsUUID()
  @IsOptional()
  raised_by?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  budget_hint?: string;

  @IsString()
  @IsOptional()
  style_notes?: string;

  @IsEnum(MaterialRequirementStatus)
  @IsOptional()
  status?: MaterialRequirementStatus;
}

export class UpdateMaterialRequirementDto extends PartialType(
  CreateMaterialRequirementDto,
) {}
