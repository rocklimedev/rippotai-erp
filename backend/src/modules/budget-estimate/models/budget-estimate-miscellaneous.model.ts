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

@Table({
  tableName: 'budget_estimate_miscellaneous',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class BudgetEstimateMiscellaneous extends Model<BudgetEstimateMiscellaneous> {
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
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare value: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare notes: string | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare sort_order: number;

  @BelongsTo(() => BudgetEstimate, {
    foreignKey: 'estimate_id',
    as: 'estimate',
  })
  declare estimate: BudgetEstimate;
}
