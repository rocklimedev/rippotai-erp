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

import { PurchaseOrderStatus } from '../../../common/enums/purchase-order-status.enum';
import { MaterialQuotation } from './material-quotation.model';
import { PurchaseOrderItem } from './purchase-order-item.model';
import { DeliveryChallan } from './delivery-challan.model';

/**
 * 4. Purchase orders — issued against approved material quotations,
 * with line-item tracking of delivered vs. ordered quantity.
 */
@Table({
  tableName: 'purchase_orders',
  timestamps: true,
})
export class PurchaseOrder extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => MaterialQuotation)
  @Column(DataType.UUID)
  declare quotationId: string;

  @BelongsTo(() => MaterialQuotation)
  declare quotation: MaterialQuotation;

  @Column({
    type: DataType.STRING,
    unique: true,
  })
  declare poNumber: string;

  @Column(DataType.STRING)
  declare vendorName: string;

  @Column(DataType.DATEONLY)
  declare orderDate: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare expectedDeliveryDate: string;

  @Default(PurchaseOrderStatus.OPEN)
  @Column(DataType.ENUM(...Object.values(PurchaseOrderStatus)))
  declare status: PurchaseOrderStatus;

  @Default(0)
  @Column(DataType.DECIMAL(14, 2))
  declare totalAmount: number;

  @HasMany(() => PurchaseOrderItem)
  declare items: PurchaseOrderItem[];

  @HasMany(() => DeliveryChallan)
  declare deliveryChallans: DeliveryChallan[];
}
