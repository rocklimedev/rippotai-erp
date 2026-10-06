import {
  Table,
  Column,
  Model,
  Default,
  PrimaryKey,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Project } from '../../projects/models/projects.model';

import { Step } from './step.model';
import { Team } from './team.model';

/**
 * Records the achievement of a hard gate (Token Received, Concept 02 Finalised,
 * Design Closed, Tender Drawings Finalised, Working Drawings Issued - GFC,
 * Final Client Sign-off, etc.) for a project, with timestamp and approver.
 */
@Table({ tableName: 'gate_logs', timestamps: true })
export class GateLog extends Model<GateLog> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare id: string;

  @ForeignKey(() => Project)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  projectId: string;

  @BelongsTo(() => Project)
  project: Project;

  @ForeignKey(() => Step)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  stepId: string;

  @BelongsTo(() => Step)
  step: Step;

  @Column({ type: DataType.STRING(150), allowNull: false })
  gateName: string; // denormalised copy of Step.gateName at time of logging

  @Column({ type: DataType.DATE, allowNull: false })
  achievedAt: Date;

  @ForeignKey(() => Team)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  approverTeamId: string | null;

  @BelongsTo(() => Team)
  approverTeam: Team;

  @Column({ type: DataType.STRING(150), allowNull: false })
  approverName: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  notes: string | null;
}
