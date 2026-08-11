import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateProcessStepDto {
  @IsUUID()
  phase_id: string;

  @IsOptional()
  @IsString()
  step_no?: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsBoolean()
  is_gate?: boolean;

  @IsOptional()
  @IsString()
  gate_between?: string;

  @IsOptional()
  @IsBoolean()
  is_continuous?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  pct_start?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  pct_end?: number;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsNumber()
  sort_order?: number;

  @IsOptional()
  @IsUUID(undefined, { each: true })
  team_ids?: string[];

  @IsOptional()
  @IsUUID(undefined, { each: true })
  deliverable_ids?: string[];
}
