// execution_drawing_set.model.ts

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
import { ExecutionStage } from './execution-stage.model';
import { ExecutionDrawingVersion } from './execution_drawing_version.model';

@Table({
  tableName: 'execution_drawing_sets',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class ExecutionDrawingSet extends Model<
  InferAttributes<ExecutionDrawingSet>,
  InferCreationAttributes<ExecutionDrawingSet>
> {
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID, primaryKey: true })
  declare id: CreationOptional<string>;

  @ForeignKey(() => Project)
  @Column({ type: DataType.UUID, allowNull: false })
  declare project_id: string;

  @Column({
    type: DataType.ENUM('Technical', 'Construction', 'Working'),
    allowNull: false,
  })
  declare drawing_category: 'Technical' | 'Construction' | 'Working';

  @Column({
    type: DataType.ENUM(
      'Electrical',
      'Plumbing',
      'Structural',
      'Working',
      'Other',
    ),
    allowNull: false,
  })
  declare drawing_discipline:
    | 'Electrical'
    | 'Plumbing'
    | 'Structural'
    | 'Working'
    | 'Other';

  @Column({ type: DataType.STRING(100) })
  declare area_floor_reference: CreationOptional<string | null>;

  @ForeignKey(() => ExecutionStage)
  @Column({ type: DataType.UUID, allowNull: true })
  declare stage_id: CreationOptional<string | null>;

  // ======================================================
  // RELATIONS
  // ======================================================

  @BelongsTo(() => Project)
  declare project?: NonAttribute<Project>;

  @BelongsTo(() => ExecutionStage)
  declare executionStage?: NonAttribute<ExecutionStage>;

  @HasMany(() => ExecutionDrawingVersion)
  declare versions?: NonAttribute<ExecutionDrawingVersion[]>;
}
