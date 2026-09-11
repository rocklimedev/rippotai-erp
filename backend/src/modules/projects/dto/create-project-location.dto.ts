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

export class CreateProjectLocationDto {
  @IsOptional()
  @IsUUID()
  parent_id?: string;

  @IsEnum(PlannerLocationType)
  type: PlannerLocationType;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  code?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
}
