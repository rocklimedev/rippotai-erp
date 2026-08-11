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

import { User } from '@/modules/users/models/user.model';
import { SiteInventoryItem } from './site-inventory-item.model';

export enum InventoryTransactionType {
  INWARD = 'inward',
  OUTWARD = 'outward',
  ADJUSTMENT = 'adjustment',
  DAMAGE = 'damage',
}

@Table({
  tableName: 'site_inventory_transactions',
  timestamps: false,
  underscored: true,
})
export class SiteInventoryTransaction extends Model<
  InferAttributes<SiteInventoryTransaction>,
  InferCreationAttributes<SiteInventoryTransaction>
> {
  @PrimaryKey
  @Column(DataType.CHAR(36))
  declare id: CreationOptional<string>;

  @ForeignKey(() => SiteInventoryItem)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
    field: 'inventory_item_id',
  })
  declare inventoryItemId: string;

  @BelongsTo(() => SiteInventoryItem, 'inventoryItemId')
  declare inventoryItem?: NonAttribute<SiteInventoryItem>;

  @Column({
    type: DataType.ENUM(...Object.values(InventoryTransactionType)),
    allowNull: false,
  })
  declare type: InventoryTransactionType;

  @Default(0)
  @Column({
    type: DataType.DECIMAL(15, 3),
    allowNull: false,
  })
  declare quantity: CreationOptional<number>;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    field: 'reference_type',
  })
  declare referenceType: string | null;

  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
    field: 'reference_id',
  })
  declare referenceId: string | null;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
    field: 'recorded_by',
  })
  declare recordedBy: string | null;

  @BelongsTo(() => User, 'recordedBy')
  declare recorder?: NonAttribute<User>;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remarks: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    field: 'created_at',
  })
  declare createdAt: CreationOptional<Date>;
}
