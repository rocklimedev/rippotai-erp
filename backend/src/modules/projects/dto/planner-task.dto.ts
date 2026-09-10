import {
  IsUUID,
  IsEnum,
  IsString,
  IsOptional,
  IsInt,
  MaxLength,
} from 'class-validator';
import {
  PlannerModule,
  PlannerTaskStatus,
} from '@/common/enums/project-planner.enum';

export class CreatePlannerTaskDto {
  @IsEnum(PlannerModule)
  module: PlannerModule;

  @IsOptional()
  @IsUUID(4)
  phase_id?: string;

  @IsOptional()
  @IsUUID(4)
  parent_id?: string;

  @IsOptional()
  @IsInt()
  s_no?: number;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdatePlannerTaskDto {
  @IsOptional()
  @IsUUID(4)
  phase_id?: string;

  @IsOptional()
  @IsInt()
  s_no?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsEnum(PlannerTaskStatus)
  status?: PlannerTaskStatus;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpsertFloorProgressDto {
  @IsUUID(4)
  project_floor_id: string;

  @IsOptional()
  completed_date?: Date | null;

  @IsOptional()
  @IsString()
  remarks?: string;
}

/** Clones every active PlannerTaskTemplate row for a module into a new project. */
export class CloneTemplatesDto {
  @IsUUID(4)
  project_id: string;

  @IsEnum(PlannerModule)
  module: PlannerModule;
}
