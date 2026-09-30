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
import { VisitStatus } from '@/common/enums/architect-visit.enums';
import { ArchitectVisitStage } from './architect-visit-stage.model';
import { SnagItem } from './snag-item.model';

/** A project-level instance of a standard visit stage. */
@Table({
  tableName: 'architect_site_visits',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
  indexes: [
    {
      name: 'uq_project_stage',
      unique: true,
      fields: ['project_id', 'stage_id'],
    },
    { name: 'idx_asv_scheduled', fields: ['scheduled_date', 'status'] },
  ],
})
export class ArchitectSiteVisit extends Model<ArchitectSiteVisit> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  @ForeignKey(() => Project)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare project_id: string;

  @ForeignKey(() => ArchitectVisitStage)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare stage_id: string;

  @Column({
    type: DataType.ENUM(...Object.values(VisitStatus)),
    allowNull: false,
    defaultValue: VisitStatus.NOT_SCHEDULED,
  })
  declare status: VisitStatus;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare scheduled_date: string | null;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  declare visited_date: string | null;

  /** Architect who did / will do the visit */
  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare architect_id: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare findings: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare remarks: string | null;

  /** Only meaningful when the stage's visit_type is Hold Point: work may not proceed until released */
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare hold_released: boolean;

  @Column({ type: DataType.DATE, allowNull: true })
  declare hold_released_at: Date | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare hold_released_by: string | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare created_by: string | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare updated_by: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare deleted_at: Date | null;

  @BelongsTo(() => Project, { foreignKey: 'project_id', as: 'project' })
  declare project: Project;

  @BelongsTo(() => ArchitectVisitStage, { foreignKey: 'stage_id', as: 'stage' })
  declare stage: ArchitectVisitStage;

  @BelongsTo(() => User, { foreignKey: 'architect_id', as: 'architect' })
  declare architect: User;

  @HasMany(() => SnagItem, { foreignKey: 'visit_id', as: 'snags' })
  declare snags: SnagItem[];
}
