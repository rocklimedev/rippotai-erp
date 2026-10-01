import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  Index,
  BelongsTo,
  ForeignKey,
} from 'sequelize-typescript';

import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';

import { MaterialMaster } from './material-master.model';
import { Unit } from '@/modules/metas/models/unit.model';
export enum YesNoNA {
  YES = 'YES',
  NO = 'NO',
  NOT_APPLICABLE = 'NA',
}
// ============================================================
// INVENTORY TRANSACTION TYPES
// ============================================================

export enum InventoryTransactionType {
  RECEIPT = 'RECEIPT',

  ISSUE = 'ISSUE',

  RETURN_FROM_CONTRACTOR = 'RETURN_FROM_CONTRACTOR',

  RETURN_TO_VENDOR = 'RETURN_TO_VENDOR',

  TRANSFER_IN = 'TRANSFER_IN',

  TRANSFER_OUT = 'TRANSFER_OUT',

  ADJUSTMENT_IN = 'ADJUSTMENT_IN',

  ADJUSTMENT_OUT = 'ADJUSTMENT_OUT',
}

// ============================================================
// INVENTORY DIRECTION
// ============================================================

export enum InventoryDirection {
  IN = 'IN',
  OUT = 'OUT',
}

// ============================================================
// INVENTORY REFERENCE TYPES
// ============================================================

export enum InventoryReferenceType {
  DELIVERY_CHALLAN = 'DELIVERY_CHALLAN',

  PURCHASE_ORDER = 'PURCHASE_ORDER',

  ISSUE = 'ISSUE',

  TRANSFER = 'TRANSFER',

  ADJUSTMENT = 'ADJUSTMENT',

  RETURN = 'RETURN',

  MANUAL = 'MANUAL',
}

// ============================================================
// INVENTORY CONDITION
// ============================================================

export enum InventoryConditionStatus {
  GOOD = 'GOOD',

  DAMAGED = 'DAMAGED',

  SHORT = 'SHORT',

  REJECTED = 'REJECTED',

  NOT_APPLICABLE = 'NOT_APPLICABLE',
}

// ============================================================
// INVENTORY TRANSACTION
// ============================================================
//
// This table is the inventory STOCK LEDGER.
//
// Current stock is calculated:
//
//   IN  -> increases stock
//   OUT -> decreases stock
//
// Quantity is ALWAYS positive.
//
// Example:
//
// RECEIPT          100 IN
// ISSUE             20 OUT
// RETURN              5 IN
// ADJUSTMENT_OUT      2 OUT
//
// Current stock = 83
//
// Posted transactions should NOT be edited/deleted.
// Corrections should be made using reversal transactions.
// ============================================================

@Table({
  tableName: 'inventory_transactions',
  timestamps: true,
  underscored: true,
})
export class InventoryTransaction extends Model<
  InferAttributes<InventoryTransaction>,
  InferCreationAttributes<InventoryTransaction>
> {
  // ============================================================
  // PRIMARY KEY
  // ============================================================

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: CreationOptional<string>;

  // ============================================================
  // PROJECT
  // ============================================================

  @AllowNull(false)
  @Index
  @Column(DataType.UUID)
  declare project_id: string;

  // ============================================================
  // SITE
  // ============================================================

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare site_location: string | null;
  // ============================================================
  // MATERIAL
  // ============================================================

  @ForeignKey(() => MaterialMaster)
  @AllowNull(false)
  @Index
  @Column(DataType.UUID)
  declare material_id: string;

  @BelongsTo(() => MaterialMaster, {
    foreignKey: 'material_id',
    as: 'material',
  })
  declare material?: MaterialMaster;

  // ============================================================
  // UNIT
  // ============================================================

  /**
   * Unit is intentionally stored on the transaction.
   *
   * MaterialMaster.unit_id may change in the future, but
   * historical transactions must retain the unit used at
   * the time of the movement.
   */
  @ForeignKey(() => Unit)
  @AllowNull(false)
  @Index
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare unit_id: string;

  @BelongsTo(() => Unit, {
    foreignKey: 'unit_id',
    as: 'unit',
  })
  declare unit?: Unit;

  // ============================================================
  // TRANSACTION DATE
  // ============================================================

  @AllowNull(false)
  @Index
  @Column(DataType.DATEONLY)
  declare transaction_date: string;

  // ============================================================
  // TRANSACTION TYPE
  // ============================================================

  @AllowNull(false)
  @Index
  @Column(DataType.ENUM(...Object.values(InventoryTransactionType)))
  declare transaction_type: InventoryTransactionType;

  // ============================================================
  // QUANTITY
  // ============================================================

  /**
   * Always positive.
   *
   * Direction determines whether the quantity is added
   * or subtracted from stock.
   *
   * Because MySQL DECIMAL values can be returned as strings,
   * service-layer code should continue using Number(quantity)
   * whenever arithmetic is performed.
   */
  @AllowNull(false)
  @Column(DataType.DECIMAL(15, 3))
  declare quantity: number;

  // ============================================================
  // DIRECTION
  // ============================================================

  @AllowNull(false)
  @Index
  @Column(DataType.ENUM(...Object.values(InventoryDirection)))
  declare direction: InventoryDirection;

  // ============================================================
  // REFERENCES
  // ============================================================

  /**
   * Type of document/source that created this inventory movement.
   */
  @AllowNull(true)
  @Index
  @Column(DataType.ENUM(...Object.values(InventoryReferenceType)))
  declare reference_type: InventoryReferenceType | null;

  /**
   * Parent document UUID.
   *
   * Examples:
   *
   * DELIVERY_CHALLAN -> delivery_challans.id
   * PURCHASE_ORDER   -> purchase_orders.id
   * TRANSFER         -> generated transfer UUID
   * ISSUE            -> issue document UUID
   */
  @AllowNull(true)
  @Index
  @Column(DataType.UUID)
  declare reference_id: string | null;

  /**
   * Child item UUID.
   *
   * Example:
   *
   * delivery_challans
   *       ↓
   * delivery_challan_items
   *       ↓
   * inventory_transactions
   */
  @AllowNull(true)
  @Index
  @Column(DataType.UUID)
  declare reference_item_id: string | null;

  // ============================================================
  // REVERSAL / CORRECTION
  // ============================================================

  /**
   * Points to the original transaction being reversed.
   *
   * Example:
   *
   * Original:
   *
   * ISSUE 100 OUT
   *
   * Reversal:
   *
   * ADJUSTMENT_IN 100 IN
   *
   * reversal_of_id = original.id
   */
  @AllowNull(true)
  @Index
  @Column(DataType.UUID)
  declare reversal_of_id: string | null;

  /**
   * Reason for reversal/correction.
   */
  @AllowNull(true)
  @Column(DataType.TEXT)
  declare reversal_reason: string | null;

  // ============================================================
  // VENDOR
  // ============================================================

  /**
   * Vendor UUID.
   *
   * Kept as a plain UUID field intentionally so this model does
   * not create a hard Sequelize association with Vendor.
   */
  @AllowNull(true)
  @Index
  @Column(DataType.UUID)
  declare vendor_id: string | null;

  // ============================================================
  // CONTRACTOR
  // ============================================================

  /**
   * Contractor UUID.
   */
  @AllowNull(true)
  @Index
  @Column(DataType.UUID)
  declare contractor_id: string | null;

  // ============================================================
  // TRADE
  // ============================================================

  /**
   * Example:
   *
   * Carpenter
   * Electrical
   * Plumbing
   * Civil
   */
  @AllowNull(true)
  @Column(DataType.STRING(100))
  declare trade: string | null;

  // ============================================================
  // WORK REFERENCE
  // ============================================================

  /**
   * Human-readable work/activity reference.
   */
  @AllowNull(true)
  @Column(DataType.STRING(255))
  declare work_reference: string | null;

  // ============================================================
  // STORAGE
  // ============================================================

  /**
   * Physical store/location/bin/rack.
   */
  @AllowNull(true)
  @Index
  @Column(DataType.STRING(255))
  declare storage_location: string | null;

  // ============================================================
  // CONDITION
  // ============================================================

  @AllowNull(false)
  @Default(InventoryConditionStatus.NOT_APPLICABLE)
  @Column(DataType.ENUM(...Object.values(InventoryConditionStatus)))
  declare condition_status: CreationOptional<InventoryConditionStatus>;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare condition_notes: string | null;

  // ============================================================
  // ISSUE INFORMATION
  // ============================================================

  /**
   * Human-readable person/team receiving the material.
   *
   * Example:
   *
   * Rajesh - Carpenter Team
   */
  @AllowNull(true)
  @Column(DataType.STRING(255))
  declare issued_to: string | null;

  /**
   * UUID of user who physically issued the material.
   */
  @AllowNull(true)
  @Index
  @Column(DataType.UUID)
  declare issued_by: string | null;

  // ============================================================
  // RECEIVING INFORMATION
  // ============================================================

  /**
   * UUID of user who physically received/accepted material.
   */
  @AllowNull(true)
  @Index
  @Column(DataType.UUID)
  declare received_by: string | null;

  // ============================================================
  // DELIVERY CHALLAN / REGISTER INFORMATION
  // ============================================================

  /**
   * Printed challan/bill number.
   *
   * Example:
   *
   * DC-2026-00125
   */
  @AllowNull(true)
  @Index
  @Column(DataType.STRING(100))
  declare challan_bill_no: string | null;

  /**
   * Whether gate pass was received.
   *
   * Stored as string enum because YesNoNA is an application enum.
   */
  @AllowNull(true)
  @Column(DataType.ENUM('YES', 'NO', 'NA'))
  declare gate_pass_received: string | null;

  /**
   * Whether material was checked.
   */
  @AllowNull(true)
  @Column(DataType.ENUM('YES', 'NO', 'NA'))
  declare material_checked: string | null;

  // ============================================================
  // REMARKS
  // ============================================================

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare remarks: string | null;

  // ============================================================
  // AUDIT
  // ============================================================

  /**
   * User who created the ledger entry.
   */
  @AllowNull(true)
  @Index
  @Column(DataType.UUID)
  declare created_by: string | null;

  // ============================================================
  // CREATED / UPDATED
  // ============================================================
  //
  // Sequelize manages these automatically because timestamps:true.
  //
  // No need to explicitly declare created_at / updated_at unless
  // your application needs direct TypeScript access to them.
  // ============================================================
}
