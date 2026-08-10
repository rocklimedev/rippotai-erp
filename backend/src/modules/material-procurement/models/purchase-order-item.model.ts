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
@Table({ tableName: 'purchase_order_items', timestamps: false })
export class PurchaseOrderItem extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @ForeignKey(() => PurchaseOrder)
  @Column(DataType.UUID)
  purchaseOrderId: string;

  @BelongsTo(() => PurchaseOrder, { onDelete: 'CASCADE' })
  purchaseOrder: PurchaseOrder;

  @Column({ type: DataType.UUID, allowNull: true })
  materialRequirementId: string;

  @Column(DataType.STRING)
  description: string;

  @Column(DataType.STRING)
  unit: string;

  @Column(DataType.DECIMAL(12, 3))
  orderedQuantity: number;

  @Default(0)
  @Column(DataType.DECIMAL(12, 3))
  deliveredQuantity: number;

  @Column(DataType.DECIMAL(12, 2))
  unitRate: number;

  @Column(DataType.DECIMAL(14, 2))
  lineTotal: number;
}
