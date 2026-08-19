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

/**
 * Central assignment of who is expected to visit site and how often —
 * Supervisor daily, Architect on a fixed schedule, a vendor/contractor/client
 * ad hoc or on their own cadence. SiteVisitLog entries are checked off against
 * these assignments (or logged as unscheduled/ad hoc visits).
 */
@Table({ tableName: 'visit_assignments', timestamps: true })
export class VisitAssignment extends Model<VisitAssignment> {
  @ForeignKey(() => Project)
  @Column({ type: DataType.INTEGER, allowNull: false })
  projectId: number;

  @BelongsTo(() => Project)
  project: Project;

  @Column({
    type: DataType.ENUM(...Object.values(VisitorType)),
    allowNull: false,
  })
  visitorType: VisitorType;

  @ForeignKey(() => Team)
  @Column({ type: DataType.INTEGER, allowNull: true })
  teamId: number | null; // internal team responsible, if applicable (e.g. Supervisor, Architect)

  @Column({ type: DataType.STRING(150), allowNull: true })
  externalPartyName: string | null; // vendor/contractor/client name, if not an internal team

  @Column({
    type: DataType.ENUM(...Object.values(VisitFrequency)),
    allowNull: false,
  })
  frequency: VisitFrequency;

  /** For FIXED_SCHEDULE: e.g. weekday numbers [2,5] = Tue/Fri. Informational for schedulers. */
  @Column({ type: DataType.JSON, allowNull: true })
  scheduleDays: number[] | null;

  @Default(true)
  @Column({ type: DataType.BOOLEAN })
  isActive: boolean;

  @HasMany(() => SiteVisitLog)
  visitLogs: SiteVisitLog[];
}
