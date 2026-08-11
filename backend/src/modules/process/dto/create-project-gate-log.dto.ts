import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateProjectGateLogDto {
  @IsUUID()
  project_id: string;

  @IsUUID()
  step_id: string;

  @IsString()
  gate_label: string;

  @IsOptional()
  @IsDateString()
  crossed_at?: string;

  @IsOptional()
  @IsUUID()
  crossed_by?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
