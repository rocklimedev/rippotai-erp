import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  BelongsToMany,
  IsUUID,
} from 'sequelize-typescript';

import { Project } from '../../projects/models/projects.model';
import { User } from '@/modules/users/models/user.model';
import { TermsTemplate } from '@/modules/metas/models/terms-templates.model';
import { TermsTemplateVersion } from '@/modules/metas/models/terms-template-version.model';
import { ProjectPhase } from '../../projects/models/project-phase.model';
import { PlanOfActionPhase } from './plan-of-action-phase.model';
import { PlanOfActionStatus } from '@/common/enums/plan-of-action.enums';

@Table({
  tableName: 'plan_of_actions',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
})
export class PlanOfAction extends Model<PlanOfAction> {
  // ============================================================
  // Primary Key
  // ============================================================

  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.CHAR(36),
  })
  declare id: string;

  // ============================================================
  // Project
  // ============================================================

  @ForeignKey(() => Project)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare project_id: string;

  // ============================================================
  // Basic Information
  // ============================================================

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    defaultValue: 'Plan of Action',
  })
  declare title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare execution_description: string | null;

  // ============================================================
  // Phase / Duration Summary
  // ============================================================

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare total_phases: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare total_duration_min_days: number | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare total_duration_max_days: number | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare total_duration_label: string | null;

  // Example:
  // "4-5 months"
  //
  // This is a display label and can be calculated from
  // total_duration_min_days / total_duration_max_days.

  // ============================================================
  // Terms & Conditions
  // ============================================================

  @ForeignKey(() => TermsTemplate)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare terms_template_id: string | null;

  @ForeignKey(() => TermsTemplateVersion)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare terms_template_version_id: string | null;

  // Exact version selected when the plan was last published.

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare terms_content_snapshot: string | null;

  // Frozen copy of the selected TermsTemplateVersion content.
  //
  // This prevents future template changes from modifying
  // an already published Plan of Action.

  // ============================================================
  // Status
  // ============================================================

  @Column({
    type: DataType.ENUM(...Object.values(PlanOfActionStatus)),
    allowNull: false,
    defaultValue: PlanOfActionStatus.DRAFT,
  })
  declare status: PlanOfActionStatus;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare published_at: Date | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
  })
  declare version: number;

  // ============================================================
  // Audit
  // ============================================================

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

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare deleted_at: Date | null;

  // ============================================================
  // Associations
  // ============================================================

  @BelongsTo(() => Project, {
    foreignKey: 'project_id',
    as: 'project',
  })
  declare project: Project;

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

  @BelongsTo(() => TermsTemplate, {
    foreignKey: 'terms_template_id',
    as: 'terms_template',
  })
  declare terms_template: TermsTemplate;

  @BelongsTo(() => TermsTemplateVersion, {
    foreignKey: 'terms_template_version_id',
    as: 'terms_version',
  })
  declare terms_version: TermsTemplateVersion;

  // ============================================================
  // Plan of Action <-> Project Phases
  // Many-to-Many through PlanOfActionPhase
  // ============================================================

  @BelongsToMany(() => ProjectPhase, {
    through: () => PlanOfActionPhase,
    foreignKey: 'plan_of_action_id',
    otherKey: 'project_phase_id',
    as: 'phases',
  })
  declare phases: ProjectPhase[];

  // ============================================================
  // Team Members
  // ============================================================
  //
  // Team members are intentionally NOT a Sequelize association.
  //
  // They live in the generic TeamMember table using:
  //
  // owner_type = PLAN_OF_ACTION
  // owner_id   = this.id
  //
  // They are fetched through TeamService.
}
