import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

import { PlannerItemStatus } from '@/common/enums/project-planner.enum';

export class UpdatePlannerItemLocationDto {
  @IsOptional()
  @IsEnum(PlannerItemStatus)
  status?: PlannerItemStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress_pct?: number;

  @IsOptional()
  @IsDateString()
  planned_start_date?: string | null;

  @IsOptional()
  @IsDateString()
  planned_end_date?: string | null;

  @IsOptional()
  @IsDateString()
  actual_start_date?: string | null;

  @IsOptional()
  @IsDateString()
  actual_end_date?: string | null;

  @IsOptional()
  @IsUUID()
  assigned_to?: string | null;

  @IsOptional()
  @IsString()
  remarks?: string | null;
}
