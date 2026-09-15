import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

import { DeliveryChallanStatus } from '../models/delivery-challan.model';

import { MaterialConditionStatus } from '../models/delivery-challan-item.model';

export class CreateDeliveryChallanItemDto {
  @IsUUID()
  material_id: string;

  @IsOptional()
  @IsUUID()
  purchase_order_item_id?: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  accepted_quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  shortage_quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  damaged_quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rejected_quantity?: number;

  @IsOptional()
  @IsEnum(MaterialConditionStatus)
  condition_status?: MaterialConditionStatus;

  @IsOptional()
  @IsString()
  condition_notes?: string;

  @IsOptional()
  @IsString()
  stored_at?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  specification?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateDeliveryChallanDto {
  @IsUUID()
  project_id: string;

  @IsOptional()
  @IsUUID()
  site_id?: string;

  @IsOptional()
  @IsUUID()
  purchase_order_id?: string;

  @IsOptional()
  @IsUUID()
  vendor_id?: string;

  @IsDateString()
  challan_date: string;

  @IsOptional()
  @IsString()
  site_address?: string;

  @IsOptional()
  @IsBoolean()
  gate_pass_received?: boolean;

  @IsOptional()
  @IsBoolean()
  material_checked?: boolean;

  @IsOptional()
  @IsString()
  general_remarks?: string;

  @IsOptional()
  @IsString()
  discrepancy_notes?: string;

  @IsOptional()
  @IsString()
  attachment_url?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDeliveryChallanItemDto)
  items: CreateDeliveryChallanItemDto[];
}

export class UpdateDeliveryChallanDto {
  @IsOptional()
  @IsEnum(DeliveryChallanStatus)
  status?: DeliveryChallanStatus;

  @IsOptional()
  @IsBoolean()
  gate_pass_received?: boolean;

  @IsOptional()
  @IsBoolean()
  material_checked?: boolean;

  @IsOptional()
  @IsString()
  general_remarks?: string;

  @IsOptional()
  @IsString()
  discrepancy_notes?: string;

  @IsOptional()
  @IsString()
  attachment_url?: string;
}
