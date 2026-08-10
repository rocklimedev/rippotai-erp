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
    { unique: true, fields: ['projectId', 'materialRequirementId'] },
  ],
})
export class SiteInventory extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @Column(DataType.STRING)
  projectId: string;

  @Column({ type: DataType.UUID, allowNull: true })
  materialRequirementId: string;

  @Column(DataType.STRING)
  materialName: string;

  @Column(DataType.STRING)
  unit: string;

  @Default(0)
  @Column(DataType.DECIMAL(14, 3))
  currentStock: number;

  @HasMany(() => InventoryTransaction)
  transactions: InventoryTransaction[];
}
