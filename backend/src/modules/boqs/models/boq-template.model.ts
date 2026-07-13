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
import { User } from '@/modules/users/models/user.model';
import { TemplateTier } from '@/common/enums/boq-enums';
import { BoqTemplateCategory } from './boq-template-category.model';

@Table({
  tableName: 'boq_templates',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
})
export class BoqTemplate extends Model<BoqTemplate> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.ENUM(...Object.values(TemplateTier)),
    allowNull: true,
  })
  declare template_tier: TemplateTier | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string | null;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare created_by: string | null;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare updated_by: string | null;

  @BelongsTo(() => User, { foreignKey: 'created_by', as: 'creator' })
  declare creator: User;

  @BelongsTo(() => User, { foreignKey: 'updated_by', as: 'updater' })
  declare updater: User;

  @HasMany(() => BoqTemplateCategory, { foreignKey: 'template_id' })
  declare categories: BoqTemplateCategory[];
  // Computed fields from queries (not database columns)
  declare category_count?: number;
  declare item_count?: number;
  declare total_value?: number;
  // Computed (not persisted) fields the frontend list expects:
  // category_count, item_count, total_value.
  // These are attached in BoqTemplateService via Sequelize literals /
  // aggregation rather than stored columns, to avoid drift.
}
