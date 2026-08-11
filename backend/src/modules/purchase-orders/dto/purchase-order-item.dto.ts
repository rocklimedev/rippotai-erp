import { PartialType } from '@nestjs/mapped-types';
import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreatePurchaseOrderItemDto {
  @IsUUID()
  purchase_order_id: string;

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

export class UpdatePurchaseOrderItemDto extends PartialType(
  CreatePurchaseOrderItemDto,
) {
  @IsNumber()
  @Min(0)
  @IsOptional()
  delivered_quantity?: number;
}
