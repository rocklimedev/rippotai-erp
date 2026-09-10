// src/modules/project-planner/dto/get-planner-items-query.dto.ts

import { IsOptional, IsUUID } from 'class-validator';

export class GetPlannerItemsQueryDto {
  @IsOptional()
  @IsUUID('4')
  phaseId?: string;
}
