import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  HasMany,
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

import { Unit } from '@/modules/metas/models/unit.model';
import { PurchaseOrder } from './purchase-order.model';
import { DeliveryChallanItem } from './delivery-challan-item.model';

@Table({
  tableName: 'purchase_order_items',
  timestamps: false,
  underscored: true,
})
export class PurchaseOrderItem extends Model<
  InferAttributes<PurchaseOrderItem>,
  InferCreationAttributes<PurchaseOrderItem>
> {
  @PrimaryKey
  @Column(DataType.CHAR(36))
  declare id: CreationOptional<string>;

  @ForeignKey(() => PurchaseOrder)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
    field: 'purchase_order_id',
  })
  declare purchaseOrderId: string;

  @BelongsTo(() => PurchaseOrder, 'purchaseOrderId')
  declare purchaseOrder?: NonAttribute<PurchaseOrder>;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    field: 'material_name',
  })
  declare materialName: string;

  @ForeignKey(() => Unit)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
    field: 'unit_id',
  })
  declare unitId: string | null;

  @BelongsTo(() => Unit, 'unitId')
  declare unit?: NonAttribute<Unit>;

  @Default(0)
  @Column({
    type: DataType.DECIMAL(15, 3),
    allowNull: false,
  })
  declare quantity: CreationOptional<number>;

  @Default(0)
  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
  })
  declare rate: CreationOptional<number>;

  @Default(0)
  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
  })
  declare amount: CreationOptional<number>;

  @Default(0)
  @Column({
    type: DataType.DECIMAL(15, 3),
    allowNull: false,
    field: 'delivered_quantity',
  })
  declare deliveredQuantity: CreationOptional<number>;

  @HasMany(() => DeliveryChallanItem, 'purchaseOrderItemId')
  declare challanItems?: NonAttribute<DeliveryChallanItem[]>;
}
