import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  HasMany,
  IsUUID,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

import { User } from '@/modules/users/models/user.model';
import { Vendor } from '@/modules/vendors/models/vendors.model';
import { Project } from '@/modules/projects/models/projects.model';
import { WorkOrderTerm } from './work-order-term.model';
import { WorkOrderStatus } from '@/common/enums/work-order.enums';

import { WorkOrderItem } from './work-order-item.model';
import { WorkOrderPaymentStage } from './work-order-payment-stage.model';
@Table({
  tableName: 'work_orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class WorkOrder extends Model<WorkOrder> {
  // ============================================================
  // ID
  // ============================================================

  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.CHAR(36),
  })
  declare id: string;

  // ============================================================
  // DOCUMENT
  // ============================================================

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
  })
  declare wo_id: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare work_order_date: Date;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare target_completion_date: Date | null;

  @Column({
    type: DataType.ENUM(...Object.values(WorkOrderStatus)),
    allowNull: false,
    defaultValue: WorkOrderStatus.DRAFT,
  })
  declare status: WorkOrderStatus;

  // ============================================================
  // PROJECT
  // ============================================================

  @ForeignKey(() => Project)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare project_id: string;

  @BelongsTo(() => Project, {
    foreignKey: 'project_id',
    as: 'project',
  })
  declare project: Project;

  // ============================================================
  // SERVICE CONTRACTOR / VENDOR
  // ============================================================

  @ForeignKey(() => Vendor)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare vendor_id: string;

  @BelongsTo(() => Vendor, {
    foreignKey: 'vendor_id',
    as: 'vendor',
  })
  declare vendor: Vendor;

  // ============================================================
  // CONTRACTOR SNAPSHOT
  // ============================================================

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare contractor_name: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare contractor_company_name: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare contractor_position: string | null;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  declare contractor_phone: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare contractor_email: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare contractor_address: string | null;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  declare contractor_gstin: string | null;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  declare contractor_pan: string | null;

  // ============================================================
  // PROJECT / SITE SNAPSHOT
  // ============================================================

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare agency: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare project_name: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare site_address: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare site_contact_person: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare site_lead: string | null;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  declare site_phone: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare site_email: string | null;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  declare site_gstin: string | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare working_hours: string | null;

  // ============================================================
  // COMMERCIAL
  // ============================================================

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare subtotal: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare discount: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare gst_percentage: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare gst_amount: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare cartage: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare total_amount: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare payment_terms: string | null;

  // ============================================================
  // ACKNOWLEDGEMENT
  // ============================================================

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare contractor_signatory_name: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare rippotai_signatory_name: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare contractor_signed_at: Date | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare rippotai_signed_at: Date | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare contractor_signature_url: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare rippotai_signature_url: string | null;

  // ============================================================
  // AUDIT
  // ============================================================

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare created_by: string | null;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare updated_by: string | null;

  @BelongsTo(() => User, {
    foreignKey: 'created_by',
    as: 'creator',
  })
  declare creator: User;

  @BelongsTo(() => User, {
    foreignKey: 'updated_by',
    as: 'updater',
  })
  declare updater: User;

  // ============================================================
  // CHILDREN
  // ============================================================

  @HasMany(() => WorkOrderItem, {
    foreignKey: 'work_order_id',
    as: 'items',
  })
  declare items: WorkOrderItem[];

  @HasMany(() => WorkOrderPaymentStage, {
    foreignKey: 'work_order_id',
    as: 'payment_stages',
  })
  declare payment_stages: WorkOrderPaymentStage[];

  @HasMany(() => WorkOrderTerm, {
    foreignKey: 'work_order_id',
    as: 'terms',
  })
  declare terms: WorkOrderTerm[];

  // ============================================================
  // TIMESTAMPS
  // ============================================================

  @CreatedAt
  @Column({
    type: DataType.DATE,
  })
  declare created_at: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
  })
  declare updated_at: Date;
}
