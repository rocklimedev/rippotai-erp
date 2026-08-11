import {
  BelongsTo,
  Column,
  DataType,
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

import { Project } from '@/modules/projects/models/projects.model';
import { User } from '@/modules/users/models/user.model';
import { PurchaseOrder } from './purchase-order.model';
import { DeliveryChallanItem } from './delivery-challan-item.model';

@Table({
  tableName: 'delivery_challans',
  timestamps: false,
  underscored: true,
})
export class DeliveryChallan extends Model<
  InferAttributes<DeliveryChallan>,
  InferCreationAttributes<DeliveryChallan>
> {
  @PrimaryKey
  @Column(DataType.CHAR(36))
  declare id: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
    field: 'challan_number',
  })
  declare challanNumber: string;

  @ForeignKey(() => PurchaseOrder)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
    field: 'purchase_order_id',
  })
  declare purchaseOrderId: string;

  @BelongsTo(() => PurchaseOrder, 'purchaseOrderId')
  declare purchaseOrder?: NonAttribute<PurchaseOrder>;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
    field: 'project_id',
  })
  declare projectId: string;

  @BelongsTo(() => Project, 'projectId')
  declare project?: NonAttribute<Project>;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'delivered_at',
  })
  declare deliveredAt: Date | null;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
    field: 'received_by',
  })
  declare receivedBy: string | null;

  @BelongsTo(() => User, 'receivedBy')
  declare receiver?: NonAttribute<User>;

  @Column({
    type: DataType.STRING(150),
    allowNull: true,
    field: 'site_stage',
  })
  declare siteStage: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remarks: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'created_at',
  })
  declare createdAt: CreationOptional<Date>;

  @HasMany(() => DeliveryChallanItem, 'deliveryChallanId')
  declare items?: NonAttribute<DeliveryChallanItem[]>;
}
