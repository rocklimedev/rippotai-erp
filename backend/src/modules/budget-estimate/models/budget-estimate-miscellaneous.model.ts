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

/**
 * ============================================================
 * CREATION ATTRIBUTES
 * ============================================================
 */
export interface BudgetEstimateMiscellaneousCreationAttributes {
  id?: string;

  estimate_id: string;

  name: string;

  value?: number;

  notes?: string | null;

  sort_order?: number;
}

/**
 * ============================================================
 * MODEL
 * ============================================================
 */
@Table({
  tableName: 'budget_estimate_miscellaneous',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class BudgetEstimateMiscellaneous extends Model<
  BudgetEstimateMiscellaneous,
  BudgetEstimateMiscellaneousCreationAttributes
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
  // BASIC INFORMATION
  // ============================================================

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare name: string;

  // ============================================================
  // VALUE
  // ============================================================

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare value: number;

  // ============================================================
  // NOTES
  // ============================================================

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare notes: string | null;

  // ============================================================
  // SORT ORDER
  // ============================================================

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare sort_order: number;

  // ============================================================
  // RELATIONS
  // ============================================================

  @BelongsTo(() => BudgetEstimate, {
    foreignKey: 'estimate_id',
    as: 'estimate',
  })
  declare estimate: BudgetEstimate;
}
