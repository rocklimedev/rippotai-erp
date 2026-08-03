// execution_drawing_approval.model.ts

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

import { ExecutionDrawingVersion } from './execution_drawing_version.model';
import { Client } from '@/modules/clients/models/client.model';

@Table({
  tableName: 'execution_drawing_approvals',
  timestamps: true,
  createdAt: 'reviewed_at',
  updatedAt: false,
})
export class ExecutionDrawingApproval extends Model<
  InferAttributes<ExecutionDrawingApproval>,
  InferCreationAttributes<ExecutionDrawingApproval>
> {
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
    primaryKey: true,
  })
  declare id: CreationOptional<string>;

  @ForeignKey(() => ExecutionDrawingVersion)
  @Column({ type: DataType.UUID, allowNull: false })
  declare version_id: string;

  @ForeignKey(() => Client)
  @Column({ type: DataType.UUID, allowNull: false })
  declare reviewed_by: string;

  @Column({
    type: DataType.ENUM('Approved', 'Revision_Requested', 'Rejected'),
    allowNull: false,
  })
  declare approval_status: 'Approved' | 'Revision_Requested' | 'Rejected';

  @Column({ type: DataType.TEXT })
  declare comments: CreationOptional<string | null>;

  @Column({ type: DataType.TEXT })
  declare revision_request: CreationOptional<string | null>;

  // ======================================================
  // RELATIONS
  // ======================================================

  @BelongsTo(() => ExecutionDrawingVersion)
  declare version?: NonAttribute<ExecutionDrawingVersion>;

  @BelongsTo(() => Client)
  declare reviewedByClient?: NonAttribute<Client>;
}
