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
import { ProcurementQuotation } from './procurement-quotation.model';

const decimal = (field: string, scale = 2) => ({
  type: DataType.DECIMAL(15, scale),
  allowNull: false,
  defaultValue: 0,
  get(this: Model) {
    return Number(this.getDataValue(field) ?? 0);
  },
});

@Table({
  tableName: 'procurement_quotation_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class ProcurementQuotationItem extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.CHAR(36))
  declare id: string;

  @ForeignKey(() => ProcurementQuotation)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare quotation_id: string;

  @BelongsTo(() => ProcurementQuotation, { foreignKey: 'quotation_id' })
  declare quotation: ProcurementQuotation;

  @Default(0) @Column(DataType.INTEGER) declare sort_order: number;
  @Column(DataType.STRING(255)) declare category_name: string | null;
  @Column({ type: DataType.STRING(500), allowNull: false })
  declare item_name: string;
  @Column(DataType.TEXT) declare description: string | null;
  @Column(DataType.STRING(30)) declare unit: string | null;
  @Column(decimal('quantity', 3)) declare quantity: number;
  @Column(decimal('rate')) declare rate: number;
  @Column(decimal('amount')) declare amount: number;
  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
    get(this: Model) {
      return Number(this.getDataValue('tax_percent') ?? 0);
    },
  })
  declare tax_percent: number;
  @Column(decimal('tax_amount')) declare tax_amount: number;
  @Column(DataType.TEXT) declare remarks: string | null;
  @Column(DataType.STRING(100)) declare source_item_id: string | null;
  @Column(DataType.CHAR(36)) declare material_id: string | null;
}
