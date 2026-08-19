import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
} from 'sequelize-typescript';
import { Project } from '@/modules/projects/models/projects.model';
import { VisitAssignment } from './visit-assignment.model';
import {
  VisitorType,
  VisitStatus,
} from '../../../common/enums/site-operations.enums';

/** A single logged (or missed/cancelled) site visit. */
@Table({ tableName: 'site_visit_logs', timestamps: true })
export class SiteVisitLog extends Model<SiteVisitLog> {
  @ForeignKey(() => Project)
  @Column({ type: DataType.INTEGER, allowNull: false })
  projectId: number;

  @BelongsTo(() => Project)
  project: Project;

  /** Optional link to the recurring assignment this visit fulfils. Null = ad hoc/unscheduled visit. */
  @ForeignKey(() => VisitAssignment)
  @Column({ type: DataType.INTEGER, allowNull: true })
  visitAssignmentId: number | null;

  @BelongsTo(() => VisitAssignment)
  visitAssignment: VisitAssignment;

  @Column({
    type: DataType.ENUM(...Object.values(VisitorType)),
    allowNull: false,
  })
  visitorType: VisitorType;

  @Column({ type: DataType.STRING(150), allowNull: false })
  visitorName: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  scheduledDate: string;

  @Column({ type: DataType.DATE, allowNull: true })
  actualVisitAt: Date | null;

  @Default(VisitStatus.SCHEDULED)
  @Column({
    type: DataType.ENUM(...Object.values(VisitStatus)),
    allowNull: false,
  })
  status: VisitStatus;

  @Column({ type: DataType.STRING(250), allowNull: true })
  purpose: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  notes: string | null;

  @Column({ type: DataType.STRING(150), allowNull: false })
  loggedBy: string;
}
