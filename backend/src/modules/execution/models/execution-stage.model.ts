// execution_stages.model.ts

import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
  HasMany,
} from 'sequelize-typescript';

import type {
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
} from 'sequelize';
import { Project } from '@/modules/projects/models/projects.model';
import { ExecutionActivity } from './execution-activity.model';
import { ExecutionDrawingSet } from './execution_drawing_set.model';

@Table({
  tableName: 'execution_stages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class ExecutionStage extends Model<
  InferAttributes<ExecutionStage>,
  InferCreationAttributes<ExecutionStage>
> {
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, primaryKey: true })
  declare id: CreationOptional<string>;

  @ForeignKey(() => Project)
  @Column({ type: DataType.UUID, allowNull: false })
  declare project_id: string;

  @Default(1)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare order: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare name: string;

  @Column({ type: DataType.TEXT })
  declare description: CreationOptional<string | null>;

  @Column({ type: DataType.DATEONLY })
  declare planned_start_date: CreationOptional<Date | null>;

  @Column({ type: DataType.DATEONLY })
  declare planned_end_date: CreationOptional<Date | null>;

  @Column({ type: DataType.DATEONLY })
  declare actual_start_date: CreationOptional<Date | null>;

  @Column({ type: DataType.DATEONLY })
  declare actual_end_date: CreationOptional<Date | null>;

  @Default(0)
  @Column({ type: DataType.DECIMAL(5, 2) })
  declare progress_percentage: CreationOptional<number>;

  @Default('pending')
  @Column({
    type: DataType.ENUM('pending', 'in_progress', 'completed', 'blocked'),
    allowNull: false,
  })
  declare status: 'pending' | 'in_progress' | 'completed' | 'blocked';

  // ======================================================
  // RELATIONS
  // ======================================================

  @BelongsTo(() => Project)
  declare project?: NonAttribute<Project>;

  @HasMany(() => ExecutionActivity)
  declare activities?: NonAttribute<ExecutionActivity[]>;

  @HasMany(() => ExecutionDrawingSet)
  declare drawingSets?: NonAttribute<ExecutionDrawingSet[]>;
}
