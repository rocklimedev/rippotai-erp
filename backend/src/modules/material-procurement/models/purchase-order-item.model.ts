import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import { PurchaseOrder } from './purchase-order.model';

/**
 * 4b. Purchase order line item — tracks ordered vs. delivered quantity.
 */
@Table({
  tableName: 'purchase_order_items',
  timestamps: false,
})
export class PurchaseOrderItem extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => PurchaseOrder)
  @Column(DataType.UUID)
  declare purchaseOrderId: string;

  @BelongsTo(() => PurchaseOrder, { onDelete: 'CASCADE' })
  declare purchaseOrder: PurchaseOrder;

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare materialRequirementId: string;

  @Column(DataType.STRING)
  declare description: string;

  @Column(DataType.STRING)
  declare unit: string;

  @Column(DataType.DECIMAL(12, 3))
  declare orderedQuantity: number;

  @Default(0)
  @Column(DataType.DECIMAL(12, 3))
  declare deliveredQuantity: number;

  @Column(DataType.DECIMAL(12, 2))
  declare unitRate: number;

  @Column(DataType.DECIMAL(14, 2))
  declare lineTotal: number;
}
