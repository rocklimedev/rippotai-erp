// create-task.dto.ts
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/** App-facing statuses (UI). Mapped to Zoho in the service. */
export const ZOHO_TASK_STATUSES = [
  'todo',
  'in_progress',
  'inprogress', // accept both spellings
  'blocked',
  'completed',
  'open',
  'closed',
] as const;

export const ZOHO_TASK_PRIORITIES = [
  'none',
  'low',
  'medium',
  'high',
  'critical',
] as const;

export class CreateZohoTaskDto {
  @IsString()
  @MaxLength(3000)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  description?: string;

  @IsOptional()
  @IsIn([...ZOHO_TASK_STATUSES])
  status?: (typeof ZOHO_TASK_STATUSES)[number];

  @IsOptional()
  @IsIn([...ZOHO_TASK_PRIORITIES])
  priority?: (typeof ZOHO_TASK_PRIORITIES)[number];

  /** Prefer string so large Zoho IDs stay exact */
  @IsOptional()
  @IsString()
  due_date?: string;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsDateString()
  reminderDate?: string;

  @IsOptional()
  @IsBoolean()
  emailReminder?: boolean;

  @IsOptional()
  @IsBoolean()
  popupReminder?: boolean;

  /** Zoho ZUID / person id — string avoids Number precision issues */
  @IsOptional()
  @IsString()
  assignee?: string;

  @IsOptional()
  @IsString()
  assignee_id?: string;

  @IsOptional()
  @IsString()
  tasklist_id?: string;

  @IsOptional()
  @IsString()
  parentTaskId?: string;

  // keep recurrence fields if you still need them…
}
