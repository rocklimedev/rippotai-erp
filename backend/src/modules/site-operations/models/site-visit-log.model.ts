import {
  Table,
  Column,
  Model,
  PrimaryKey,
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
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare id: string;

  @ForeignKey(() => Project)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  projectId: string;

  @BelongsTo(() => Project, { constraints: false })
  project: Project;

  /** Optional link to the recurring assignment this visit fulfils. Null = ad hoc/unscheduled visit. */
  @ForeignKey(() => VisitAssignment)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  visitAssignmentId: string | null;

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
