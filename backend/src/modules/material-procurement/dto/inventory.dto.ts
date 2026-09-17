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
  InventoryDirection,
  InventoryReferenceType,
  InventoryTransactionType,
} from '../models/inventory-transaction.model';

/**
 * ============================================================
 * CREATE INVENTORY TRANSACTION
 * ============================================================
 *
 * Generic inventory transaction DTO.
 *
 * Supported transaction types:
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
 * unit_id is intentionally NOT accepted.
 *
 * Unit is always derived from:
 *
 * material_id
 *      ↓
 * MaterialMaster
 *      ↓
 * unit_id
 *      ↓
 * InventoryTransaction.unit_id
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
 * Used specifically when material leaves project/site inventory.
 *
 * Service automatically sets:
 *
 * transaction_type = ISSUE
 * reference_type   = ISSUE
 *
 * Unit is derived from MaterialMaster.
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

/**
 * ============================================================
 * ADD / RECEIVE INVENTORY
 * ============================================================
 *
 * Used from the Inventory UI when material is manually added
 * to project inventory.
 *
 * Example:
 *
 * Material: Plywood 18mm
 * Quantity: 100
 * Site: Main Site
 *
 * This creates:
 *
 * transaction_type = RECEIPT
 */
export class AddInventoryDto {
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
  // QUANTITY / DATE
  // ============================================================

  @IsDateString()
  transaction_date: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  // ============================================================
  // SOURCE
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
  // VENDOR
  // ============================================================

  @IsOptional()
  @IsUUID()
  vendor_id?: string;

  // ============================================================
  // STORAGE
  // ============================================================

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
  // RECEIVING
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
 * ADJUST INVENTORY
 * ============================================================
 *
 * Used for physical stock corrections.
 *
 * IN:
 *   increases stock
 *
 * OUT:
 *   decreases stock
 *
 * Examples:
 *
 * Physical count says:
 *
 * System = 80
 * Physical = 85
 *
 * Adjustment:
 *
 * direction = IN
 * quantity  = 5
 *
 * ------------------------------------------------------------
 *
 * System = 80
 * Physical = 75
 *
 * Adjustment:
 *
 * direction = OUT
 * quantity  = 5
 */
export class AdjustInventoryDto {
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
  // ADJUSTMENT
  // ============================================================

  @IsDateString()
  transaction_date: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsEnum(InventoryDirection)
  direction: InventoryDirection;

  // ============================================================
  // STORAGE
  // ============================================================

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
  // REASON
  // ============================================================

  @IsString()
  reason: string;

  // ============================================================
  // REMARKS
  // ============================================================

  @IsOptional()
  @IsString()
  remarks?: string;
}

/**
 * ============================================================
 * OPENING STOCK
 * ============================================================
 *
 * Opening stock is intentionally represented through the
 * inventory ledger instead of a separate stock table.
 *
 * The service creates:
 *
 * ADJUSTMENT_IN
 *
 * with reference:
 *
 * ADJUSTMENT
 */
export class OpeningStockDto {
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
  // OPENING STOCK
  // ============================================================

  @IsDateString()
  transaction_date: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  // ============================================================
  // STORAGE
  // ============================================================

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
  // REMARKS
  // ============================================================

  @IsOptional()
  @IsString()
  remarks?: string;
}

/**
 * ============================================================
 * TRANSFER INVENTORY
 * ============================================================
 *
 * Transfers material from one project site to another.
 *
 * Example:
 *
 * Main Site
 *    ↓
 * Floor 1
 *
 * Service creates:
 *
 * TRANSFER_OUT
 * TRANSFER_IN
 *
 * Both use the same UUID reference_id.
 */
export class TransferInventoryDto {
  // ============================================================
  // PROJECT
  // ============================================================

  @IsUUID()
  project_id: string;

  // ============================================================
  // SITES
  // ============================================================

  @IsUUID()
  from_site_id: string;

  @IsUUID()
  to_site_id: string;

  // ============================================================
  // MATERIAL
  // ============================================================

  @IsUUID()
  material_id: string;

  // ============================================================
  // QUANTITY / DATE
  // ============================================================

  @IsDateString()
  transaction_date: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  // ============================================================
  // EXISTING TRANSFER REFERENCE
  // ============================================================
  //
  // Optional when creating a new transfer.
  //
  // Useful when another module already generated a UUID.
  //

  @IsOptional()
  @IsUUID()
  reference_id?: string;

  @IsOptional()
  @IsUUID()
  reference_item_id?: string;

  // ============================================================
  // SOURCE STORAGE
  // ============================================================

  @IsOptional()
  @IsString()
  from_storage_location?: string;

  // ============================================================
  // DESTINATION STORAGE
  // ============================================================

  @IsOptional()
  @IsString()
  to_storage_location?: string;

  // ============================================================
  // ISSUE / RECEIVING
  // ============================================================

  @IsOptional()
  @IsUUID()
  issued_by?: string;

  @IsOptional()
  @IsUUID()
  received_by?: string;

  // ============================================================
  // WORK REFERENCE
  // ============================================================

  @IsOptional()
  @IsString()
  work_reference?: string;

  // ============================================================
  // REMARKS
  // ============================================================

  @IsOptional()
  @IsString()
  remarks?: string;
}

/**
 * ============================================================
 * RETURN INVENTORY
 * ============================================================
 *
 * Supports:
 *
 * RETURN_FROM_CONTRACTOR
 * RETURN_TO_VENDOR
 *
 * RETURN_FROM_CONTRACTOR:
 *   stock IN
 *
 * RETURN_TO_VENDOR:
 *   stock OUT
 */
export class ReturnInventoryDto {
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
  // RETURN
  // ============================================================

  @IsDateString()
  transaction_date: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsEnum([
    InventoryTransactionType.RETURN_FROM_CONTRACTOR,
    InventoryTransactionType.RETURN_TO_VENDOR,
  ])
  return_type: InventoryTransactionType;

  // ============================================================
  // REFERENCE
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
  // VENDOR
  // ============================================================

  @IsOptional()
  @IsUUID()
  vendor_id?: string;

  // ============================================================
  // CONTRACTOR
  // ============================================================

  @IsOptional()
  @IsUUID()
  contractor_id?: string;

  // ============================================================
  // TRADE
  // ============================================================

  @IsOptional()
  @IsString()
  trade?: string;

  // ============================================================
  // STORAGE
  // ============================================================

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
  // RECEIVING
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
 * DELIVERY CHALLAN RECEIPT
 * ============================================================
 *
 * Used when accepted material from a Delivery Challan enters
 * project inventory.
 *
 * The DC item is the source reference.
 *
 * reference_type:
 *   DELIVERY_CHALLAN
 *
 * reference_id:
 *   delivery_challan.id
 *
 * reference_item_id:
 *   delivery_challan_item.id
 *
 * Supports partial receiving.
 */
export class ReceiveDeliveryInventoryDto {
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
  // DELIVERY CHALLAN
  // ============================================================

  @IsUUID()
  delivery_challan_id: string;

  @IsUUID()
  delivery_challan_item_id: string;

  // ============================================================
  // RECEIVING
  // ============================================================

  @IsDateString()
  transaction_date: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  /**
   * Accepted quantity for the DC item.
   *
   * This allows the inventory service to calculate:
   *
   * accepted quantity
   * -
   * already received
   * =
   * remaining quantity
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  accepted_quantity?: number;

  // ============================================================
  // VENDOR
  // ============================================================

  @IsOptional()
  @IsUUID()
  vendor_id?: string;

  // ============================================================
  // STORAGE
  // ============================================================

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
  // RECEIVED BY
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
