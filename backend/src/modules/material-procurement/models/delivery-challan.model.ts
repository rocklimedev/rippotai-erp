import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { SiteStage } from '../../../common/enums/site-stage.enum';
import { PurchaseOrder } from './purchase-order.model';
import { DeliveryChallanItem } from './delivery-challan-item.model';

/**
 * 5. Staged deliveries — delivery challans logged against each purchase
 * order and tagged to the site stage that needs them.
 */
@Table({ tableName: 'delivery_challans', timestamps: true, updatedAt: false })
export class DeliveryChallan extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @ForeignKey(() => PurchaseOrder)
  @Column(DataType.UUID)
  purchaseOrderId: string;

  @BelongsTo(() => PurchaseOrder, { onDelete: 'CASCADE' })
  purchaseOrder: PurchaseOrder;

  @Column({ type: DataType.STRING, unique: true })
  challanNumber: string;

  @Column(DataType.DATEONLY)
  deliveryDate: string;

  @Column(DataType.ENUM(...Object.values(SiteStage)))
  siteStage: SiteStage;

  @Column({ type: DataType.STRING, allowNull: true })
  receivedBy: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  notes: string;

  @HasMany(() => DeliveryChallanItem)
  items: DeliveryChallanItem[];
}
