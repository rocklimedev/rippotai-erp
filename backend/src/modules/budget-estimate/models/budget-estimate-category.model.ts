import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';

import { BudgetEstimate } from './budget-estimate.model';
import { LibraryCategory } from '@/modules/boqs/models/library-category.model';
import { BudgetEstimateItem } from './budget-estimate-item.model';

/**
 * ============================================================
 * CREATION ATTRIBUTES
 * ============================================================
 */
export interface BudgetEstimateCategoryCreationAttributes {
  id?: string;

  estimate_id: string;

  library_category_id?: string | null;

  name: string;

  sort_order?: number;
}

/**
 * ============================================================
 * MODEL
 * ============================================================
 */
@Table({
  tableName: 'budget_estimate_categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class BudgetEstimateCategory extends Model<
  BudgetEstimateCategory,
  BudgetEstimateCategoryCreationAttributes
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
  // LIBRARY CATEGORY
  // ============================================================

  @ForeignKey(() => LibraryCategory)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare library_category_id: string | null;

  // ============================================================
  // BASIC INFORMATION
  // ============================================================

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare name: string;

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

  @BelongsTo(() => LibraryCategory, {
    foreignKey: 'library_category_id',
    as: 'libraryCategory',
  })
  declare libraryCategory: LibraryCategory;

  @HasMany(() => BudgetEstimateItem, {
    foreignKey: 'estimate_category_id',
    as: 'items',
  })
  declare items: BudgetEstimateItem[];
}
