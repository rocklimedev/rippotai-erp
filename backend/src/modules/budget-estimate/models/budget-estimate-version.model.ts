import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import { BudgetEstimate } from './budget-estimate.model';
import { User } from '@/modules/users/models/user.model';

/**
 * ============================================================
 * CREATION ATTRIBUTES
 * ============================================================
 */
export interface BudgetEstimateVersionCreationAttributes {
  id?: string;

  estimate_id: string;

  version: number;

  version_name: string;

  total_amount?: number;

  snapshot?: Record<string, unknown> | null;

  created_by?: string | null;
}

/**
 * ============================================================
 * MODEL
 * ============================================================
 */
@Table({
  tableName: 'budget_estimate_versions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
})
export class BudgetEstimateVersion extends Model<
  BudgetEstimateVersion,
  BudgetEstimateVersionCreationAttributes
> {
  // ============================================================
  // PRIMARY KEY
  // ============================================================

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.CHAR(36))
  declare id: string;

  // ============================================================
  // ESTIMATE
  // ============================================================

  @ForeignKey(() => BudgetEstimate)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare estimate_id: string;

  // ============================================================
  // VERSION
  // ============================================================

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare version: number;

  // ============================================================
  // VERSION NAME
  // ============================================================

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare version_name: string;

  // ============================================================
  // TOTAL
  // ============================================================

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare total_amount: number;

  // ============================================================
  // SNAPSHOT
  // ============================================================

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  declare snapshot: Record<string, unknown> | null;

  // ============================================================
  // AUDIT
  // ============================================================

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare created_by: string | null;

  // ============================================================
  // RELATIONS
  // ============================================================

  @BelongsTo(() => BudgetEstimate, {
    foreignKey: 'estimate_id',
    as: 'estimate',
  })
  declare estimate: BudgetEstimate;

  @BelongsTo(() => User, {
    foreignKey: 'created_by',
    as: 'creator',
  })
  declare creator: User;
}
