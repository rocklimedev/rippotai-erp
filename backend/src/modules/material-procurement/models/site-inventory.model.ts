import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  PrimaryKey,
  HasMany,
} from 'sequelize-typescript';

import { InventoryTransaction } from './inventory-transaction.model';

/**
 * 6a. Site inventory register — live on-site stock levels per
 * project/material.
 */
@Table({
  tableName: 'site_inventories',
  timestamps: true,
  createdAt: false,
  updatedAt: 'lastUpdated',
  indexes: [
    {
      unique: true,
      fields: ['projectId', 'materialRequirementId'],
    },
  ],
})
export class SiteInventory extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column(DataType.STRING)
  declare projectId: string;

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare materialRequirementId: string;

  @Column(DataType.STRING)
  declare materialName: string;

  @Column(DataType.STRING)
  declare unit: string;

  @Default(0)
  @Column(DataType.DECIMAL(14, 3))
  declare currentStock: number;

  @HasMany(() => InventoryTransaction)
  declare transactions: InventoryTransaction[];
}
