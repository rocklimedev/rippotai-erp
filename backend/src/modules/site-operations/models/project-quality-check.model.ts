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
import { Project } from '@/modules/projects/models/projects.model';
import { User } from '@/modules/users/models/user.model';
import { QualityCheckStatus } from '@/common/enums/architect-visit.enums';
import { QualityCheckHead } from './quality-check-head.model';

/**
 * Result of one quality-check head on one project.
 * Source sheet: ARCHITECT SITEVISIT SCHEDULE.xlsx → "Quality check list"
 * (per-project Status / Remarks columns).
 */
@Table({
  tableName: 'project_quality_checks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'uq_pqc_project_item',
      unique: true,
      fields: ['project_id', 'item_id'],
    },
  ],
})
export class ProjectQualityCheck extends Model<ProjectQualityCheck> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  @ForeignKey(() => Project)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare project_id: string;

  /** FK to quality_check_heads (master catalog) */
  @ForeignKey(() => QualityCheckHead)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare item_id: string;

  @Column({
    type: DataType.ENUM(...Object.values(QualityCheckStatus)),
    allowNull: false,
    defaultValue: QualityCheckStatus.PENDING,
  })
  declare status: QualityCheckStatus;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare remarks: string | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare checked_by: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare checked_at: Date | null;

  @BelongsTo(() => Project, { foreignKey: 'project_id', as: 'project' })
  declare project: Project;

  @BelongsTo(() => QualityCheckHead, { foreignKey: 'item_id', as: 'item' })
  declare item: QualityCheckHead;

  @BelongsTo(() => User, { foreignKey: 'checked_by', as: 'checker' })
  declare checker: User;
}
