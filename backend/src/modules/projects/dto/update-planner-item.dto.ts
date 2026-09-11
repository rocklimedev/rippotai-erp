import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { PlannerItemStatus } from '@/common/enums/project-planner.enum';

export class UpdatePlannerItemDto {
  @IsOptional()
  @IsUUID()
  phase_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  work_name?: string | null;

  @IsOptional()
  @IsString()
  details?: string | null;

  @IsOptional()
  @IsUUID()
  document_type_id?: string | null;

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

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
}
