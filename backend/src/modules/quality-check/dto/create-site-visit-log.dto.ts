import {
  IsUUID,
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { SiteVisitType } from '../models/site-visit-log.model';

export class CreateSiteVisitLogDto {
  @IsUUID()
  projectId: string;

  @IsOptional()
  @IsUUID()
  visitorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  visitorRole?: string;

  @IsOptional()
  @IsEnum(SiteVisitType)
  visitType?: SiteVisitType;

  @IsDateString()
  visitedAt: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  purpose?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  calendarEventId?: string;
}
