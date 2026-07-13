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
import { BoqTemplate } from './boq-template.model';
import { BoqTemplateItem } from './boq-template-item.model';

@Table({
  tableName: 'boq_template_categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class BoqTemplateCategory extends Model<BoqTemplateCategory> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  @ForeignKey(() => BoqTemplate)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare template_id: string;

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

  @BelongsTo(() => BoqTemplate, { foreignKey: 'template_id' })
  declare template: BoqTemplate;

  @HasMany(() => BoqTemplateItem, { foreignKey: 'template_category_id' })
  declare items: BoqTemplateItem[];
}
