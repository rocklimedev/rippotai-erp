import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { InventoryTransactionType } from '../../../common/enums/inventory-transaction-type.enum';

export class RecordInventoryTransactionDto {
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @IsOptional()
  @IsString()
  materialRequirementId?: string;

  @IsString()
  @IsNotEmpty()
  materialName: string;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsEnum(InventoryTransactionType)
  type: InventoryTransactionType;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsOptional()
  @IsString()
  purchaseOrderId?: string;

  @IsOptional()
  @IsString()
  deliveryChallanId?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  transactedBy?: string;
}
