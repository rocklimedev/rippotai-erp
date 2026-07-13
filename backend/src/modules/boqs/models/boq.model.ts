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
import { Project } from '@/modules/projects/models/projects.model';
import { User } from '@/modules/users/models/user.model';
import { BoqStatus } from '@/common/enums/boq-enums';
import { BoqTemplate } from './boq-template.model';
import { BoqCategory } from './boq-category.model';

@Table({
  tableName: 'boqs',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
})
export class Boq extends Model<Boq> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  @ForeignKey(() => Project)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare project_id: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare title: string;

  // Where this BOQ was seeded from, if any. Kept for traceability only —
  // categories/items below are copied in as independent rows, never a
  // live reference, so later edits to the template don't retroactively
  // change an already-created BOQ.
  @ForeignKey(() => BoqTemplate)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare source_template_id: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(BoqStatus)),
    allowNull: false,
    defaultValue: BoqStatus.DRAFT,
  })
  declare status: BoqStatus;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.0,
  })
  declare total_value: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
  })
  declare version: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare approved_at: Date | null;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare approved_by: string | null;

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

  @BelongsTo(() => Project, { foreignKey: 'project_id', as: 'project' })
  declare project: Project;

  @BelongsTo(() => BoqTemplate, {
    foreignKey: 'source_template_id',
    as: 'source_template',
  })
  declare source_template: BoqTemplate;

  @BelongsTo(() => User, { foreignKey: 'created_by', as: 'creator' })
  declare creator: User;

  @BelongsTo(() => User, { foreignKey: 'updated_by', as: 'updater' })
  declare updater: User;

  @BelongsTo(() => User, { foreignKey: 'approved_by', as: 'approver' })
  declare approver: User;

  @HasMany(() => BoqCategory, { foreignKey: 'boq_id' })
  declare categories: BoqCategory[];
}
