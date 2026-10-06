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
import { Team } from './team.model';
import { Step } from './step.model';
import { ContinuityType } from '../../../common/enums/process-workflow.enums';

/**
 * Tracks whether a team's involvement on a project is continuous (runs
 * end-to-end — Architect, Site Supervisor, Client) or gate-bound (opens and
 * closes at specific steps/gates — most trade contractors).
 */
@Table({ tableName: 'continuity_roles', timestamps: true })
export class ContinuityRole extends Model<ContinuityRole> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare id: string;

  @ForeignKey(() => Project)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  projectId: string;

  @BelongsTo(() => Project)
  project: Project;

  @ForeignKey(() => Team)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  teamId: string;

  @BelongsTo(() => Team)
  team: Team;

  @Default(ContinuityType.CONTINUOUS)
  @Column({
    type: DataType.ENUM(...Object.values(ContinuityType)),
    allowNull: false,
  })
  continuityType: ContinuityType;

  /** For GATE_BOUND roles: the step/gate that brings this team onto the project. */
  @ForeignKey(() => Step)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  opensAtStepId: string | null;

  @BelongsTo(() => Step, 'opensAtStepId')
  opensAtStep: Step;

  /** For GATE_BOUND roles: the step/gate that releases this team from the project. */
  @ForeignKey(() => Step)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  closesAtStepId: string | null;

  @BelongsTo(() => Step, 'closesAtStepId')
  closesAtStep: Step;

  @Column({ type: DataType.DATE, allowNull: true })
  actualOpenedAt: Date | null;

  @Column({ type: DataType.DATE, allowNull: true })
  actualClosedAt: Date | null;
}
