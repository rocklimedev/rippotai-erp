import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  PlannerModule,
  PlannerTaskStatus,
} from '@/common/enums/project-planner.enum';

export class CreateProjectPlannerTaskDto {
  @IsEnum(PlannerModule)
  module: PlannerModule;

  @IsUUID(4)
  @IsOptional()
  phase_id?: string;

  @IsUUID(4)
  @IsOptional()
  template_id?: string;

  @IsUUID(4)
  @IsOptional()
  parent_id?: string;

  @IsInt()
  @IsOptional()
  s_no?: number;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class UpdateProjectPlannerTaskDto {
  @IsUUID(4)
  @IsOptional()
  phase_id?: string;

  @IsUUID(4)
  @IsOptional()
  parent_id?: string;

  @IsInt()
  @IsOptional()
  s_no?: number;

  @IsString()
  @IsOptional()
  title?: string;

  @IsEnum(PlannerTaskStatus)
  @IsOptional()
  status?: PlannerTaskStatus;

  @IsString()
  @IsOptional()
  remarks?: string;
}

/** Sets/clears the completion date for one task on one floor. */
export class RecordFloorProgressDto {
  @IsUUID(4)
  project_floor_id: string;

  @IsDateString()
  @IsOptional()
  completed_date?: string | null;

  @IsString()
  @IsOptional()
  remarks?: string;
}

/** Bootstraps a project's checklist by cloning the active templates for a module. */
export class CloneTemplatesToProjectDto {
  @IsEnum(PlannerModule)
  module: PlannerModule;
}
