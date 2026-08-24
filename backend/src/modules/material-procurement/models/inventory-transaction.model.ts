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

import { InventoryTransactionType } from '../../../common/enums/inventory-transaction-type.enum';
import { SiteInventory } from './site-inventory.model';

/**
 * 6b. Site inventory register — inward / outward / adjustment / damage
 * transactions, reconciled against purchase orders.
 */
@Table({
  tableName: 'inventory_transactions',
  timestamps: true,
  updatedAt: false,
})
export class InventoryTransaction extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => SiteInventory)
  @Column(DataType.UUID)
  declare siteInventoryId: string;

  @BelongsTo(() => SiteInventory, { onDelete: 'CASCADE' })
  declare siteInventory: SiteInventory;

  // Present only for INWARD transactions that reconcile against a PO delivery
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare purchaseOrderId: string;

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare deliveryChallanId: string;

  @Column(DataType.ENUM(...Object.values(InventoryTransactionType)))
  declare type: InventoryTransactionType;

  // Always stored as a positive magnitude; direction is derived from `type`
  @Column(DataType.DECIMAL(14, 3))
  declare quantity: number;

  @Column(DataType.DECIMAL(14, 3))
  declare balanceAfter: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare reference: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remarks: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare transactedBy: string;
}
