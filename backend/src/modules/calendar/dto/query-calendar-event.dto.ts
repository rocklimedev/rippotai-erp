import { Type } from 'class-transformer';
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsISO8601,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { CalendarEventType } from '../models/calender-event.model';

export class QueryCalendarEventDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number = 500;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  // Filter events on/after this ISO date
  @IsOptional()
  @IsISO8601()
  from?: string;

  // Filter events on/before this ISO date
  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @IsEnum(CalendarEventType)
  type?: CalendarEventType;

  @IsOptional()
  @IsUUID()
  project_id?: string;
}
