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

/**
 * ============================================================
 * INVENTORY TRANSACTION TYPES
 * ============================================================
 *
 * Every stock movement must be represented by one of these
 * transaction types.
 *
 * IMPORTANT:
 * Do not update/delete posted inventory transactions.
 * Corrections should be done using reversal/adjustment entries.
 */
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

/**
 * ============================================================
 * INVENTORY DIRECTION
 * ============================================================
 */
export enum InventoryDirection {
  IN = 'IN',
  OUT = 'OUT',
}

/**
 * ============================================================
 * INVENTORY REFERENCE TYPES
 * ============================================================
 *
 * reference_type + reference_id + reference_item_id allow
 * inventory transactions to be traced back to the document
 * that caused them.
 */
export enum InventoryReferenceType {
  DELIVERY_CHALLAN = 'DELIVERY_CHALLAN',

  PURCHASE_ORDER = 'PURCHASE_ORDER',

  ISSUE = 'ISSUE',

  TRANSFER = 'TRANSFER',

  ADJUSTMENT = 'ADJUSTMENT',

  RETURN = 'RETURN',
  MANUAL = 'MANUAL',
}

/**
 * ============================================================
 * INVENTORY CONDITION
 * ============================================================
 */
export enum InventoryConditionStatus {
  GOOD = 'GOOD',

  DAMAGED = 'DAMAGED',

  SHORT = 'SHORT',

  REJECTED = 'REJECTED',

  NOT_APPLICABLE = 'NOT_APPLICABLE',
}

/**
 * ============================================================
 * INVENTORY TRANSACTION
 * ============================================================
 *
 * InventoryTransaction is the STOCK LEDGER.
 *
 * Current stock should always be calculated from:
 *
 *   IN transactions
 *   -
 *   OUT transactions
 *
 * Example:
 *
 * RECEIPT       +100
 * ISSUE          -20
 * RETURN          +5
 * ADJUSTMENT_OUT  -2
 * -------------------
 * CURRENT STOCK   83
 *
 * Never maintain a manually editable "current_stock" value
 * as the source of truth.
 */
@Table({
  tableName: 'inventory_transactions',
  timestamps: true,
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
  // PROJECT / SITE
  // ============================================================

  @AllowNull(false)
  @Index
  @Column(DataType.UUID)
  declare project_id: string;

  /**
   * Nullable because some inventory may belong to the project
   * without being assigned to a particular site.
   */
  @AllowNull(true)
  @Index
  @Column(DataType.UUID)
  declare site_id: string | null;

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
   * Unit is copied from MaterialMaster when the transaction is
   * created.
   *
   * This is intentional.
   *
   * If the material's master unit is changed later, historical
   * inventory transactions must still retain the unit that was
   * used when the movement happened.
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
   * Always store quantity as a positive number.
   *
   * Direction determines whether it increases or decreases stock.
   *
   * Example:
   *
   * quantity = 10
   * direction = IN
   *
   * means +10
   *
   * quantity = 10
   * direction = OUT
   *
   * means -10
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
   * Document that caused this inventory movement.
   *
   * Examples:
   *
   * DELIVERY_CHALLAN -> DC UUID
   * PURCHASE_ORDER   -> PO UUID
   * TRANSFER         -> Transfer UUID
   * ADJUSTMENT       -> Adjustment UUID
   * RETURN           -> Return UUID
   */
  @AllowNull(true)
  @Index
  @Column(DataType.ENUM(...Object.values(InventoryReferenceType)))
  declare reference_type: InventoryReferenceType | null;

  @AllowNull(true)
  @Index
  @Column(DataType.UUID)
  declare reference_id: string | null;

  /**
   * Optional child item reference.
   *
   * Example:
   *
   * Delivery Challan
   *     ↓
   * Delivery Challan Item
   *     ↓
   * Inventory Transaction
   */
  @AllowNull(true)
  @Index
  @Column(DataType.UUID)
  declare reference_item_id: string | null;

  // ============================================================
  // REVERSAL / CORRECTION
  // ============================================================

  /**
   * Links this transaction to the transaction being corrected.
   *
   * Example:
   *
   * Original:
   *
   * ISSUE 100
   *
   * Mistake discovered:
   *
   * REVERSAL / ADJUSTMENT_IN 100
   *
   * reversal_of_id points to the original transaction.
   *
   * This gives us a complete audit trail without modifying the
   * original transaction.
   */
  @AllowNull(true)
  @Index
  @Column(DataType.UUID)
  declare reversal_of_id: string | null;

  /**
   * Mandatory from the service layer whenever reversal_of_id
   * is populated.
   */
  @AllowNull(true)
  @Column(DataType.TEXT)
  declare reversal_reason: string | null;

  // ============================================================
  // VENDOR / CONTRACTOR
  // ============================================================

  @AllowNull(true)
  @Index
  @Column(DataType.UUID)
  declare vendor_id: string | null;

  @AllowNull(true)
  @Index
  @Column(DataType.UUID)
  declare contractor_id: string | null;

  @AllowNull(true)
  @Column(DataType.STRING(100))
  declare trade: string | null;

  // ============================================================
  // WORK / STORAGE
  // ============================================================

  @AllowNull(true)
  @Column(DataType.STRING(255))
  declare work_reference: string | null;

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
   * Human-readable recipient.
   *
   * Example:
   *
   * "Rajesh - Carpenter Team"
   */
  @AllowNull(true)
  @Column(DataType.STRING(255))
  declare issued_to: string | null;

  /**
   * User who physically issued the material.
   */
  @AllowNull(true)
  @Column(DataType.UUID)
  declare issued_by: string | null;

  // ============================================================
  // RECEIVING INFORMATION
  // ============================================================

  /**
   * User who physically received/accepted the material.
   */
  @AllowNull(true)
  @Column(DataType.UUID)
  declare received_by: string | null;

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
}
