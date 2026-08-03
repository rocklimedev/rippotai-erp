// execution_drawing_version.model.ts

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

import { ExecutionDrawingSet } from './execution_drawing_set.model';
import { User } from '@/modules/users/models/user.model';
import { ExecutionDrawingApproval } from './execution_drawing_approval.model';

@Table({
  tableName: 'execution_drawing_versions',
  timestamps: true,
  createdAt: 'uploaded_at', // using uploaded_at as createdAt
  updatedAt: false,
})
export class ExecutionDrawingVersion extends Model<
  InferAttributes<ExecutionDrawingVersion>,
  InferCreationAttributes<ExecutionDrawingVersion>
> {
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
    primaryKey: true,
  })
  declare id: CreationOptional<string>;

  @ForeignKey(() => ExecutionDrawingSet)
  @Column({ type: DataType.UUID, allowNull: false })
  declare drawing_set_id: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare version_number: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare file_url: string;

  @Column({ type: DataType.TEXT })
  declare description: CreationOptional<string | null>;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare uploaded_by: string;

  @Default(true)
  @Column({ type: DataType.BOOLEAN, allowNull: false })
  declare is_latest: CreationOptional<boolean>;

  // Virtual generated column (for reference only - not needed in model logic)
  // latest_lock is a generated column used for DB constraint

  // ======================================================
  // RELATIONS
  // ======================================================

  @BelongsTo(() => ExecutionDrawingSet)
  declare drawingSet?: NonAttribute<ExecutionDrawingSet>;

  @BelongsTo(() => User)
  declare uploadedBy?: NonAttribute<User>;

  @HasMany(() => ExecutionDrawingApproval)
  declare approvals?: NonAttribute<ExecutionDrawingApproval[]>;
}
