import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsArray,
  ArrayMaxSize,
  IsEmail,
  MaxLength,
} from 'class-validator';
import { CalendarEventType } from '../models/calender-event.model';

export class CreateCalendarEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsEnum(CalendarEventType)
  type: CalendarEventType;

  @IsISO8601()
  starts_at: string;

  @IsOptional()
  @IsISO8601()
  ends_at?: string;

  @IsOptional()
  @IsBoolean()
  all_day?: boolean;

  @IsOptional()
  @IsUUID()
  project_id?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsEmail({}, { each: true })
  attendees?: string[];
}
