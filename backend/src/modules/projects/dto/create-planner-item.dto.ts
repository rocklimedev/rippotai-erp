import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePlannerItemDto {
  @IsUUID()
  phase_id: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  work_name?: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsOptional()
  @IsUUID()
  document_type_id?: string;

  @IsOptional()
  @IsDateString()
  planned_start_date?: string;

  @IsOptional()
  @IsDateString()
  planned_end_date?: string;

  @IsOptional()
  @IsUUID()
  assigned_to?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;

  @IsOptional()
  @IsUUID()
  created_by?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  location_ids?: string[];
}
