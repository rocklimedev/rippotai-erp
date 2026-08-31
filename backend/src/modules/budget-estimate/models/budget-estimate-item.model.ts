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

/**
 * ============================================================
 * CREATION ATTRIBUTES
 * ============================================================
 */
export interface BudgetEstimateItemCreationAttributes {
  id?: string;

  estimate_id: string;

  estimate_category_id: string;

  library_item_id?: string | null;

  boq_item_id?: string | null;

  // Snapshot
  name: string;

  unit_id?: string | null;

  unit?: string | null;

  quantity?: number;

  rate?: number;

  amount?: number;

  calc_type?: 'M' | 'L';

  location?: string | null;

  detail?: Record<string, unknown> | null;

  notes?: string | null;

  hidden?: boolean;

  sort_order?: number;
}

/**
 * ============================================================
 * MODEL
 * ============================================================
 */
@Table({
  tableName: 'budget_estimate_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class BudgetEstimateItem extends Model<
  BudgetEstimateItem,
  BudgetEstimateItemCreationAttributes
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
  // ESTIMATE CATEGORY
  // ============================================================

  @ForeignKey(() => BudgetEstimateCategory)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare estimate_category_id: string;

  // ============================================================
  // LIBRARY ITEM
  // ============================================================

  @ForeignKey(() => LibraryItem)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare library_item_id: string | null;

  // ============================================================
  // BOQ ITEM
  // ============================================================

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

  // ============================================================
  // UNIT
  // ============================================================

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

  // ============================================================
  // CALCULATION
  // ============================================================

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

  // ============================================================
  // ADDITIONAL INFORMATION
  // ============================================================

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
