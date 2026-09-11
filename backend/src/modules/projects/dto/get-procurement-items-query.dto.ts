// src/modules/project-planner/dto/get-procurement-items-query.dto.ts

import { IsEnum, IsOptional } from 'class-validator';
import { ProcurementItemType } from '@/common/enums/project-planner.enum';

export class GetProcurementItemsQueryDto {
  @IsOptional()
  @IsEnum(ProcurementItemType)
  itemType?: ProcurementItemType;
}
