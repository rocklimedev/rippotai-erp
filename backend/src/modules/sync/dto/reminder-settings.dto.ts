import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ReminderSettingsDto {
  @IsBoolean() enabled: boolean;
  @IsOptional() @IsString() @MaxLength(255) portal_id?: string;
  @IsOptional() @IsString() @MaxLength(255) project_id?: string;
  @IsOptional() @IsString() @MaxLength(255) tasklist_id?: string;
  @IsOptional() @IsString() @MaxLength(255) assignee_id?: string;
  @IsOptional() @IsString() @MaxLength(255) calendar_id?: string;
  @IsOptional() @IsString() @MaxLength(100) timezone?: string;
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  task_reminder_time?: string;
  @IsOptional() @IsInt() @Min(0) @Max(10080) reminder_minutes?: number;
}
