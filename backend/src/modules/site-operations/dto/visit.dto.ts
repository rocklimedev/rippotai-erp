import {
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  IsEnum,
  MaxLength,
  IsDateString,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import {
  VisitorType,
  VisitStatus,
} from '../../../common/enums/site-operations.enums';

export class CreateVisitAssignmentDto {
  @IsOptional()
  @IsUUID()
  stageId?: string;

  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  scheduledDate: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  purpose?: string;

  @IsUUID()
  projectId: string;

  @IsEnum(VisitorType)
  visitorType: VisitorType;

  @IsOptional()
  @IsInt()
  @Min(1)
  teamId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  externalPartyName?: string;
}

export class UpdateVisitAssignmentDto extends PartialType(
  CreateVisitAssignmentDto,
) {}

export class LogSiteVisitDto {
  @IsUUID()
  projectId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  visitAssignmentId?: number;

  @IsEnum(VisitorType)
  visitorType: VisitorType;

  @IsString()
  @MaxLength(150)
  visitorName: string;

  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  scheduledDate: string;

  @IsOptional()
  @IsDateString()
  actualVisitAt?: string;

  @IsOptional()
  @IsEnum(VisitStatus)
  status?: VisitStatus;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  purpose?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  @MaxLength(150)
  loggedBy: string;
}

export class UpdateSiteVisitDto {
  @IsOptional()
  @IsEnum(VisitStatus)
  status?: VisitStatus;

  @IsOptional()
  @IsDateString()
  actualVisitAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
