import {
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

import {
  PurchaseOrderSourceType,
  PurchaseOrderStatus,
} from '../models/purchase-order.model';

export class CreatePurchaseOrderItemDto {
  @IsUUID()
  material_id: string;

  @IsNumber()
  @Min(0.001)
  ordered_quantity: number;

  @IsNumber()
  @Min(0)
  rate: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  specification?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  unit?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsUUID()
  source_reference_id?: string;
}

export class CreatePurchaseOrderDto {
  @IsUUID()
  project_id: string;

  @IsOptional()
  @IsUUID()
  site_id?: string;

  @IsOptional()
  @IsUUID()
  vendor_id?: string;

  @IsDateString()
  po_date: string;

  @IsOptional()
  @IsDateString()
  target_delivery_date?: string;

  @IsOptional()
  @IsString()
  agency_name?: string;

  @IsOptional()
  @IsString()
  contact_person?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  vendor_gstin?: string;

  @IsOptional()
  @IsString()
  vendor_pan?: string;

  @IsOptional()
  @IsString()
  ship_to_address?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  gst_percent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cartage?: number;

  @IsOptional()
  @IsEnum(PurchaseOrderSourceType)
  source_type?: PurchaseOrderSourceType;

  @IsOptional()
  @IsUUID()
  source_reference_id?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  terms_and_conditions?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items: CreatePurchaseOrderItemDto[];
}

export class UpdatePurchaseOrderDto {
  @IsOptional()
  @IsDateString()
  target_delivery_date?: string;

  @IsOptional()
  @IsString()
  agency_name?: string;

  @IsOptional()
  @IsString()
  contact_person?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  vendor_gstin?: string;

  @IsOptional()
  @IsString()
  vendor_pan?: string;

  @IsOptional()
  @IsString()
  ship_to_address?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  gst_percent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cartage?: number;

  @IsOptional()
  @IsEnum(PurchaseOrderStatus)
  status?: PurchaseOrderStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  terms_and_conditions?: string;
}
