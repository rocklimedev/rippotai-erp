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
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare projectId: string;

  @BelongsTo(() => Project, { constraints: false })
  declare project: Project;

  /** Event allocation fulfilled by this visit. Required for new architect logs. */
  @ForeignKey(() => VisitAssignment)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare visitAssignmentId: number | null;

  @BelongsTo(() => VisitAssignment)
  declare visitAssignment: VisitAssignment;

  @Column({
    type: DataType.ENUM(...Object.values(VisitorType)),
    allowNull: false,
  })
  declare visitorType: VisitorType;

  @Column({ type: DataType.STRING(150), allowNull: false })
  declare visitorName: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare scheduledDate: string;

  @Column({ type: DataType.DATE, allowNull: true })
  declare actualVisitAt: Date | null;

  @Default(VisitStatus.SCHEDULED)
  @Column({
    type: DataType.ENUM(...Object.values(VisitStatus)),
    allowNull: false,
  })
  declare status: VisitStatus;

  @Column({ type: DataType.STRING(250), allowNull: true })
  declare purpose: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare notes: string | null;

  @Column({ type: DataType.STRING(150), allowNull: false })
  declare loggedBy: string;
}
