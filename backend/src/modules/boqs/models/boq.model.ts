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

  // Human-facing identifier shown in the header chip, e.g. "BOQ-2026-014".
  // Falls back to `BOQ-V{version}` in the UI when null.
  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    unique: true,
  })
  declare boq_number: string | null;

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

  // Independent of status: an approved/final BOQ is locked, but a BOQ
  // can also be locked manually (e.g. archived) regardless of status.
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare locked: boolean;

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

  // Snapshot fields shown in the summary header. Denormalized off
  // Project on create so a BOQ's header doesn't silently change if the
  // project record is edited later.
  @Column({ type: DataType.STRING(255), allowNull: true })
  declare client_name: string | null;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare location: string | null;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare prepared_by: string | null;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare date: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare terms_html: string | null;

  // Miscellaneous % applied on top of project_total to derive
  // final_total. misc_amount/project_total/final_total are computed in
  // BoqService.withComputedTotals(), never persisted, so they can never
  // drift from the underlying line items.
  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 10,
  })
  declare misc_pct: number;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false, defaultValue: 0 })
  declare design_amount: number;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false, defaultValue: 0 })
  declare execution_amount: number;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false, defaultValue: 0 })
  declare supervisor_amount: number;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false, defaultValue: 0 })
  declare additional_total: number;

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

  // Computed, not persisted — attached by BoqService.withComputedTotals().
  declare project_total?: number;
  declare misc_amount?: number;
  declare final_total?: number;
}
