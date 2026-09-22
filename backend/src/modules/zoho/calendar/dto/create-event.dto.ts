import {
  IsArray,
  IsBoolean,
  IsHexColor,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

export class ZohoEventDateTimeDto {
  /**
   * Zoho format:
   *
   * 20260930T103000Z
   *
   * or for all-day:
   *
   * 20260930
   */
  @IsString()
  start: string;

  @IsString()
  end: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class ZohoEventAttendeeDto {
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  zid?: string;

  /**
   * 0 = Guest
   * 1 = View
   * 2 = Invite
   * 3 = Edit
   */
  @IsOptional()
  @IsInt()
  permission?: number;

  /**
   * 0 = Non participant
   * 1 = Required
   * 2 = Optional
   */
  @IsOptional()
  @IsInt()
  attendance?: number;
}

export class ZohoEventReminderDto {
  @IsString()
  action: string;

  @IsInt()
  minutes: number;
}

export class CreateZohoEventDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @ValidateNested()
  @Type(() => ZohoEventDateTimeDto)
  dateandtime: ZohoEventDateTimeDto;

  @IsOptional()
  @IsBoolean()
  isallday?: boolean;

  @IsOptional()
  @IsBoolean()
  isprivate?: boolean;

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(12000)
  richtext_description?: string;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ZohoEventAttendeeDto)
  attendees?: ZohoEventAttendeeDto[];

  @IsOptional()
  @IsArray()
  group_attendees?: Array<{
    zid: string;
  }>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ZohoEventReminderDto)
  reminders?: ZohoEventReminderDto[];

  @IsOptional()
  @IsInt()
  transparency?: number;

  @IsOptional()
  @IsString()
  conference?: 'zmeeting' | 'none';

  @IsOptional()
  @IsInt()
  notifyType?: number;

  @IsOptional()
  @IsBoolean()
  allowForwarding?: boolean;

  @IsOptional()
  @IsString()
  rrule?: string;
}
