import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';

import { DeliveryChallan } from './delivery-challan.model';
import { PurchaseOrderItem } from './purchase-order-item.model';

@Table({
  tableName: 'delivery_challan_items',
  timestamps: false,
  underscored: true,
})
export class DeliveryChallanItem extends Model<
  InferAttributes<DeliveryChallanItem>,
  InferCreationAttributes<DeliveryChallanItem>
> {
  @PrimaryKey
  @Column(DataType.CHAR(36))
  declare id: CreationOptional<string>;

  @ForeignKey(() => DeliveryChallan)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
    field: 'delivery_challan_id',
  })
  declare deliveryChallanId: string;

  @BelongsTo(() => DeliveryChallan, 'deliveryChallanId')
  declare deliveryChallan?: NonAttribute<DeliveryChallan>;

  @ForeignKey(() => PurchaseOrderItem)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
    field: 'purchase_order_item_id',
  })
  declare purchaseOrderItemId: string | null;

  @BelongsTo(() => PurchaseOrderItem, 'purchaseOrderItemId')
  declare purchaseOrderItem?: NonAttribute<PurchaseOrderItem>;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    field: 'material_name',
  })
  declare materialName: string;

  @Default(0)
  @Column({
    type: DataType.DECIMAL(15, 3),
    allowNull: false,
    field: 'quantity_delivered',
  })
  declare quantityDelivered: CreationOptional<number>;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'condition_notes',
  })
  declare conditionNotes: string | null;
}
