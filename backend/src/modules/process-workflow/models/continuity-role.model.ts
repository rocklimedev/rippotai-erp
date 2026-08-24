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
  @ForeignKey(() => Project)
  @Column({ type: DataType.INTEGER, allowNull: false })
  projectId: number;

  @BelongsTo(() => Project)
  project: Project;

  @ForeignKey(() => Team)
  @Column({ type: DataType.INTEGER, allowNull: false })
  teamId: number;

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
  @Column({ type: DataType.INTEGER, allowNull: true })
  opensAtStepId: number | null;

  @BelongsTo(() => Step, 'opensAtStepId')
  opensAtStep: Step;

  /** For GATE_BOUND roles: the step/gate that releases this team from the project. */
  @ForeignKey(() => Step)
  @Column({ type: DataType.INTEGER, allowNull: true })
  closesAtStepId: number | null;

  @BelongsTo(() => Step, 'closesAtStepId')
  closesAtStep: Step;

  @Column({ type: DataType.DATE, allowNull: true })
  actualOpenedAt: Date | null;

  @Column({ type: DataType.DATE, allowNull: true })
  actualClosedAt: Date | null;
}
