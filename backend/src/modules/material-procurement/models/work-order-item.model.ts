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
import { Unit } from '@/modules/metas/models/unit.model';
import { WorkOrderItemType } from '@/common/enums/work-order.enums';

export interface WorkOrderItemCreationAttributes {
  id?: string;
  work_order_id: string;
  sort_order: number;
  item_type?: WorkOrderItemType;
  description: string;
  quantity: number;
  unit_id: string;
  rate: number;
  amount: number;
  remarks?: string | null;
}

@Table({
  tableName: 'work_order_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class WorkOrderItem extends Model<
  WorkOrderItem,
  WorkOrderItemCreationAttributes
> {
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
  // WORK ORDER
  // ============================================================

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

  // ============================================================
  // UNIT
  // ============================================================

  @ForeignKey(() => Unit)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare unit_id: string;

  @BelongsTo(() => Unit, {
    foreignKey: 'unit_id',
    as: 'unit',
  })
  declare unit: Unit;

  // ============================================================
  // ITEM
  // ============================================================

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare sort_order: number;

  @Column({
    type: DataType.ENUM(...Object.values(WorkOrderItemType)),
    allowNull: false,
    defaultValue: WorkOrderItemType.SERVICE,
  })
  declare item_type: WorkOrderItemType;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare description: string;

  @Column({
    type: DataType.DECIMAL(15, 3),
    allowNull: false,
    defaultValue: 0,
  })
  declare quantity: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare rate: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare amount: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remarks: string | null;

  // ============================================================
  // TIMESTAMPS
  // ============================================================

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
