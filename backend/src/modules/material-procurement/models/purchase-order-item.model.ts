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

import { PurchaseOrder } from './purchase-order.model';
import { MaterialMaster } from './material-master.model';

@Table({
  tableName: 'purchase_order_items',
  timestamps: true,
})
export class PurchaseOrderItem extends Model<
  InferAttributes<PurchaseOrderItem>,
  InferCreationAttributes<PurchaseOrderItem>
> {
  // ============================================================
  // PRIMARY KEY
  // ============================================================

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: CreationOptional<string>;

  // ============================================================
  // PURCHASE ORDER
  // ============================================================

  @ForeignKey(() => PurchaseOrder)
  @AllowNull(false)
  @Index
  @Column(DataType.UUID)
  declare purchase_order_id: string;

  @BelongsTo(() => PurchaseOrder)
  declare purchase_order?: PurchaseOrder;

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
  // LINE
  // ============================================================

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare line_number: number;

  // ============================================================
  // MATERIAL DETAILS
  // ============================================================

  @AllowNull(false)
  @Column(DataType.STRING(500))
  declare description: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare specification: string | null;

  @AllowNull(true)
  @Column(DataType.STRING(150))
  declare brand: string | null;

  @AllowNull(false)
  @Column(DataType.STRING(30))
  declare unit: string;

  // ============================================================
  // QUANTITY / PRICING
  // ============================================================

  @AllowNull(false)
  @Column(DataType.DECIMAL(15, 3))
  declare ordered_quantity: number;

  @AllowNull(false)
  @Column(DataType.DECIMAL(15, 2))
  declare rate: number;

  @AllowNull(false)
  @Column(DataType.DECIMAL(15, 2))
  declare amount: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.DECIMAL(15, 3))
  declare received_quantity: CreationOptional<number>;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.DECIMAL(15, 3))
  declare pending_quantity: CreationOptional<number>;

  // ============================================================
  // REMARKS
  // ============================================================

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare remarks: string | null;

  // ============================================================
  // SOURCE
  // ============================================================

  @AllowNull(true)
  @Column(DataType.UUID)
  declare source_reference_id: string | null;
}
