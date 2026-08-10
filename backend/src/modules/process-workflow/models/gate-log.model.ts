import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Project } from './project.model';
import { Step } from './step.model';
import { Team } from './team.model';

/**
 * Records the achievement of a hard gate (Token Received, Concept 02 Finalised,
 * Design Closed, Tender Drawings Finalised, Working Drawings Issued - GFC,
 * Final Client Sign-off, etc.) for a project, with timestamp and approver.
 */
@Table({ tableName: 'wf_gate_logs', timestamps: true })
export class GateLog extends Model<GateLog> {
  @ForeignKey(() => Project)
  @Column({ type: DataType.INTEGER, allowNull: false })
  projectId: number;

  @BelongsTo(() => Project)
  project: Project;

  @ForeignKey(() => Step)
  @Column({ type: DataType.INTEGER, allowNull: false })
  stepId: number;

  @BelongsTo(() => Step)
  step: Step;

  @Column({ type: DataType.STRING(150), allowNull: false })
  gateName: string; // denormalised copy of Step.gateName at time of logging

  @Column({ type: DataType.DATE, allowNull: false })
  achievedAt: Date;

  @ForeignKey(() => Team)
  @Column({ type: DataType.INTEGER, allowNull: true })
  approverTeamId: number | null;

  @BelongsTo(() => Team)
  approverTeam: Team;

  @Column({ type: DataType.STRING(150), allowNull: false })
  approverName: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  notes: string | null;
}
