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

@Table({
  tableName: 'delivery_challan_items',
  timestamps: false,
})
export class DeliveryChallanItem extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => DeliveryChallan)
  @Column(DataType.UUID)
  declare deliveryChallanId: string;

  @BelongsTo(() => DeliveryChallan, { onDelete: 'CASCADE' })
  declare deliveryChallan: DeliveryChallan;

  @ForeignKey(() => PurchaseOrderItem)
  @Column(DataType.UUID)
  declare purchaseOrderItemId: string;

  @BelongsTo(() => PurchaseOrderItem)
  declare purchaseOrderItem: PurchaseOrderItem;

  @Column(DataType.DECIMAL(12, 3))
  declare deliveredQuantity: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remarks: string;
}
