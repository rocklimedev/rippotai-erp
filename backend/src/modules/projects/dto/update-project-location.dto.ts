import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

import { PlannerLocationType } from '@/common/enums/project-planner.enum';

export class UpdateProjectLocationDto {
  @IsOptional()
  @IsUUID()
  parent_id?: string | null;

  @IsOptional()
  @IsEnum(PlannerLocationType)
  type?: PlannerLocationType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  code?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
}
