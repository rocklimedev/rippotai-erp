import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PlannerModule } from '@/common/enums/project-planner.enum';

export class CreatePlannerTaskTemplateDto {
  @IsEnum(PlannerModule)
  module: PlannerModule;

  @IsUUID(4)
  @IsOptional()
  phase_id?: string;

  @IsUUID(4)
  @IsOptional()
  parent_id?: string;

  @IsString()
  title: string;

  @IsInt()
  @IsOptional()
  sort_order?: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class UpdatePlannerTaskTemplateDto {
  @IsUUID(4)
  @IsOptional()
  phase_id?: string;

  @IsUUID(4)
  @IsOptional()
  parent_id?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsInt()
  @IsOptional()
  sort_order?: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
