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

@Table({
  tableName: 'budget_estimate_versions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
})
export class BudgetEstimateVersion extends Model<BudgetEstimateVersion> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.CHAR(36))
  declare id: string;

  @ForeignKey(() => BudgetEstimate)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare estimate_id: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare version: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare version_name: string;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare total_amount: number;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  declare snapshot: Record<string, unknown> | null;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare created_by: string | null;

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
