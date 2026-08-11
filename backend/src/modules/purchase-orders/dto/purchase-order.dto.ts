import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { PurchaseOrderStatus } from '../models/purchase-order.model';

export class CreatePurchaseOrderItemDto {
  @IsString()
  material_name: string;

  @IsUUID()
  @IsOptional()
  unit_id?: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  rate: number;
}

export class CreatePurchaseOrderDto {
  @IsString()
  po_number: string;

  @IsUUID()
  project_id: string;

  @IsUUID()
  vendor_id: string;

  @IsUUID()
  @IsOptional()
  estimate_id?: string;

  @IsEnum(PurchaseOrderStatus)
  @IsOptional()
  status?: PurchaseOrderStatus;

  @IsDateString()
  @IsOptional()
  expected_delivery_date?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items: CreatePurchaseOrderItemDto[];
}

export class UpdatePurchaseOrderDto extends PartialType(
  CreatePurchaseOrderDto,
) {}

export class IssuePurchaseOrderDto {
  @IsUUID()
  issued_by: string;
}
