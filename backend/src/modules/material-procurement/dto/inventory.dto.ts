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
 *
 * - RECEIPT
 * - ISSUE
 * - RETURN_FROM_CONTRACTOR
 * - RETURN_TO_VENDOR
 * - TRANSFER_IN
 * - TRANSFER_OUT
 * - ADJUSTMENT_IN
 * - ADJUSTMENT_OUT
 *
 * IMPORTANT:
 *
 * Unit is intentionally NOT accepted here.
 *
 * The unit is always derived from:
 *
 * material_id
 *      ↓
 * MaterialMaster
 *      ↓
 * unit_id
 *      ↓
 * InventoryTransaction.unit_id
 *
 * This guarantees that the inventory ledger always uses
 * the same unit configured for the material master.
 */
export class CreateInventoryTransactionDto {
  // ============================================================
  // PROJECT / SITE
  // ============================================================

  @IsUUID()
  project_id: string;

  @IsOptional()
  @IsUUID()
  site_id?: string;

  // ============================================================
  // MATERIAL
  // ============================================================

  @IsUUID()
  material_id: string;

  // ============================================================
  // TRANSACTION
  // ============================================================

  @IsDateString()
  transaction_date: string;

  @IsEnum(InventoryTransactionType)
  transaction_type: InventoryTransactionType;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  // ============================================================
  // REFERENCES
  // ============================================================

  @IsOptional()
  @IsEnum(InventoryReferenceType)
  reference_type?: InventoryReferenceType;

  @IsOptional()
  @IsUUID()
  reference_id?: string;

  @IsOptional()
  @IsUUID()
  reference_item_id?: string;

  // ============================================================
  // VENDOR / CONTRACTOR
  // ============================================================

  @IsOptional()
  @IsUUID()
  vendor_id?: string;

  @IsOptional()
  @IsUUID()
  contractor_id?: string;

  @IsOptional()
  @IsString()
  trade?: string;

  // ============================================================
  // WORK / STORAGE
  // ============================================================

  @IsOptional()
  @IsString()
  work_reference?: string;

  @IsOptional()
  @IsString()
  storage_location?: string;

  // ============================================================
  // CONDITION
  // ============================================================

  @IsOptional()
  @IsEnum(InventoryConditionStatus)
  condition_status?: InventoryConditionStatus;

  @IsOptional()
  @IsString()
  condition_notes?: string;

  // ============================================================
  // ISSUE INFORMATION
  // ============================================================

  @IsOptional()
  @IsString()
  issued_to?: string;

  @IsOptional()
  @IsUUID()
  issued_by?: string;

  // ============================================================
  // RECEIVING INFORMATION
  // ============================================================

  @IsOptional()
  @IsUUID()
  received_by?: string;

  // ============================================================
  // REMARKS
  // ============================================================

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
 * transaction_type and reference_type are intentionally NOT
 * included because InventoryService.issue() sets them:
 *
 * transaction_type = ISSUE
 * reference_type   = ISSUE
 *
 * Unit is also intentionally NOT accepted.
 *
 * It is derived from MaterialMaster.
 */
export class IssueMaterialDto {
  // ============================================================
  // PROJECT / SITE
  // ============================================================

  @IsUUID()
  project_id: string;

  @IsOptional()
  @IsUUID()
  site_id?: string;

  // ============================================================
  // MATERIAL
  // ============================================================

  @IsUUID()
  material_id: string;

  // ============================================================
  // TRANSACTION
  // ============================================================

  @IsDateString()
  transaction_date: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  // ============================================================
  // CONTRACTOR
  // ============================================================

  @IsOptional()
  @IsUUID()
  contractor_id?: string;

  // ============================================================
  // ISSUE INFORMATION
  // ============================================================

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

  // ============================================================
  // REMARKS
  // ============================================================

  @IsOptional()
  @IsString()
  remarks?: string;
}
