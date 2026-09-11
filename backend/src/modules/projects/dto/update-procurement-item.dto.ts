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

export class UpdateProcurementItemDto {
  @IsOptional()
  @IsEnum(ProcurementItemType)
  item_type?: ProcurementItemType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  category_name?: string;

  @IsOptional()
  @IsUUID()
  vendor_id?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  vendor_name?: string | null;

  @IsOptional()
  @IsDateString()
  estimate_finalised_at?: string | null;

  @IsOptional()
  @IsDateString()
  quotation_finalised_at?: string | null;

  @IsOptional()
  @IsDateString()
  planned_start_date?: string | null;

  @IsOptional()
  @IsDateString()
  planned_end_date?: string | null;

  @IsOptional()
  @IsDateString()
  purchase_date?: string | null;

  @IsOptional()
  @IsDateString()
  received_at_site_date?: string | null;

  @IsOptional()
  @IsEnum(PlannerItemStatus)
  status?: PlannerItemStatus;

  @IsOptional()
  @IsString()
  remarks?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
}
