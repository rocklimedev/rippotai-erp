import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePurchaseOrderItemDto {
  @IsOptional() @IsString()
  materialRequirementId?: string;

  @IsString() @IsNotEmpty()
  description: string;

  @IsString() @IsNotEmpty()
  unit: string;

  @IsNumber() @Min(0.001)
  orderedQuantity: number;

  @IsNumber() @Min(0)
  unitRate: number;
}

export class CreatePurchaseOrderDto {
  @IsString() @IsNotEmpty()
  quotationId: string;

  @IsString() @IsNotEmpty()
  poNumber: string;

  @IsString() @IsNotEmpty()
  vendorName: string;

  @IsDateString()
  orderDate: string;

  @IsOptional() @IsDateString()
  expectedDeliveryDate?: string;

  @IsArray() @ValidateNested({ each: true }) @Type(() => CreatePurchaseOrderItemDto)
  items: CreatePurchaseOrderItemDto[];
}
