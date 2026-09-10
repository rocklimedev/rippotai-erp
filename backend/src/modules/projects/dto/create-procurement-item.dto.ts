import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

import {
  PlannerItemStatus,
  ProcurementItemType,
} from '@/common/enums/project-planner.enum';

export class CreateProcurementItemDto {
  @IsEnum(ProcurementItemType)
  item_type: ProcurementItemType;

  @IsString()
  @MaxLength(255)
  category_name: string;

  @IsOptional()
  @IsUUID()
  vendor_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  vendor_name?: string;

  @IsOptional()
  @IsDateString()
  estimate_finalised_at?: string;

  @IsOptional()
  @IsDateString()
  quotation_finalised_at?: string;

  @IsOptional()
  @IsDateString()
  planned_start_date?: string;

  @IsOptional()
  @IsDateString()
  planned_end_date?: string;

  @IsOptional()
  @IsDateString()
  purchase_date?: string;

  @IsOptional()
  @IsDateString()
  received_at_site_date?: string;

  @IsOptional()
  @IsEnum(PlannerItemStatus)
  status?: PlannerItemStatus;

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
}
