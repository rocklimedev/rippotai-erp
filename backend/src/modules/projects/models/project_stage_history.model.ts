// project_stage_history.model.ts

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

import { Project } from './projects.model';
import { ProjectStage } from './project_stage.model';
import { User } from '@/modules/users/models/user.model';

@Table({
  tableName: 'project_stage_history',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false, // no updated_at column in this table
})
export class ProjectStageHistory extends Model<
  InferAttributes<ProjectStageHistory>,
  InferCreationAttributes<ProjectStageHistory>
> {
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
    primaryKey: true,
  })
  declare id: CreationOptional<string>;

  @ForeignKey(() => Project)
  @Column({ type: DataType.UUID, allowNull: false })
  declare project_id: string;

  @ForeignKey(() => ProjectStage)
  @Column({ type: DataType.UUID, allowNull: false })
  declare stage_id: string;

  @Default('in_progress')
  @Column({
    type: DataType.ENUM('in_progress', 'completed', 'skipped'),
    allowNull: false,
  })
  declare status: 'in_progress' | 'completed' | 'skipped';

  @Default(DataType.NOW)
  @Column({ type: DataType.DATE, allowNull: false })
  declare started_at: Date;

  @Column({ type: DataType.DATE })
  declare completed_at: CreationOptional<Date | null>;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  declare changed_by: CreationOptional<string | null>;

  @Column({ type: DataType.TEXT })
  declare remarks: CreationOptional<string | null>;

  // ======================================================
  // RELATIONS
  // ======================================================

  @BelongsTo(() => Project)
  declare project?: NonAttribute<Project>;

  @BelongsTo(() => ProjectStage)
  declare stage?: NonAttribute<ProjectStage>;

  @BelongsTo(() => User)
  declare changedBy?: NonAttribute<User>;
}
