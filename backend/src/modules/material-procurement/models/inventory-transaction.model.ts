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

export enum InventoryDirection {
  IN = 'IN',
  OUT = 'OUT',
}

export enum InventoryReferenceType {
  DELIVERY_CHALLAN = 'DELIVERY_CHALLAN',
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  ISSUE = 'ISSUE',
  TRANSFER = 'TRANSFER',
  ADJUSTMENT = 'ADJUSTMENT',
  RETURN = 'RETURN',
}

export enum InventoryConditionStatus {
  GOOD = 'GOOD',
  DAMAGED = 'DAMAGED',
  SHORT = 'SHORT',
  REJECTED = 'REJECTED',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
}

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
  // TRANSACTION
  // ============================================================

  @AllowNull(false)
  @Index
  @Column(DataType.DATEONLY)
  declare transaction_date: string;

  @AllowNull(false)
  @Index
  @Column(DataType.ENUM(...Object.values(InventoryTransactionType)))
  declare transaction_type: InventoryTransactionType;

  @AllowNull(false)
  @Column(DataType.DECIMAL(15, 3))
  declare quantity: number;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(InventoryDirection)))
  declare direction: InventoryDirection;

  // ============================================================
  // REFERENCES
  // ============================================================

  @AllowNull(true)
  @Column(DataType.ENUM(...Object.values(InventoryReferenceType)))
  declare reference_type: InventoryReferenceType | null;

  @AllowNull(true)
  @Index
  @Column(DataType.UUID)
  declare reference_id: string | null;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare reference_item_id: string | null;

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

  @AllowNull(true)
  @Column(DataType.STRING(255))
  declare issued_to: string | null;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare issued_by: string | null;

  // ============================================================
  // RECEIVING INFORMATION
  // ============================================================

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

  @AllowNull(true)
  @Column(DataType.UUID)
  declare created_by: string | null;
}
