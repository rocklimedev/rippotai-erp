import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { InventoryTransactionType } from '../models/site-inventory-transaction.model';
export class CreateSiteInventoryTransactionDto {
  @IsUUID()
  inventory_item_id: string;

  @IsEnum(InventoryTransactionType)
  type: InventoryTransactionType;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsString()
  @IsOptional()
  reference_type?: string;

  @IsUUID()
  @IsOptional()
  reference_id?: string;

  @IsUUID()
  @IsOptional()
  recorded_by?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}
