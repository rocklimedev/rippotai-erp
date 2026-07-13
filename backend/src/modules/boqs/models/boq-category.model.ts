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
import { Boq } from './boq.model';
import { BoqItem } from './boq-item.model';

@Table({
  tableName: 'boq_categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class BoqCategory extends Model<BoqCategory> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  @ForeignKey(() => Boq)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare boq_id: string;

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

  @BelongsTo(() => Boq, { foreignKey: 'boq_id' })
  declare boq: Boq;

  @HasMany(() => BoqItem, { foreignKey: 'boq_category_id' })
  declare items: BoqItem[];
}
