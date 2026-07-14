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

  // "L" = lump sum (amount entered directly, quantity/rate not used),
  // "M" = measured (amount derived from quantity * rate). Drives the
  // L/M toggle + editable-cell locking in the BOQ table UI.
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

  // Structured measurement breakdown (formula + length/width/height/
  // repetitions/etc) shown in the Item Detail drawer. Stored as JSON
  // since its shape depends on `formula`.
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

  // When true, the row is excluded from the client-facing PDF export
  // but stays visible (dimmed) in the editor. Used by the row "Hide"
  // action and the pre-export checklist's "items hidden from client
  // copy" count.
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare hidden: boolean;

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
