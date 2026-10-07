import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
  HasMany,
} from 'sequelize-typescript';
import { Project } from '@/modules/projects/models/projects.model';
import { Team } from '../../process-workflow/models/team.model';
import {
  VisitorType,
  VisitFrequency,
} from '../../../common/enums/site-operations.enums';
import { SiteVisitLog } from './site-visit-log.model';
import { ArchitectVisitStage } from './architect-visit-stage.model';

/**
 * One dated visit allocation. Architect stage metadata is fixed from the
 * schedule and copied into the event. Nullable dates/stages preserve legacy rows.
 */
@Table({ tableName: 'visit_assignments', timestamps: true })
export class VisitAssignment extends Model<VisitAssignment> {
  @ForeignKey(() => ArchitectVisitStage)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  stageId: string | null;

  @BelongsTo(() => ArchitectVisitStage)
  stage: ArchitectVisitStage;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  scheduledDate: string | null;

  @Column({ type: DataType.STRING(255), allowNull: true })
  stageName: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  checksPurpose: string | null;

  @Column({ type: DataType.STRING(40), allowNull: true })
  visitType: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  purpose: string | null;

  @ForeignKey(() => Project)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  projectId: string;

  @BelongsTo(() => Project, { constraints: false })
  project: Project;

  @Column({
    type: DataType.ENUM(...Object.values(VisitorType)),
    allowNull: false,
  })
  visitorType: VisitorType;

  @ForeignKey(() => Team)
  @Column({ type: DataType.INTEGER, allowNull: true })
  teamId: number | null; // internal team responsible, if applicable (e.g. Supervisor, Architect)

  @BelongsTo(() => Team)
  team: Team;

  @Column({ type: DataType.STRING(150), allowNull: true })
  externalPartyName: string | null; // vendor/contractor/client name, if not an internal team

  @Column({
    type: DataType.ENUM(...Object.values(VisitFrequency)),
    allowNull: true,
  })
  frequency: VisitFrequency | null; // legacy recurrence only

  /** Historical recurrence metadata; new allocations always store null. */
  @Column({ type: DataType.JSON, allowNull: true })
  scheduleDays: number[] | null;

  @Default(true)
  @Column({ type: DataType.BOOLEAN })
  isActive: boolean;

  @HasMany(() => SiteVisitLog)
  visitLogs: SiteVisitLog[];
}
