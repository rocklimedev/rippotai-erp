import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Project } from '../../projects/models/projects.model';
import { Vendor } from '../../vendors/models/vendors.model';
import { ProcurementQuotationItem } from './procurement-quotation-item.model';
import { ProcurementQuotationVersion } from './procurement-quotation-version.model';

export enum QuotationVendorKind {
  MATERIAL = 'MATERIAL',
  LABOUR = 'LABOUR',
}

export enum ProcurementQuotationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ORDERED = 'ORDERED',
  CANCELLED = 'CANCELLED',
}

const money = (field: string) => ({
  type: DataType.DECIMAL(15, 2),
  allowNull: false,
  defaultValue: 0,
  get(this: Model) {
    return Number(this.getDataValue(field) ?? 0);
  },
});

@Table({
  tableName: 'procurement_quotations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class ProcurementQuotation extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.CHAR(36))
  declare id: string;

  @Column({ type: DataType.STRING(50), allowNull: false })
  declare quotation_number: string;

  @ForeignKey(() => Project)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare project_id: string;

  @BelongsTo(() => Project, { foreignKey: 'project_id', constraints: false })
  declare project: Project;

  @ForeignKey(() => Vendor)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare vendor_id: string;

  @BelongsTo(() => Vendor, { foreignKey: 'vendor_id', constraints: false })
  declare vendor: Vendor;

  @Default(QuotationVendorKind.MATERIAL)
  @Column(DataType.ENUM(...Object.values(QuotationVendorKind)))
  declare vendor_kind: QuotationVendorKind;

  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare comparison_id: string | null;

  @Default(ProcurementQuotationStatus.DRAFT)
  @Column(DataType.ENUM(...Object.values(ProcurementQuotationStatus)))
  declare status: ProcurementQuotationStatus;

  @Default(1)
  @Column(DataType.INTEGER)
  declare version: number;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare quotation_date: string;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare valid_until: string | null;

  @Column(DataType.STRING(255)) declare vendor_name: string | null;
  @Column(DataType.STRING(255)) declare vendor_type: string | null;
  @Column(DataType.STRING(50)) declare vendor_phone: string | null;
  @Column(DataType.TEXT) declare vendor_address: string | null;
  @Column(DataType.STRING(255)) declare project_name: string | null;
  @Column(DataType.TEXT) declare project_address: string | null;
  @Column(DataType.STRING(255)) declare client_name: string | null;

  @Column(money('subtotal')) declare subtotal: number;
  @Column(money('tax_amount')) declare tax_amount: number;
  @Column(money('total_amount')) declare total_amount: number;

  // [{ stage, date, amount, remarks }] — the template's "Payment Terms" table.
  @Column({
    type: DataType.TEXT('long'),
    allowNull: true,
    get(this: ProcurementQuotation) {
      const raw = this.getDataValue('payment_terms') as unknown;
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      try {
        const parsed: unknown = JSON.parse(
          typeof raw === 'string' ? raw : '[]',
        );
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    },
    set(this: ProcurementQuotation, value: unknown) {
      this.setDataValue(
        'payment_terms',
        Array.isArray(value) ? JSON.stringify(value) : null,
      );
    },
  })
  declare payment_terms: Array<Record<string, any>>;

  @Column(DataType.TEXT) declare terms: string | null;
  @Column(DataType.TEXT) declare notes: string | null;

  @Column(DataType.CHAR(36)) declare purchase_order_id: string | null;
  @Column(DataType.CHAR(36)) declare work_order_id: string | null;

  @Column(DataType.CHAR(36)) declare approved_by: string | null;
  @Column(DataType.DATE) declare approved_at: Date | null;
  @Column(DataType.CHAR(36)) declare created_by: string | null;
  @Column(DataType.CHAR(36)) declare updated_by: string | null;

  @HasMany(() => ProcurementQuotationItem, {
    foreignKey: 'quotation_id',
    as: 'items',
  })
  declare items: ProcurementQuotationItem[];

  @HasMany(() => ProcurementQuotationVersion, {
    foreignKey: 'quotation_id',
    as: 'versions',
  })
  declare versions: ProcurementQuotationVersion[];
}
