import {
  IsString,
  IsInt,
  IsOptional,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator';
import {
  StepStatus,
  ContinuityType,
} from '../../../common/enums/process-workflow.enums';

export class UpdateStepProgressDto {
  @IsEnum(StepStatus)
  status: StepStatus;

  @IsOptional()
  @IsInt()
  assigneeTeamId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  assigneeName?: string;

  @IsOptional()
  @IsDateString()
  plannedStartDate?: string;

  @IsOptional()
  @IsDateString()
  plannedEndDate?: string;

  @IsOptional()
  @IsString()
  blockedReason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class SignOffStepDto {
  @IsString()
  @MaxLength(150)
  signedOffBy: string;
}

export class LogGateDto {
  @IsInt()
  projectId: number;

  @IsInt()
  stepId: number;

  @IsOptional()
  @IsDateString()
  achievedAt?: string; // defaults to now

  @IsOptional()
  @IsInt()
  approverTeamId?: number;

  @IsString()
  @MaxLength(150)
  approverName: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateContinuityRoleDto {
  @IsInt()
  projectId: number;

  @IsInt()
  teamId: number;

  @IsEnum(ContinuityType)
  continuityType: ContinuityType;

  @IsOptional()
  @IsInt()
  opensAtStepId?: number;

  @IsOptional()
  @IsInt()
  closesAtStepId?: number;
}

export class RecordDeliverableDto {
  @IsInt()
  projectId: number;

  @IsInt()
  deliverableId: number;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  submittedBy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  version?: string;
}
