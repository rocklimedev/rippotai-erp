// execution_activity.model.ts

import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
} from 'sequelize-typescript';

import type {
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
} from 'sequelize';
import { Project } from '@/modules/projects/models/projects.model';
import { ExecutionStage } from './execution-stage.model';
import { User } from '@/modules/users/models/user.model';

@Table({
  tableName: 'execution_activities',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class ExecutionActivity extends Model<
  InferAttributes<ExecutionActivity>,
  InferCreationAttributes<ExecutionActivity>
> {
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, primaryKey: true })
  declare id: CreationOptional<string>;

  @ForeignKey(() => Project)
  @Column({ type: DataType.UUID, allowNull: false })
  declare project_id: string;

  @ForeignKey(() => ExecutionStage)
  @Column({ type: DataType.UUID, allowNull: true })
  declare stage_id: CreationOptional<string | null>;

  @Default(1)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare order: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare title: string;

  @Column({ type: DataType.TEXT })
  declare description: CreationOptional<string | null>;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare activity_date: Date;

  @Column({ type: DataType.DATEONLY })
  declare planned_start_date: CreationOptional<Date | null>;

  @Column({ type: DataType.DATEONLY })
  declare planned_end_date: CreationOptional<Date | null>;

  @Column({ type: DataType.DECIMAL(12, 2) })
  declare planned_quantity: CreationOptional<number | null>;

  @Column({ type: DataType.DECIMAL(12, 2) })
  declare completed_quantity: CreationOptional<number | null>;

  @Default(0)
  @Column({ type: DataType.DECIMAL(5, 2) })
  declare progress_percentage: CreationOptional<number>;

  @Column({ type: DataType.STRING(50) })
  declare unit: CreationOptional<string | null>;

  @Default('pending')
  @Column({
    type: DataType.ENUM('pending', 'ongoing', 'completed', 'delayed'),
    allowNull: false,
  })
  declare status: 'pending' | 'ongoing' | 'completed' | 'delayed';

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  declare created_by: CreationOptional<string | null>;

  // ======================================================
  // RELATIONS
  // ======================================================

  @BelongsTo(() => Project)
  declare project?: NonAttribute<Project>;

  @BelongsTo(() => ExecutionStage)
  declare executionStage?: NonAttribute<ExecutionStage>;

  @BelongsTo(() => User)
  declare creator?: NonAttribute<User>;
}
