import {
  IsUUID,
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
  @IsUUID()
  assigneeTeamId?: string;

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
  @IsUUID()
  projectId: string;

  @IsUUID()
  stepId: string;

  @IsOptional()
  @IsDateString()
  achievedAt?: string; // defaults to now

  @IsOptional()
  @IsUUID()
  approverTeamId?: string;

  @IsString()
  @MaxLength(150)
  approverName: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateContinuityRoleDto {
  @IsUUID()
  projectId: string;

  @IsUUID()
  teamId: string;

  @IsEnum(ContinuityType)
  continuityType: ContinuityType;

  @IsOptional()
  @IsUUID()
  opensAtStepId?: string;

  @IsOptional()
  @IsUUID()
  closesAtStepId?: string;
}

export class RecordDeliverableDto {
  @IsUUID()
  projectId: string;

  @IsUUID()
  deliverableId: string;

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
