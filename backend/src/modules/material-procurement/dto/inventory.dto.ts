import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

import {
  InventoryConditionStatus,
  InventoryReferenceType,
  InventoryTransactionType,
} from '../models/inventory-transaction.model';

/**
 * ============================================================
 * CREATE INVENTORY TRANSACTION
 * ============================================================
 *
 * Used for:
 * - RECEIPT
 * - ISSUE
 * - RETURN_FROM_CONTRACTOR
 * - RETURN_TO_VENDOR
 * - TRANSFER_IN
 * - TRANSFER_OUT
 * - ADJUSTMENT_IN
 * - ADJUSTMENT_OUT
 */
export class CreateInventoryTransactionDto {
  @IsUUID()
  project_id: string;

  @IsOptional()
  @IsUUID()
  site_id?: string;

  @IsUUID()
  material_id: string;

  @IsDateString()
  transaction_date: string;

  @IsEnum(InventoryTransactionType)
  transaction_type: InventoryTransactionType;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsOptional()
  @IsString()
  unit?: string;

  /**
   * Must match InventoryReferenceType.
   *
   * Previously this was:
   *   reference_type?: string;
   *
   * That caused:
   *   Type 'string | null' is not assignable to
   *   type 'InventoryReferenceType | null | undefined'
   */
  @IsOptional()
  @IsEnum(InventoryReferenceType)
  reference_type?: InventoryReferenceType;

  @IsOptional()
  @IsUUID()
  reference_id?: string;

  @IsOptional()
  @IsUUID()
  reference_item_id?: string;

  @IsOptional()
  @IsUUID()
  vendor_id?: string;

  @IsOptional()
  @IsUUID()
  contractor_id?: string;

  @IsOptional()
  @IsString()
  trade?: string;

  @IsOptional()
  @IsString()
  work_reference?: string;

  @IsOptional()
  @IsString()
  storage_location?: string;

  @IsOptional()
  @IsEnum(InventoryConditionStatus)
  condition_status?: InventoryConditionStatus;

  @IsOptional()
  @IsString()
  condition_notes?: string;

  @IsOptional()
  @IsString()
  issued_to?: string;

  @IsOptional()
  @IsUUID()
  issued_by?: string;

  @IsOptional()
  @IsUUID()
  received_by?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

/**
 * ============================================================
 * ISSUE MATERIAL
 * ============================================================
 *
 * Used specifically for material issue operations.
 *
 * reference_type is intentionally NOT included here because
 * InventoryService.issue() sets it automatically to:
 *
 *   InventoryReferenceType.ISSUE
 *
 * and transaction_type automatically to:
 *
 *   InventoryTransactionType.ISSUE
 */
export class IssueMaterialDto {
  @IsUUID()
  project_id: string;

  @IsOptional()
  @IsUUID()
  site_id?: string;

  @IsUUID()
  material_id: string;

  @IsDateString()
  transaction_date: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsUUID()
  contractor_id?: string;

  @IsOptional()
  @IsString()
  issued_to?: string;

  @IsOptional()
  @IsString()
  trade?: string;

  @IsOptional()
  @IsString()
  work_reference?: string;

  @IsOptional()
  @IsString()
  storage_location?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
