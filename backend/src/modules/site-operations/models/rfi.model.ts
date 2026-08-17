import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
} from 'sequelize-typescript';
import { Project } from '../../process-workflow/models/project.model';
import { Step } from '../../process-workflow/models/step.model';
import { Team } from '../../process-workflow/models/team.model';
import {
  RfiStatus,
  RfiPriority,
} from '../../../common/enums/site-operations.enums';

/**
 * A Request For Information: a site query raised (usually by the Supervisor
 * or a trade), routed to the Architect (or another team), and closed out with
 * a recorded response.
 */
@Table({ tableName: 'so_rfis', timestamps: true })
export class Rfi extends Model<Rfi> {
  @ForeignKey(() => Project)
  @Column({ type: DataType.INTEGER, allowNull: false })
  projectId: number;

  @BelongsTo(() => Project)
  project: Project;

  @ForeignKey(() => Step)
  @Column({ type: DataType.INTEGER, allowNull: true })
  stepId: number | null;

  @BelongsTo(() => Step)
  step: Step;

  /** Auto-incrementing per-project RFI number for easy reference, e.g. "RFI-014". */
  @Column({ type: DataType.INTEGER, allowNull: false })
  rfiNumber: number;

  @Column({ type: DataType.STRING(200), allowNull: false })
  subject: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  query: string;

  @Column({ type: DataType.STRING(150), allowNull: false })
  raisedBy: string;

  @Column({ type: DataType.DATE, allowNull: false })
  raisedAt: Date;

  @Default(RfiPriority.NORMAL)
  @Column({
    type: DataType.ENUM(...Object.values(RfiPriority)),
    allowNull: false,
  })
  priority: RfiPriority;

  /** Team the RFI is routed to — typically Architect. */
  @ForeignKey(() => Team)
  @Column({ type: DataType.INTEGER, allowNull: false })
  routedToTeamId: number;

  @BelongsTo(() => Team)
  routedToTeam: Team;

  @Default(RfiStatus.OPEN)
  @Column({
    type: DataType.ENUM(...Object.values(RfiStatus)),
    allowNull: false,
  })
  status: RfiStatus;

  @Column({ type: DataType.TEXT, allowNull: true })
  response: string | null;

  @Column({ type: DataType.STRING(150), allowNull: true })
  respondedBy: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  respondedAt: Date | null;

  @Column({ type: DataType.DATE, allowNull: true })
  closedAt: Date | null;

  @Column({ type: DataType.JSON, allowNull: true })
  attachmentUrls: string[] | null;
}
