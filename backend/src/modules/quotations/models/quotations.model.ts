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
    { name: 'idx_quotations_project', fields: ['project_id'] },
    { name: 'idx_quotations_vendor', fields: ['vendor_id'] },
    { name: 'idx_quotations_status', fields: ['status'] },
    { name: 'idx_quotations_date', fields: ['quotation_date'] },
    { name: 'idx_quotations_expiry', fields: ['expiry_date'] },
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

  /** ==================== NEW / MISSING FIELDS ==================== */

  @Column({
    field: 'expiry_date',
    type: DataType.DATEONLY,
    allowNull: true,
    comment: 'Quotation validity / expiry date (used in Expiring Soon widget)',
  })
  declare expiryDate: string | null;

  @Column({
    field: 'validity_days',
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 30,
    comment: 'Default validity period in days from quotation_date',
  })
  declare validityDays: number | null;

  @Column({
    field: 'comparison_notes',
    type: DataType.TEXT,
    allowNull: true,
  })
  declare comparisonNotes: string | null;

  @Column({
    field: 'selected_at',
    type: DataType.DATE,
    allowNull: true,
  })
  declare selectedAt: Date | null;

  @ForeignKey(() => User)
  @Column({
    field: 'selected_by',
    type: DataType.UUID,
    allowNull: true,
  })
  declare selectedBy: string | null;

  @Column({
    field: 'is_selected',
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare isSelected: boolean;

  @Column({
    field: 'boq_reference',
    type: DataType.STRING,
    allowNull: true,
  })
  declare boqReference: string | null;

  /** ==================== EXISTING FIELDS ==================== */

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

  /** ==================== ASSOCIATIONS ==================== */

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

  @BelongsTo(() => User, 'selectedBy')
  declare selector: User;

  @HasMany(() => QuotationItem)
  declare items: QuotationItem[];

  /** ==================== VIRTUAL ATTRIBUTES FOR DASHBOARD ==================== */

  // Used in getBoqVariance, getVariationByProject, etc.
  @Column({
    type: DataType.VIRTUAL,
    allowNull: true,
  })
  declare avg_variation_pct: number;

  // Used in getExpiringSoon
  @Column({
    type: DataType.VIRTUAL,
    allowNull: true,
  })
  declare days_left: number;

  // Used in getProjectWise and status mix
  @Column({
    type: DataType.VIRTUAL,
    allowNull: true,
  })
  declare quotation_count: number;

  @Column({
    type: DataType.VIRTUAL,
    allowNull: true,
  })
  declare combined_value: number;

  @Column({
    type: DataType.VIRTUAL,
    allowNull: true,
  })
  declare vendor_count: number;

  @Column({
    type: DataType.VIRTUAL,
    allowNull: true,
  })
  declare latest_status: string;
}
