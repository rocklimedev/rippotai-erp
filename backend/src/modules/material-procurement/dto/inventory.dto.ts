import {
  IsDateString,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  IsNotEmpty,
  Min,
} from 'class-validator';

import {
  InventoryConditionStatus,
  InventoryDirection,
  InventoryReferenceType,
  InventoryTransactionType,
  YesNoNA,
} from '../models/inventory-transaction.model';
export interface MaterialReceivedRegisterRow {
  id: string;
  date: Date | string;
  material_id: string;
  material_code: string | null;
  material_description: string | null;
  brand: string | null;
  received_from: string | null;
  vendor_id: string | null;
  for_which_work: string | null;
  qty: number;
  unit: string | null;
  challan_bill_no: string | null;
  gate_pass_received: string | null;
  material_checked: string | null;
  condition_shortage_noted: string | null;
  stored_at: string | null;
  received_by: string | null;
  remarks: string | null;
  transaction_type: InventoryTransactionType;
  reference_type: InventoryReferenceType | null;
  reference_id: string | null;
  reversal_of_id: string | null;
  balance_after: number;
}

export interface MaterialIssuedRegisterRow {
  id: string;
  date: Date | string;
  material_id: string;
  material_code: string | null;
  material_description: string | null;
  qty_issued: number;
  unit: string | null;
  issued_to: string | null;
  contractor_id: string | null;
  trade: string | null;
  for_which_work: string | null;
  issued_by: string | null;
  remarks: string | null;
  transaction_type: InventoryTransactionType;
  reference_type: InventoryReferenceType | null;
  reference_id: string | null;
  reversal_of_id: string | null;
  balance_after: number;
}
// ============================================================
// CREATE INVENTORY TRANSACTION
// ============================================================
//
// Generic inventory ledger entry.
//
// Supported transaction types:
//
// RECEIPT
// ISSUE
// RETURN_FROM_CONTRACTOR
// RETURN_TO_VENDOR
// TRANSFER_IN
// TRANSFER_OUT
// ADJUSTMENT_IN
// ADJUSTMENT_OUT
//
// IMPORTANT:
//
// unit_id is intentionally NOT accepted.
//
// Unit is always derived:
//
// material_id
//     ↓
// MaterialMaster
//     ↓
// unit_id
//     ↓
// InventoryTransaction.unit_id
// ============================================================

export class CreateInventoryTransactionDto {
  // ============================================================
  // PROJECT / SITE
  // ============================================================

  @IsUUID()
  project_id: string;

  // AFTER
  @IsOptional()
  @IsString()
  @MaxLength(255)
  site_location?: string;
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
  // DELIVERY CHALLAN / REGISTER
  // ============================================================

  @IsOptional()
  @IsString()
  challan_bill_no?: string;

  @IsOptional()
  @IsEnum(YesNoNA)
  gate_pass_received?: YesNoNA;

  @IsOptional()
  @IsEnum(YesNoNA)
  material_checked?: YesNoNA;

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

// ============================================================
// ISSUE MATERIAL
// ============================================================
//
// Used when material leaves project/site inventory.
//
// Service automatically sets:
//
// transaction_type = ISSUE
// reference_type   = ISSUE
//
// Direction is automatically derived as OUT.
// Unit is automatically derived from MaterialMaster.
// ============================================================

export class IssueMaterialDto {
  // ============================================================
  // PROJECT / SITE
  // ============================================================

  @IsUUID()
  project_id: string;

  // AFTER
  @IsOptional()
  @IsString()
  @MaxLength(255)
  site_location?: string;
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
  // ISSUED BY
  // ============================================================

  @IsOptional()
  @IsUUID()
  issued_by?: string;

  // ============================================================
  // REMARKS
  // ============================================================

  @IsOptional()
  @IsString()
  remarks?: string;
}

// ============================================================
// ADD / RECEIVE INVENTORY
// ============================================================
//
// Manual inventory receipt.
//
// Service automatically sets:
//
// transaction_type = RECEIPT
//
// Example:
//
// Material: Plywood 18mm
// Quantity: 100
// Site: Main Site
//
// Creates:
//
// RECEIPT +100
// ============================================================

export class AddInventoryDto {
  // ============================================================
  // PROJECT / SITE
  // ============================================================

  @IsUUID()
  project_id: string;
  // AFTER
  @IsOptional()
  @IsString()
  @MaxLength(255)
  site_location?: string;
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
  // DELIVERY CHALLAN / REGISTER
  // ============================================================

  @IsOptional()
  @IsString()
  challan_bill_no?: string;

  @IsOptional()
  @IsEnum(YesNoNA)
  gate_pass_received?: YesNoNA;

  @IsOptional()
  @IsEnum(YesNoNA)
  material_checked?: YesNoNA;

  // ============================================================
  // VENDOR
  // ============================================================

  @IsOptional()
  @IsUUID()
  vendor_id?: string;

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

// ============================================================
// ADJUST INVENTORY
// ============================================================
//
// Physical stock correction.
//
// Example:
//
// System = 80
// Physical = 85
//
// direction = IN
// quantity  = 5
//
// OR:
//
// System = 80
// Physical = 75
//
// direction = OUT
// quantity  = 5
//
// Service automatically converts direction to:
//
// ADJUSTMENT_IN
// ADJUSTMENT_OUT
// ============================================================

export class AdjustInventoryDto {
  // ============================================================
  // PROJECT / SITE
  // ============================================================

  @IsUUID()
  project_id: string;
  // AFTER
  @IsOptional()
  @IsString()
  @MaxLength(255)
  site_location?: string;
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

// ============================================================
// OPENING STOCK
// ============================================================
//
// Opening stock is represented through the same inventory ledger.
//
// Service creates:
//
// ADJUSTMENT_IN
//
// reference_type:
//
// ADJUSTMENT
//
// No separate stock table is required.
// ============================================================

export class OpeningStockDto {
  // ============================================================
  // PROJECT / SITE
  // ============================================================

  @IsUUID()
  project_id: string;

  // AFTER
  @IsOptional()
  @IsString()
  @MaxLength(255)
  site_location?: string;
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

// ============================================================
// TRANSFER INVENTORY
// ============================================================
//
// Transfers stock between two sites within the same project.
//
// Example:
//
// Main Site
//     ↓
// Floor 1
//
// Service creates:
//
// TRANSFER_OUT
// TRANSFER_IN
//
// Both share the same reference_id.
// ============================================================

export class TransferInventoryDto {
  // ============================================================
  // PROJECT
  // ============================================================

  @IsUUID()
  project_id: string;

  // ============================================================
  // SOURCE / DESTINATION
  // ============================================================

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  from_site_location: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  to_site_location: string;
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
  // TRANSFER REFERENCE
  // ============================================================

  /**
   * Optional externally generated transfer UUID.
   *
   * If omitted, the service generates one.
   */
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

// ============================================================
// RETURN INVENTORY
// ============================================================
//
// Supports:
//
// RETURN_FROM_CONTRACTOR
//     → IN
//
// RETURN_TO_VENDOR
//     → OUT
// ============================================================

export class ReturnInventoryDto {
  // ============================================================
  // PROJECT / SITE
  // ============================================================

  @IsUUID()
  project_id: string;

  // AFTER
  @IsOptional()
  @IsString()
  @MaxLength(255)
  site_location?: string;
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

  @IsIn([
    InventoryTransactionType.RETURN_FROM_CONTRACTOR,
    InventoryTransactionType.RETURN_TO_VENDOR,
  ])
  return_type:
    | InventoryTransactionType.RETURN_FROM_CONTRACTOR
    | InventoryTransactionType.RETURN_TO_VENDOR;

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
  // RECEIVING
  // ============================================================

  @IsOptional()
  @IsUUID()
  received_by?: string;

  // ============================================================
  // ISSUE / RETURN TO VENDOR
  // ============================================================

  @IsOptional()
  @IsUUID()
  issued_by?: string;

  // ============================================================
  // REMARKS
  // ============================================================

  @IsOptional()
  @IsString()
  remarks?: string;
}

// ============================================================
// RECEIVE FROM DELIVERY CHALLAN
// ============================================================
//
// Creates:
//
// RECEIPT
//
// Reference:
//
// reference_type     = DELIVERY_CHALLAN
// reference_id      = delivery_challan.id
// reference_item_id = delivery_challan_item.id
//
// Supports partial receiving.
// ============================================================

export class ReceiveDeliveryInventoryDto {
  // ============================================================
  // PROJECT / SITE
  // ============================================================

  @IsUUID()
  project_id: string;

  // AFTER
  @IsOptional()
  @IsString()
  @MaxLength(255)
  site_location?: string;
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
  // TRANSACTION
  // ============================================================

  @IsDateString()
  transaction_date: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  /**
   * Total accepted quantity for the DC item.
   *
   * Remaining receivable quantity:
   *
   * accepted_quantity - already_received
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  accepted_quantity?: number;

  // ============================================================
  // CHALLAN / REGISTER
  // ============================================================

  @IsOptional()
  @IsString()
  challan_bill_no?: string;

  @IsOptional()
  @IsEnum(YesNoNA)
  gate_pass_received?: YesNoNA;

  @IsOptional()
  @IsEnum(YesNoNA)
  material_checked?: YesNoNA;

  // ============================================================
  // VENDOR
  // ============================================================

  @IsOptional()
  @IsUUID()
  vendor_id?: string;

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
