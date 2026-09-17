import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class UpsertPhaseDto {
  @IsUUID()
  @IsNotEmpty()
  project_phase_id: string;

  @IsInt()
  @Min(1)
  phase_number: number;

  @IsString()
  @IsNotEmpty()
  phase_code: string;

  @IsString()
  @IsNotEmpty()
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
