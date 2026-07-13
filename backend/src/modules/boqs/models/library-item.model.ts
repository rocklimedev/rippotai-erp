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
import { LibraryCategory } from './library-category.model';

@Table({
  tableName: 'library_items',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
})
export class LibraryItem extends Model<LibraryItem> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare name: string;

  @ForeignKey(() => LibraryCategory)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare category_id: string | null;

  // Denormalized so old snapshots / list views don't need a join just to
  // render a category name (kept in sync from category on write).
  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare category_name: string | null;

  @ForeignKey(() => Unit)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare unit_id: string | null;

  // Denormalized unit label (e.g. "Nos.", "Sqft") so the item list can
  // render without a join, mirroring how category_name is handled.
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
  declare default_rate: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare notes: string | null;

  @Default(true)
  @Column(DataType.BOOLEAN)
  declare is_active: boolean;

  @BelongsTo(() => LibraryCategory, {
    foreignKey: 'category_id',
    as: 'category',
  })
  declare category: LibraryCategory;

  @BelongsTo(() => Unit, { foreignKey: 'unit_id', as: 'unit_ref' })
  declare unit_ref: Unit;
}
