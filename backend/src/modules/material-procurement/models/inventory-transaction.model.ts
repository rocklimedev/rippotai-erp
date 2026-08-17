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
  id: string;

  @ForeignKey(() => SiteInventory)
  @Column(DataType.UUID)
  siteInventoryId: string;

  @BelongsTo(() => SiteInventory, { onDelete: 'CASCADE' })
  siteInventory: SiteInventory;

  // Present only for INWARD transactions that reconcile against a PO delivery
  @Column({ type: DataType.UUID, allowNull: true })
  purchaseOrderId: string;

  @Column({ type: DataType.UUID, allowNull: true })
  deliveryChallanId: string;

  @Column(DataType.ENUM(...Object.values(InventoryTransactionType)))
  type: InventoryTransactionType;

  // Always stored as a positive magnitude; direction is derived from `type`
  @Column(DataType.DECIMAL(14, 3))
  quantity: number;

  @Column(DataType.DECIMAL(14, 3))
  balanceAfter: number;

  @Column({ type: DataType.STRING, allowNull: true })
  reference: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  remarks: string;

  @Column({ type: DataType.STRING, allowNull: true })
  transactedBy: string;
}
