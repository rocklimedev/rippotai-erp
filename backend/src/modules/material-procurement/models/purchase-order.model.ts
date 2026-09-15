import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  Unique,
  Index,
  HasMany,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { MaterialQuotation } from './material-quotation.model';
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';

import { PurchaseOrderItem } from './purchase-order-item.model';

export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  SENT = 'SENT',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
  CLOSED = 'CLOSED',
}

export enum PurchaseOrderSourceType {
  ESTIMATE = 'ESTIMATE',
  BOQ = 'BOQ',
  QUOTATION = 'QUOTATION',
  MANUAL = 'MANUAL',
}

@Table({
  tableName: 'purchase_orders',
  timestamps: true,
})
export class PurchaseOrder extends Model<
  InferAttributes<PurchaseOrder>,
  InferCreationAttributes<PurchaseOrder>
> {
  // ============================================================
  // PRIMARY KEY
  // ============================================================

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: CreationOptional<string>;

  // ============================================================
  // PO IDENTIFICATION
  // ============================================================

  @AllowNull(false)
  @Unique
  @Index
  @Column(DataType.STRING(50))
  declare po_number: string;

  // ============================================================
  // PROJECT / SITE / VENDOR
  // ============================================================

  @AllowNull(false)
  @Index
  @Column(DataType.UUID)
  declare project_id: string;

  @AllowNull(true)
  @Index
  @Column(DataType.UUID)
  declare site_id: string | null;

  @AllowNull(true)
  @Index
  @Column(DataType.UUID)
  declare vendor_id: string | null;

  // ============================================================
  // DATES
  // ============================================================

  @AllowNull(false)
  @Column(DataType.DATEONLY)
  declare po_date: string;

  @AllowNull(true)
  @Column(DataType.DATEONLY)
  declare target_delivery_date: string | null;

  // ============================================================
  // VENDOR CONTACT
  // ============================================================

  @AllowNull(true)
  @Column(DataType.STRING(255))
  declare agency_name: string | null;

  @AllowNull(true)
  @Column(DataType.STRING(255))
  declare contact_person: string | null;

  @AllowNull(true)
  @Column(DataType.STRING(50))
  declare phone: string | null;

  @AllowNull(true)
  @Column(DataType.STRING(255))
  declare email: string | null;

  // ============================================================
  // TAX / VENDOR IDENTIFICATION
  // ============================================================

  @AllowNull(true)
  @Column(DataType.STRING(50))
  declare vendor_gstin: string | null;

  @AllowNull(true)
  @Column(DataType.STRING(50))
  declare vendor_pan: string | null;

  // ============================================================
  // SHIPPING
  // ============================================================

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare ship_to_address: string | null;

  // ============================================================
  // FINANCIALS
  // ============================================================

  @AllowNull(false)
  @Default(0)
  @Column(DataType.DECIMAL(15, 2))
  declare subtotal: CreationOptional<number>;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.DECIMAL(15, 2))
  declare discount: CreationOptional<number>;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.DECIMAL(5, 2))
  declare gst_percent: CreationOptional<number>;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.DECIMAL(15, 2))
  declare gst_amount: CreationOptional<number>;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.DECIMAL(15, 2))
  declare cartage: CreationOptional<number>;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.DECIMAL(15, 2))
  declare total_amount: CreationOptional<number>;

  // ============================================================
  // STATUS
  // ============================================================

  @AllowNull(false)
  @Default(PurchaseOrderStatus.DRAFT)
  @Index
  @Column(DataType.ENUM(...Object.values(PurchaseOrderStatus)))
  declare status: CreationOptional<PurchaseOrderStatus>;

  // ============================================================
  // SOURCE
  // ============================================================

  @AllowNull(false)
  @Default(PurchaseOrderSourceType.MANUAL)
  @Index
  @Column(DataType.ENUM(...Object.values(PurchaseOrderSourceType)))
  declare source_type: CreationOptional<PurchaseOrderSourceType>;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare source_reference_id: string | null;

  // ============================================================
  // NOTES
  // ============================================================

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare notes: string | null;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare terms_and_conditions: string | null;

  // ============================================================
  // AUDIT
  // ============================================================

  @AllowNull(true)
  @Column(DataType.UUID)
  declare created_by: string | null;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare approved_by: string | null;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare approved_at: Date | null;

  // ============================================================
  // ASSOCIATIONS
  // ============================================================

  @HasMany(() => PurchaseOrderItem)
  declare items?: PurchaseOrderItem[];

  // ============================================================
  // QUOTATION REFERENCE
  // ============================================================

  @AllowNull(true)
  @Index
  @ForeignKey(() => MaterialQuotation)
  @Column(DataType.UUID)
  declare quotation_id: string | null;

  @BelongsTo(() => MaterialQuotation, {
    foreignKey: 'quotation_id',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  declare quotation?: MaterialQuotation;
}
