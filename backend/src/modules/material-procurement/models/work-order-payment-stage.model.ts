import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  IsUUID,
} from 'sequelize-typescript';

import { WorkOrder } from './work-order.model';
import { WorkOrderPaymentStageStatus } from '@/common/enums/work-order.enums';

export interface WorkOrderPaymentStageCreationAttributes {
  id?: string;
  work_order_id: string;
  sort_order: number;
  stage_name: string;
  due_date?: Date | null;
  amount: number;
  paid_amount?: number;
  status?: WorkOrderPaymentStageStatus;
  remarks?: string | null;
}

@Table({
  tableName: 'work_order_payment_stages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class WorkOrderPaymentStage extends Model<
  WorkOrderPaymentStage,
  WorkOrderPaymentStageCreationAttributes
> {
  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.CHAR(36),
  })
  declare id: string;

  @ForeignKey(() => WorkOrder)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare work_order_id: string;

  @BelongsTo(() => WorkOrder, {
    foreignKey: 'work_order_id',
    as: 'work_order',
  })
  declare work_order: WorkOrder;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare sort_order: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare stage_name: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare due_date: Date | null;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare amount: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare paid_amount: number;

  @Column({
    type: DataType.ENUM(...Object.values(WorkOrderPaymentStageStatus)),
    allowNull: false,
    defaultValue: WorkOrderPaymentStageStatus.PENDING,
  })
  declare status: WorkOrderPaymentStageStatus;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remarks: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare created_at: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare updated_at: Date;
}
