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
import { BudgetEstimateCategory } from './budget-estimate-category.model';
import { LibraryItem } from '@/modules/boqs/models/library-item.model';
import { BoqItem } from '@/modules/boqs/models/boq-item.model';
import { Unit } from '@/modules/metas/models/unit.model';

@Table({
  tableName: 'budget_estimate_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class BudgetEstimateItem extends Model<BudgetEstimateItem> {
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

  @ForeignKey(() => BudgetEstimateCategory)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare estimate_category_id: string;

  @ForeignKey(() => LibraryItem)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare library_item_id: string | null;

  @ForeignKey(() => BoqItem)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare boq_item_id: string | null;

  // ============================================================
  // SNAPSHOT
  // ============================================================

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare name: string;

  @ForeignKey(() => Unit)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare unit_id: string | null;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  declare unit: string | null;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare quantity: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare rate: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare amount: number;

  @Column({
    type: DataType.ENUM('M', 'L'),
    allowNull: false,
    defaultValue: 'M',
  })
  declare calc_type: 'M' | 'L';

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare location: string | null;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  declare detail: Record<string, unknown> | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare notes: string | null;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare hidden: boolean;

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

  @BelongsTo(() => BudgetEstimateCategory, {
    foreignKey: 'estimate_category_id',
    as: 'category',
  })
  declare category: BudgetEstimateCategory;

  @BelongsTo(() => LibraryItem, {
    foreignKey: 'library_item_id',
    as: 'libraryItem',
  })
  declare libraryItem: LibraryItem;

  @BelongsTo(() => BoqItem, {
    foreignKey: 'boq_item_id',
    as: 'boqItem',
  })
  declare boqItem: BoqItem;

  @BelongsTo(() => Unit, {
    foreignKey: 'unit_id',
    as: 'unitRef',
  })
  declare unitRef: Unit;
}
