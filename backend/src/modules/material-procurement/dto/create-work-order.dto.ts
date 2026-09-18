import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
  IsBoolean,
  IsEnum,
} from 'class-validator';

import { Type } from 'class-transformer';

import { WorkOrderItemType } from '@/common/enums/work-order.enums';

// ============================================================
// ITEM
// ============================================================

export class CreateWorkOrderItemDto {
  @IsOptional()
  @IsNumber()
  sort_order?: number;

  @IsOptional()
  @IsEnum(WorkOrderItemType)
  item_type?: WorkOrderItemType;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsUUID()
  unit_id: string;

  @IsNumber()
  @Min(0)
  rate: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}

// ============================================================
// PAYMENT STAGE
// ============================================================

export class CreateWorkOrderPaymentStageDto {
  @IsOptional()
  @IsNumber()
  sort_order?: number;

  @IsString()
  stage_name: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}

// ============================================================
// WORK ORDER TERM
// ============================================================

export class CreateWorkOrderTermDto {
  @IsOptional()
  @IsNumber()
  sort_order?: number;

  @IsString()
  description: string;

  @IsOptional()
  @IsBoolean()
  is_mandatory?: boolean;
}

// ============================================================
// WORK ORDER
// ============================================================

export class CreateWorkOrderDto {
  // ----------------------------------------------------------
  // PROJECT
  // ----------------------------------------------------------

  @IsUUID()
  project_id: string;

  // ----------------------------------------------------------
  // VENDOR
  // ----------------------------------------------------------

  @IsUUID()
  vendor_id: string;

  // ----------------------------------------------------------
  // DOCUMENT
  // ----------------------------------------------------------

  @IsDateString()
  work_order_date: string;

  @IsOptional()
  @IsDateString()
  target_completion_date?: string;

  // ----------------------------------------------------------
  // PROJECT / SITE
  // ----------------------------------------------------------

  @IsOptional()
  @IsString()
  @MaxLength(255)
  agency?: string;

  @IsOptional()
  @IsString()
  site_address?: string;

  @IsOptional()
  @IsString()
  site_contact_person?: string;

  @IsOptional()
  @IsString()
  site_lead?: string;

  @IsOptional()
  @IsString()
  site_phone?: string;

  @IsOptional()
  @IsString()
  site_email?: string;

  @IsOptional()
  @IsString()
  site_gstin?: string;

  @IsOptional()
  @IsString()
  working_hours?: string;

  // ----------------------------------------------------------
  // COMMERCIAL
  // ----------------------------------------------------------

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  gst_percentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cartage?: number;

  @IsOptional()
  @IsString()
  payment_terms?: string;

  // ----------------------------------------------------------
  // TERMS TEMPLATE
  // ----------------------------------------------------------

  @IsOptional()
  @IsUUID()
  terms_template_id?: string;

  // ----------------------------------------------------------
  // ITEMS
  // ----------------------------------------------------------

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkOrderItemDto)
  items: CreateWorkOrderItemDto[];

  // ----------------------------------------------------------
  // PAYMENT STAGES
  // ----------------------------------------------------------

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkOrderPaymentStageDto)
  payment_stages?: CreateWorkOrderPaymentStageDto[];

  // ----------------------------------------------------------
  // MANUAL TERMS
  // ----------------------------------------------------------

  /**
   * Optional manual/custom terms.
   *
   * Normally use terms_template_id instead.
   * These are retained for custom Work Order clauses.
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkOrderTermDto)
  terms?: CreateWorkOrderTermDto[];
}
