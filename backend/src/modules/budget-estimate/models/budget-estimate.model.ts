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
import { Boq } from '@/modules/boqs/models/boq.model';
import { BoqTemplate } from '@/modules/boqs/models/boq-template.model';
import { User } from '@/modules/users/models/user.model';
import { TermsTemplate } from '@/modules/metas/models/terms-templates.model';

import { BudgetEstimateCategory } from './budget-estimate-category.model';
import { BudgetEstimateMiscellaneous } from './budget-estimate-miscellaneous.model';
import { BudgetEstimateVersion } from './budget-estimate-version.model';

@Table({
  tableName: 'budget_estimates',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class BudgetEstimate extends Model<BudgetEstimate> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.CHAR(36),
  })
  declare id: string;

  // ============================================================
  // SOURCE
  // ============================================================

  @ForeignKey(() => Project)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare project_id: string;

  @ForeignKey(() => Boq)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare boq_id: string | null;

  @ForeignKey(() => BoqTemplate)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare source_template_id: string | null;

  // ============================================================
  // BASIC INFORMATION
  // ============================================================

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
  })
  declare estimate_number: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare title: string;

  @Column({
    type: DataType.ENUM(
      'draft',
      'in_progress',
      'submitted',
      'approved',
      'rejected',
      'revised',
      'cancelled',
    ),
    allowNull: false,
    defaultValue: 'draft',
  })
  declare status:
    | 'draft'
    | 'in_progress'
    | 'submitted'
    | 'approved'
    | 'rejected'
    | 'revised'
    | 'cancelled';

  // ============================================================
  // TOTALS
  // ============================================================

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare subtotal: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare misc_percentage: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare misc_amount: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare design_amount: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare execution_amount: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare supervisor_amount: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare additional_amount: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare tax_percentage: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare tax_amount: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare discount_amount: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare total_amount: number;

  // ============================================================
  // SNAPSHOT
  // ============================================================

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare client_name: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare location: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare prepared_by: string | null;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare estimate_date: string | null;

  // ============================================================
  // TERMS
  // ============================================================

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare terms_html: string | null;

  @ForeignKey(() => TermsTemplate)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare terms_template_id: string | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare terms_template_version: number | null;

  // ============================================================
  // VERSION / LOCK
  // ============================================================

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
  })
  declare version: number;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare locked: boolean;

  // ============================================================
  // APPROVAL / AUDIT
  // ============================================================

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

  // ============================================================
  // RELATIONS
  // ============================================================

  @BelongsTo(() => Project, {
    foreignKey: 'project_id',
    as: 'project',
  })
  declare project: Project;

  @BelongsTo(() => Boq, {
    foreignKey: 'boq_id',
    as: 'boq',
  })
  declare boq: Boq;

  @BelongsTo(() => BoqTemplate, {
    foreignKey: 'source_template_id',
    as: 'sourceTemplate',
  })
  declare sourceTemplate: BoqTemplate;

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

  @HasMany(() => BudgetEstimateCategory, {
    foreignKey: 'estimate_id',
    as: 'categories',
  })
  declare categories: BudgetEstimateCategory[];

  @HasMany(() => BudgetEstimateMiscellaneous, {
    foreignKey: 'estimate_id',
    as: 'miscellaneous',
  })
  declare miscellaneous: BudgetEstimateMiscellaneous[];

  @HasMany(() => BudgetEstimateVersion, {
    foreignKey: 'estimate_id',
    as: 'versions',
  })
  declare versions: BudgetEstimateVersion[];
}
