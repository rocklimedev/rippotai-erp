import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

import { PaymentSchedule } from './payment-schedule.model';

export enum MilestoneStatus {
  PENDING = 'PENDING',
  DUE = 'DUE',
  INVOICED = 'INVOICED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  WAIVED = 'WAIVED',
}

@Table({
  tableName: 'payment_schedule_milestones',
  timestamps: true,
  underscored: true,
})
export class PaymentScheduleMilestone extends Model<PaymentScheduleMilestone> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => PaymentSchedule)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'payment_schedule_id',
  })
  declare paymentScheduleId: string;

  @BelongsTo(() => PaymentSchedule)
  declare paymentSchedule: PaymentSchedule;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'milestone_number',
  })
  declare milestoneNumber: number;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    field: 'milestone_code',
  })
  declare milestoneCode: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  declare description: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    defaultValue: null,
    field: 'release_trigger',
  })
  declare releaseTrigger: string | null;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare percentage: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare amount: number;

  @Column({
    type: DataType.ENUM(...Object.values(MilestoneStatus)),
    allowNull: false,
    defaultValue: MilestoneStatus.PENDING,
  })
  declare status: MilestoneStatus;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
    field: 'due_date',
  })
  declare dueDate: Date | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
    field: 'invoice_date',
  })
  declare invoiceDate: Date | null;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'paid_amount',
  })
  declare paidAmount: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
    field: 'paid_at',
  })
  declare paidAt: Date | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'sort_order',
  })
  declare sortOrder: number;

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
}
