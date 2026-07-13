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
import { Unit } from '@/modules/metas/models/unit.model';
import { LibraryItem } from './library-item.model';
import { BoqCategory } from './boq-category.model';

@Table({
  tableName: 'boq_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class BoqItem extends Model<BoqItem> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  @ForeignKey(() => BoqCategory)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare boq_category_id: string;

  // Soft reference only. Kept so "used in N BOQ line items" counts are
  // possible from LibraryService.remove(), but every display field below
  // is a snapshot copied at insert time and never re-synced from here.
  @ForeignKey(() => LibraryItem)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare library_item_id: string | null;

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
    defaultValue: 0.0,
  })
  declare quantity: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.0,
  })
  declare rate: number;

  // Persisted rather than purely virtual so it can be summed in SQL
  // (SUM(amount)) without loading every row into Node to compute totals.
  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.0,
  })
  declare amount: number;

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

  @BelongsTo(() => BoqCategory, { foreignKey: 'boq_category_id' })
  declare category: BoqCategory;

  @BelongsTo(() => LibraryItem, { foreignKey: 'library_item_id' })
  declare library_item: LibraryItem;

  @BelongsTo(() => Unit, { foreignKey: 'unit_id', as: 'unit_ref' })
  declare unit_ref: Unit;
}
