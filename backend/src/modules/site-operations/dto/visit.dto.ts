import {
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  MaxLength,
  IsDateString,
  IsUUID,
} from 'class-validator';
import {
  VisitorType,
  VisitFrequency,
  VisitStatus,
} from '../../../common/enums/site-operations.enums';

export class CreateVisitAssignmentDto {
  @IsUUID()
  projectId: string;

  @IsEnum(VisitorType)
  visitorType: VisitorType;

  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  externalPartyName?: string;

  @IsEnum(VisitFrequency)
  frequency: VisitFrequency;

  @IsOptional()
  @IsArray()
  scheduleDays?: number[];
}

export class LogSiteVisitDto {
  @IsUUID()
  projectId: string;

  @IsOptional()
  @IsUUID()
  visitAssignmentId?: string;

  @IsEnum(VisitorType)
  visitorType: VisitorType;

  @IsString()
  @MaxLength(150)
  visitorName: string;

  @IsDateString()
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
