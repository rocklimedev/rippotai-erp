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
import { DeliveryChallan } from './delivery-challan.model';
import { PurchaseOrderItem } from './purchase-order-item.model';

/**
 * 5b. Delivery challan line item — the quantity of a specific PO line
 * item that arrived on this challan.
 */
@Table({ tableName: 'delivery_challan_items', timestamps: false })
export class DeliveryChallanItem extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @ForeignKey(() => DeliveryChallan)
  @Column(DataType.UUID)
  deliveryChallanId: string;

  @BelongsTo(() => DeliveryChallan, { onDelete: 'CASCADE' })
  deliveryChallan: DeliveryChallan;

  @ForeignKey(() => PurchaseOrderItem)
  @Column(DataType.UUID)
  purchaseOrderItemId: string;

  @BelongsTo(() => PurchaseOrderItem)
  purchaseOrderItem: PurchaseOrderItem;

  @Column(DataType.DECIMAL(12, 3))
  deliveredQuantity: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  remarks: string;
}
