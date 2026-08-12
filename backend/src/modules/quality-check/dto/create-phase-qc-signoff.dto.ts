import {
  IsUUID,
  IsOptional,
  IsEnum,
  IsDateString,
  IsString,
} from 'class-validator';
import { PhaseQcSignoffStatus } from '../models/phase-qc-signoff.model';

export class CreatePhaseQcSignoffDto {
  @IsUUID()
  projectId: string;

  @IsOptional()
  @IsUUID()
  stepId?: string;

  @IsOptional()
  @IsUUID()
  checklistId?: string;

  @IsOptional()
  @IsUUID()
  tradeTeamId?: string;

  @IsOptional()
  @IsEnum(PhaseQcSignoffStatus)
  status?: PhaseQcSignoffStatus;

  @IsOptional()
  @IsUUID()
  checkedBy?: string;

  @IsOptional()
  @IsDateString()
  checkedAt?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
