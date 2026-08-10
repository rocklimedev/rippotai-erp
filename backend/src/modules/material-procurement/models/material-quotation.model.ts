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
import { QuotationStatus } from '../../../common/enums/quotation-status.enum';
import { MaterialEstimate } from './material-estimate.model';
import { PurchaseOrder } from './purchase-order.model';

/**
 * 3b. The quotation produced from an approved MaterialEstimate.
 */
@Table({ tableName: 'material_quotations', timestamps: true, updatedAt: false })
export class MaterialQuotation extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @ForeignKey(() => MaterialEstimate)
  @Column({ type: DataType.UUID, unique: true })
  estimateId: string;

  @BelongsTo(() => MaterialEstimate, { onDelete: 'CASCADE' })
  estimate: MaterialEstimate;

  @Column({ type: DataType.STRING, unique: true })
  quotationNumber: string;

  @Column(DataType.DATEONLY)
  quotationDate: string;

  @Column(DataType.DECIMAL(14, 2))
  totalAmount: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  terms: string;

  @Default(QuotationStatus.DRAFT)
  @Column(DataType.ENUM(...Object.values(QuotationStatus)))
  status: QuotationStatus;

  @Column({ type: DataType.DATE, allowNull: true })
  acceptedAt: Date;

  @HasMany(() => PurchaseOrder)
  purchaseOrders: PurchaseOrder[];
}
