import {
  IsUUID,
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
} from 'class-validator';

export class CreateExecutionActivityDto {
  @IsUUID()
  project_id: string;

  @IsOptional()
  @IsUUID()
  stage_id?: string;

  @IsString()
  title: string;

  @IsOptional()
  description?: string;

  @IsDateString()
  activity_date: Date;

  @IsOptional()
  @IsNumber()
  planned_quantity?: number;

  @IsOptional()
  @IsNumber()
  completed_quantity?: number;

  @IsOptional()
  unit?: string;
}
