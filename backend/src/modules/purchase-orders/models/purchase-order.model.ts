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

import { Estimate } from '@/modules/quotations/models/estimate.model';
import { Project } from '@/modules/projects/models/projects.model';
import { User } from '@/modules/users/models/user.model';
import { Vendor } from '@/modules/vendors/models/vendors.model';
import { PurchaseOrderItem } from './purchase-order-item.model';

export enum PurchaseOrderStatus {
  DRAFT = 'draft',
  ISSUED = 'issued',
  PARTIALLY_DELIVERED = 'partially_delivered',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Table({
  tableName: 'purchase_orders',
  timestamps: true,
  underscored: true,
})
export class PurchaseOrder extends Model<
  InferAttributes<PurchaseOrder>,
  InferCreationAttributes<PurchaseOrder>
> {
  @PrimaryKey
  @Column(DataType.CHAR(36))
  declare id: CreationOptional<string>;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
    field: 'po_number',
  })
  declare poNumber: string;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
    field: 'project_id',
  })
  declare projectId: string;

  @BelongsTo(() => Project, 'projectId')
  declare project?: NonAttribute<Project>;

  @ForeignKey(() => Vendor)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
    field: 'vendor_id',
  })
  declare vendorId: string;

  @BelongsTo(() => Vendor, 'vendorId')
  declare vendor?: NonAttribute<Vendor>;

  @ForeignKey(() => Estimate)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
    field: 'estimate_id',
  })
  declare estimateId: string | null;

  @BelongsTo(() => Estimate, 'estimateId')
  declare estimate?: NonAttribute<Estimate>;

  @Default(PurchaseOrderStatus.DRAFT)
  @Column({
    type: DataType.ENUM(...Object.values(PurchaseOrderStatus)),
    allowNull: false,
  })
  declare status: CreationOptional<PurchaseOrderStatus>;

  @Default(0)
  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    field: 'total_amount',
  })
  declare totalAmount: CreationOptional<number>;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
    field: 'expected_delivery_date',
  })
  declare expectedDeliveryDate: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'issued_at',
  })
  declare issuedAt: Date | null;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
    field: 'issued_by',
  })
  declare issuedBy: string | null;

  @BelongsTo(() => User, 'issuedBy')
  declare issuedByUser?: NonAttribute<User>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  @HasMany(() => PurchaseOrderItem, 'purchaseOrderId')
  declare items?: NonAttribute<PurchaseOrderItem[]>;
}
