import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpsertPhaseDto {
  @IsInt()
  @Min(1)
  phase_number: number;

  @IsString()
  phase_code: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration_min_days?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  duration_max_days?: number;

  @IsOptional()
  @IsString()
  parallel_work_note?: string;

  @IsOptional()
  @IsString()
  inclusion_note?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  gantt_start_offset_days?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  gantt_duration_days?: number;
}
