import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class UpdateProjectStepProgressDto {
  @IsOptional()
  @IsEnum(['not_started', 'in_progress', 'completed', 'blocked', 'skipped'])
  status?: 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'skipped';

  @IsOptional()
  @IsUUID()
  assignee_id?: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsDateString()
  started_at?: string;

  @IsOptional()
  @IsDateString()
  completed_at?: string;

  @IsOptional()
  @IsUUID()
  signed_off_by?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
