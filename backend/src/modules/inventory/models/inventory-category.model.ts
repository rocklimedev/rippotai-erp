import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  HasMany,
  Default,
} from 'sequelize-typescript';

@Table({
  tableName: 'inventory_categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class InventoryCategory extends Model {
  @PrimaryKey
  @Column({
    type: DataType.CHAR(36),
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    unique: true,
  })
  declare name: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare code: string;

  @ForeignKey(() => InventoryCategory)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare parent_id: string | null;

  @BelongsTo(() => InventoryCategory, 'parent_id')
  declare parent?: InventoryCategory;

  @HasMany(() => InventoryCategory, 'parent_id')
  declare children?: InventoryCategory[];

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare sort_order: number;

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
  })
  declare is_active: boolean;

  @Column({ type: DataType.DATE })
  declare created_at: Date;

  @Column({ type: DataType.DATE })
  declare updated_at: Date;
}
