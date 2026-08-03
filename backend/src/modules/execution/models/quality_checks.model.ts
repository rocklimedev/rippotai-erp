// quality_checks.model.ts

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
import { ExecutionStage } from '@/modules/execution/models/execution-stage.model';
import { User } from '@/modules/users/models/user.model';

@Table({
  tableName: 'quality_checks',
  timestamps: false, // No created_at / updated_at in this table
})
export class QualityCheck extends Model<
  InferAttributes<QualityCheck>,
  InferCreationAttributes<QualityCheck>
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

  @Column({ type: DataType.STRING(100) })
  declare stage_name: CreationOptional<string | null>;

  @ForeignKey(() => ExecutionStage)
  @Column({ type: DataType.UUID, allowNull: true })
  declare execution_stage_id: CreationOptional<string | null>;

  @Column({ type: DataType.BOOLEAN })
  declare quality_met: CreationOptional<boolean | null>;

  @Column({ type: DataType.BOOLEAN })
  declare deviations: CreationOptional<boolean | null>;

  @Column({ type: DataType.BOOLEAN })
  declare corrective_action_required: CreationOptional<boolean | null>;

  @Column({ type: DataType.TEXT })
  declare supervisor_remarks: CreationOptional<string | null>;

  @Column({ type: DataType.DATEONLY })
  declare checked_date: CreationOptional<Date | null>;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  declare checked_by: CreationOptional<string | null>;

  // ======================================================
  // RELATIONS
  // ======================================================

  @BelongsTo(() => Project)
  declare project?: NonAttribute<Project>;

  @BelongsTo(() => ExecutionStage)
  declare executionStage?: NonAttribute<ExecutionStage>;

  @BelongsTo(() => User)
  declare checkedBy?: NonAttribute<User>;
}
