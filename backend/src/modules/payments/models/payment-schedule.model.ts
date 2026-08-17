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
  CreatedAt,
  UpdatedAt,
  DeletedAt,
} from 'sequelize-typescript';

import { PaymentScheduleMilestone } from './payment-schedule-milestone.model';
import { Project } from '@/modules/projects/models/projects.model';
import { TermsTemplate } from '@/modules/metas/models/terms-templates.model';
export enum PaymentScheduleStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Table({
  tableName: 'payment_schedules',
  timestamps: true,
  paranoid: true,
  underscored: true,
})
export class PaymentSchedule extends Model<PaymentSchedule> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  // ===========================
  // PROJECT
  // ===========================

  @ForeignKey(() => Project)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'project_id',
  })
  declare projectId: string;

  @BelongsTo(() => Project)
  declare project: Project;

  // ===========================
  // TERMS
  // ===========================

  @ForeignKey(() => TermsTemplate)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
    field: 'terms_template_id',
  })
  declare termsTemplateId: string | null;

  @BelongsTo(() => TermsTemplate, {
    foreignKey: 'terms_template_id',
    as: 'termsTemplate',
  })
  declare termsTemplate: TermsTemplate | null;

  /**
   * Exact version of the terms used by this payment schedule.
   *
   * Example:
   * termsTemplateId = abc...
   * termsVersion = 1
   *
   * Even if the template later becomes version 2,
   * this payment schedule remains associated with version 1.
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'terms_version',
  })
  declare termsVersion: number | null;

  // ===========================
  // BASIC DETAILS
  // ===========================

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    defaultValue: 'Payment Schedule',
  })
  declare title: string;

  // ===========================
  // FINANCIALS
  // ===========================

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.0,
    field: 'total_contract_value',
  })
  declare totalContractValue: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: null,
    field: 'gst_rate',
  })
  declare gstRate: number | null;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.0,
    field: 'gst_amount',
  })
  declare gstAmount: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.0,
    field: 'total_payable',
  })
  declare totalPayable: number;

  // ===========================
  // STATUS
  // ===========================

  @Column({
    type: DataType.ENUM(...Object.values(PaymentScheduleStatus)),
    allowNull: false,
    defaultValue: PaymentScheduleStatus.DRAFT,
  })
  declare status: PaymentScheduleStatus;

  // ===========================
  // CLIENT ACCEPTANCE
  // ===========================

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'accepted_by_client',
  })
  declare acceptedByClient: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
    field: 'accepted_at',
  })
  declare acceptedAt: Date | null;

  // ===========================
  // TIMESTAMPS
  // ===========================

  @CreatedAt
  @Column({
    type: DataType.DATE,
    field: 'created_at',
  })
  declare createdAt: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    field: 'updated_at',
  })
  declare updatedAt: Date;

  @DeletedAt
  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
    field: 'deleted_at',
  })
  declare deletedAt: Date | null;

  // ===========================
  // MILESTONES
  // ===========================

  @HasMany(() => PaymentScheduleMilestone)
  declare milestones: PaymentScheduleMilestone[];
}
