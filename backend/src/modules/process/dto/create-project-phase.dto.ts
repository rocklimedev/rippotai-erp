import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUUID,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProcessPhaseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  phase_no: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  span_label?: string | null;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_parallel?: boolean = false;

  @IsOptional()
  @IsUUID()
  lead_team_id?: string | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @Type(() => Number)
  pct_start?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @Type(() => Number)
  pct_end?: number | null;

  @IsOptional()
  @IsString()
  note?: string | null;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sort_order?: number = 0;
}
