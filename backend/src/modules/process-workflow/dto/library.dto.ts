import {
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  MaxLength,
} from 'class-validator';
import { TrackType } from '../../../common/enums/process-workflow.enums';

export class CreatePhaseDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsString()
  @MaxLength(40)
  code: string;

  @IsEnum(TrackType)
  trackType: TrackType;

  @IsInt()
  order: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdatePhaseDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateStepDto {
  @IsInt()
  phaseId: number;

  @IsString()
  @MaxLength(150)
  name: string;

  @IsString()
  @MaxLength(60)
  code: string;

  @IsInt()
  order: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isGate?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  gateName?: string;

  @IsOptional()
  @IsInt()
  defaultDurationDays?: number;

  @IsOptional()
  @IsArray()
  dependsOnStepCodes?: string[];
}

export class UpdateStepDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isGate?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  gateName?: string;

  @IsOptional()
  @IsInt()
  defaultDurationDays?: number;

  @IsOptional()
  @IsArray()
  dependsOnStepCodes?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateDeliverableDto {
  @IsInt()
  stepId: number;

  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  fileType?: string;
}

export class AssignStepTeamDto {
  @IsInt()
  stepId: number;

  @IsInt()
  teamId: number;

  @IsOptional()
  @IsString()
  responsibilityType?: string; // OWNER | SUPPORT | APPROVER
}
