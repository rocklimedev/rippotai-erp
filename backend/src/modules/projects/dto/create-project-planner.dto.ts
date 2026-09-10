import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { ProjectPlannerType } from '@/common/enums/project-planner.enum';

export class CreateProjectPlannerDto {
  @IsEnum(ProjectPlannerType)
  type: ProjectPlannerType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  planned_start_date?: string;

  @IsOptional()
  @IsDateString()
  planned_end_date?: string;

  @IsOptional()
  @IsUUID()
  created_by?: string;
}
