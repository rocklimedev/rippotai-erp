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

/** Frozen copy of an earlier quotation version (header + lines). */
@Table({
  tableName: 'procurement_quotation_versions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class ProcurementQuotationVersion extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.CHAR(36))
  declare id: string;

  @ForeignKey(() => ProcurementQuotation)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare quotation_id: string;

  @BelongsTo(() => ProcurementQuotation, { foreignKey: 'quotation_id' })
  declare quotation: ProcurementQuotation;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare version: number;

  @Column({
    type: DataType.TEXT('long'),
    allowNull: false,
    get(this: ProcurementQuotationVersion) {
      const raw = this.getDataValue('snapshot') as unknown;
      if (raw && typeof raw === 'object') return raw;
      try {
        return JSON.parse(typeof raw === 'string' ? raw : 'null') as Record<
          string,
          any
        >;
      } catch {
        return null;
      }
    },
    set(this: ProcurementQuotationVersion, value: unknown) {
      this.setDataValue('snapshot', JSON.stringify(value ?? null));
    },
  })
  declare snapshot: Record<string, any>;

  @Column(DataType.CHAR(36)) declare created_by: string | null;
}
