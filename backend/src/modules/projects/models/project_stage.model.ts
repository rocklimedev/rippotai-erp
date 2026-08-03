// project_stage.model.ts

import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  HasMany,
} from 'sequelize-typescript';

import type {
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
} from 'sequelize';

import { ProjectStageHistory } from './project_stage_history.model';

@Table({
  tableName: 'project_stages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class ProjectStage extends Model<
  InferAttributes<ProjectStage>,
  InferCreationAttributes<ProjectStage>
> {
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
    primaryKey: true,
  })
  declare id: CreationOptional<string>;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
  })
  declare code: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    comment: 'Pre-Construction / Execution / Closure / Exception',
  })
  declare module_group: CreationOptional<string | null>;

  @Column({ type: DataType.TEXT })
  declare description: CreationOptional<string | null>;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare sort_order: number;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare is_terminal: boolean;

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare is_active: boolean;

  // ======================================================
  // RELATIONS
  // ======================================================

  @HasMany(() => ProjectStageHistory)
  declare histories?: NonAttribute<ProjectStageHistory[]>;
}
