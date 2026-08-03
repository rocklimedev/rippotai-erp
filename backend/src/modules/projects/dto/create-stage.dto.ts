import { IsString, IsOptional, IsUUID, IsDateString } from 'class-validator';

export class CreateExecutionStageDto {
  @IsUUID()
  project_id: string;

  @IsString()
  name: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  @IsDateString()
  planned_start_date?: Date;

  @IsOptional()
  @IsDateString()
  planned_end_date?: Date;
}
