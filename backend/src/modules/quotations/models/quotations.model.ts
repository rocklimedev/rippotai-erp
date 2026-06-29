import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  Default,
  PrimaryKey,
} from 'sequelize-typescript';
import { Project } from '@/modules/projects/models/projects.model';
import { Vendor } from '@/modules/vendors/models/vendors.model';
import { User } from '@/modules/users/models/user.model';
import { QuotationItem } from './quotation-items.model';
import { QuotationVersion } from './quotation-versions.model';
export enum QuotationStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  RETURNED_FOR_EDITING = 'returned_for_editing',
  DECLINED = 'declined',
  CANCELLED = 'cancelled',
}
export enum GlobalDiscountType {
  FIXED = 'fixed',
  PERCENTAGE = 'percentage',
}
@Table({
  tableName: 'quotations',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',

  indexes: [
    {
      name: 'idx_quotations_project',
      fields: ['project_id'],
    },
    {
      name: 'idx_quotations_vendor',
      fields: ['vendor_id'],
    },
    {
      name: 'idx_quotations_status',
      fields: ['status'],
    },
    {
      name: 'idx_quotations_date',
      fields: ['quotation_date'],
    },
  ],
})
export class Quotation extends Model<Quotation> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;
  @Column({
    field: 'quotation_number',
    allowNull: false,
    unique: true,
  })
  declare quotationNumber: string;

  @Column({
    field: 'quotation_date',
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare quotationDate: string;

  @Column({
    type: DataType.ENUM(...Object.values(QuotationStatus)),
    allowNull: false,
    defaultValue: QuotationStatus.DRAFT,
  })
  declare status: QuotationStatus;

  @ForeignKey(() => Project)
  @Column({
    field: 'project_id',
    type: DataType.UUID,
    allowNull: false,
  })
  declare projectId: string;

  @ForeignKey(() => Vendor)
  @Column({
    field: 'vendor_id',
    type: DataType.UUID,
    allowNull: false,
  })
  declare vendorId: string;

  @Column({
    field: 'project_snapshot',
    type: DataType.JSON,
    allowNull: false,
  })
  declare projectSnapshot: object;

  @Column({
    field: 'vendor_snapshot',
    type: DataType.JSON,
    allowNull: false,
  })
  declare vendorSnapshot: object;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare subtotal: number;

  @Column({
    field: 'additional_charges',
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare additionalCharges: number;

  @Column({
    field: 'global_discount_type',
    type: DataType.ENUM(...Object.values(GlobalDiscountType)),
    allowNull: false,
    defaultValue: GlobalDiscountType.FIXED,
  })
  declare globalDiscountType: GlobalDiscountType;

  @Column({
    field: 'global_discount_value',
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare globalDiscountValue: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare discount: number;
  @Column({
    field: 'tax_percent',
    type: DataType.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare taxPercent: number;

  @Column({
    field: 'tax_amount',
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare taxAmount: number;

  @Column({
    field: 'total_amount',
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare totalAmount: number;

  @Column({
    field: 'terms_conditions',
    type: DataType.TEXT,
    allowNull: true,
  })
  declare termsConditions: string | null;

  @Column({
    field: 'submitted_at',
    type: DataType.DATE,
    allowNull: true,
  })
  declare submittedAt: Date | null;

  @ForeignKey(() => User)
  @Column({
    field: 'submitted_by',
    type: DataType.UUID,
    allowNull: true,
  })
  declare submittedBy: string | null;

  @Column({
    field: 'reviewed_at',
    type: DataType.DATE,
    allowNull: true,
  })
  declare reviewedAt: Date | null;

  @ForeignKey(() => User)
  @Column({
    field: 'reviewed_by',
    type: DataType.UUID,
    allowNull: true,
  })
  declare reviewedBy: string | null;

  @Column({
    field: 'review_remarks',
    type: DataType.TEXT,
    allowNull: true,
  })
  declare reviewRemarks: string | null;

  @Column({
    field: 'deleted_at',
    type: DataType.DATE,
    allowNull: true,
  })
  declare deletedAt: Date | null;

  @ForeignKey(() => User)
  @Column({
    field: 'deleted_by',
    type: DataType.UUID,
    allowNull: true,
  })
  declare deletedBy: string | null;

  @ForeignKey(() => User)
  @Column({
    field: 'created_by',
    type: DataType.UUID,
    allowNull: true,
  })
  declare createdBy: string | null;

  @ForeignKey(() => User)
  @Column({
    field: 'updated_by',
    type: DataType.UUID,
    allowNull: true,
  })
  declare updatedBy: string | null;
  @Column({
    field: 'current_version',
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
  })
  declare currentVersion: number;
  @HasMany(() => QuotationVersion)
  declare versions: QuotationVersion[];
  @BelongsTo(() => Project)
  declare project: Project;

  @BelongsTo(() => Vendor)
  declare vendor: Vendor;

  @BelongsTo(() => User, 'submittedBy')
  declare submitter: User;

  @BelongsTo(() => User, 'reviewedBy')
  declare reviewer: User;

  @BelongsTo(() => User, 'deletedBy')
  declare deleter: User;

  @BelongsTo(() => User, 'createdBy')
  declare creator: User;

  @BelongsTo(() => User, 'updatedBy')
  declare updater: User;

  @HasMany(() => QuotationItem)
  declare items: QuotationItem[];
}
