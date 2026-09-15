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

import { DeliveryChallan } from './delivery-challan.model';
import { PurchaseOrderItem } from './purchase-order-item.model';
import { MaterialMaster } from './material-master.model';

export enum MaterialConditionStatus {
  GOOD = 'GOOD',
  DAMAGED = 'DAMAGED',
  SHORT = 'SHORT',
  DAMAGED_AND_SHORT = 'DAMAGED_AND_SHORT',
  REJECTED = 'REJECTED',
}

@Table({
  tableName: 'delivery_challan_items',
  timestamps: true,
})
export class DeliveryChallanItem extends Model<
  InferAttributes<DeliveryChallanItem>,
  InferCreationAttributes<DeliveryChallanItem>
> {
  // ============================================================
  // PRIMARY KEY
  // ============================================================

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: CreationOptional<string>;

  // ============================================================
  // DELIVERY CHALLAN
  // ============================================================

  @ForeignKey(() => DeliveryChallan)
  @AllowNull(false)
  @Index
  @Column(DataType.UUID)
  declare delivery_challan_id: string;

  @BelongsTo(() => DeliveryChallan)
  declare delivery_challan?: DeliveryChallan;

  // ============================================================
  // PURCHASE ORDER ITEM
  // ============================================================

  @ForeignKey(() => PurchaseOrderItem)
  @AllowNull(true)
  @Index
  @Column(DataType.UUID)
  declare purchase_order_item_id: string | null;

  @BelongsTo(() => PurchaseOrderItem)
  declare purchase_order_item?: PurchaseOrderItem;

  // ============================================================
  // MATERIAL
  // ============================================================

  @ForeignKey(() => MaterialMaster)
  @AllowNull(false)
  @Index
  @Column(DataType.UUID)
  declare material_id: string;

  @BelongsTo(() => MaterialMaster)
  declare material?: MaterialMaster;

  // ============================================================
  // LINE INFORMATION
  // ============================================================

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare line_number: number;

  @AllowNull(false)
  @Column(DataType.STRING(500))
  declare description: string;

  @AllowNull(true)
  @Column(DataType.STRING(150))
  declare brand: string | null;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare specification: string | null;

  @AllowNull(false)
  @Column(DataType.STRING(30))
  declare unit: string;

  // ============================================================
  // QUANTITIES
  // ============================================================

  @AllowNull(false)
  @Column(DataType.DECIMAL(15, 3))
  declare quantity: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.DECIMAL(15, 3))
  declare accepted_quantity: CreationOptional<number>;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.DECIMAL(15, 3))
  declare shortage_quantity: CreationOptional<number>;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.DECIMAL(15, 3))
  declare damaged_quantity: CreationOptional<number>;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.DECIMAL(15, 3))
  declare rejected_quantity: CreationOptional<number>;

  // ============================================================
  // CONDITION
  // ============================================================

  @AllowNull(false)
  @Default(MaterialConditionStatus.GOOD)
  @Column(DataType.ENUM(...Object.values(MaterialConditionStatus)))
  declare condition_status: CreationOptional<MaterialConditionStatus>;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare condition_notes: string | null;

  // ============================================================
  // STORAGE
  // ============================================================

  @AllowNull(true)
  @Column(DataType.STRING(255))
  declare stored_at: string | null;

  // ============================================================
  // REMARKS
  // ============================================================

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare remarks: string | null;
}
