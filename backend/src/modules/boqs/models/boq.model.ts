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
import { BoqMiscellaneous } from './boq-miscellaneous.model';
import { Project } from '@/modules/projects/models/projects.model';
import { User } from '@/modules/users/models/user.model';
import { BoqStatus } from '@/common/enums/boq-enums';
import { BoqTemplate } from './boq-template.model';
import { BoqCategory } from './boq-category.model';
import { BoqVersion } from './boq-version.model';
import { TermsTemplate } from '@/modules/metas/models/terms-templates.model';
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
  @Column(DataType.CHAR(36))
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

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    unique: true,
  })
  declare boq_number: string | null;

  @ForeignKey(() => BoqTemplate)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare source_template_id: string | null;

  @ForeignKey(() => BoqVersion)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare boq_version_id: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(BoqStatus)),
    defaultValue: BoqStatus.DRAFT,
  })
  declare status: BoqStatus;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare locked: boolean;

  @Column({
    type: DataType.DECIMAL(15, 2),
    defaultValue: 0,
  })
  declare total_value: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 1,
  })
  declare version: number;

  @Column(DataType.STRING)
  declare client_name: string | null;

  @Column(DataType.STRING)
  declare location: string | null;

  @Column(DataType.STRING)
  declare prepared_by: string | null;

  @Column(DataType.DATEONLY)
  declare date: string | null;

  // Frozen snapshot of the applicable terms & conditions at the time
  // they were applied. Never edited directly by the user — it's
  // written by BoqService.applyTerms()/cloneAsNewVersion() from a
  // TermsTemplate (see terms_template_id below). Editing the source
  // TermsTemplate later never changes this value, so an approved BOQ's
  // PDF never silently changes underneath it.
  @Column(DataType.TEXT)
  declare terms_html: string | null;

  @ForeignKey(() => TermsTemplate)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare terms_template_id: string | null;

  // Which version of terms_template_id was snapshotted into
  // terms_html. Null if terms_html was hand-typed/legacy and never
  // came from a template.
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare terms_template_version: number | null;

  @Column({
    type: DataType.DECIMAL(5, 2),
    defaultValue: 10,
  })
  declare misc_pct: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    defaultValue: 0,
  })
  declare design_amount: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    defaultValue: 0,
  })
  declare execution_amount: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    defaultValue: 0,
  })
  declare supervisor_amount: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    defaultValue: 0,
  })
  declare additional_total: number;

  @Column(DataType.DATE)
  declare approved_at: Date | null;

  @ForeignKey(() => User)
  @Column(DataType.CHAR(36))
  declare approved_by: string | null;

  @ForeignKey(() => User)
  @Column(DataType.CHAR(36))
  declare created_by: string | null;

  @ForeignKey(() => User)
  @Column(DataType.CHAR(36))
  declare updated_by: string | null;

  // ===========================
  // RELATIONS
  // ===========================

  @BelongsTo(() => Project, {
    foreignKey: 'project_id',
    as: 'project',
  })
  declare project: Project;

  @BelongsTo(() => BoqTemplate, {
    foreignKey: 'source_template_id',
    as: 'sourceTemplate',
  })
  declare sourceTemplate: BoqTemplate;

  @BelongsTo(() => BoqVersion, {
    foreignKey: 'boq_version_id',
    as: 'currentVersion',
  })
  declare currentVersion: BoqVersion;

  @BelongsTo(() => TermsTemplate, {
    foreignKey: 'terms_template_id',
    as: 'termsTemplate',
  })
  declare termsTemplate: TermsTemplate;

  @BelongsTo(() => User, {
    foreignKey: 'created_by',
    as: 'creator',
  })
  declare creator: User;

  @BelongsTo(() => User, {
    foreignKey: 'updated_by',
    as: 'updater',
  })
  declare updater: User;

  @BelongsTo(() => User, {
    foreignKey: 'approved_by',
    as: 'approver',
  })
  declare approver: User;

  @HasMany(() => BoqCategory, {
    foreignKey: 'boq_id',
    as: 'categories',
  })
  @HasMany(() => BoqMiscellaneous, {
    foreignKey: 'boq_id',
    as: 'miscellaneous',
  })
  declare miscellaneous: BoqMiscellaneous[];
  declare categories: BoqCategory[];
  @Column(DataType.DATE)
  declare created_at: Date;

  @Column(DataType.DATE)
  declare updated_at: Date;

  @Column(DataType.DATE)
  declare deleted_at: Date | null;
  declare project_total?: number;
  declare misc_amount?: number;
  declare final_total?: number;
  declare avg_variation_pct?: number | string;
}
