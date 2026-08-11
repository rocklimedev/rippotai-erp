import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateDeliveryChallanItemDto {
  @IsUUID()
  @IsOptional()
  purchase_order_item_id?: string;

  @IsString()
  material_name: string;

  @IsNumber()
  @Min(0)
  quantity_delivered: number;

  @IsString()
  @IsOptional()
  condition_notes?: string;
}

export class CreateDeliveryChallanDto {
  @IsString()
  challan_number: string;

  @IsUUID()
  purchase_order_id: string;

  @IsUUID()
  project_id: string;

  @IsDateString()
  @IsOptional()
  delivered_at?: string;

  @IsUUID()
  @IsOptional()
  received_by?: string;

  @IsString()
  @IsOptional()
  site_stage?: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDeliveryChallanItemDto)
  items: CreateDeliveryChallanItemDto[];
}
