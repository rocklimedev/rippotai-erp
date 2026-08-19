import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  Default,
  Index,
} from 'sequelize-typescript';
import { Phase } from './phase.model';
import { Deliverable } from './deliverable.model';
import { StepTeam } from './step-team.model';
import { ProjectStepProgress } from './project-step-progress.model';
import { GateLog } from './gate-log.model';

/**
 * A single step within a phase. Steps that represent hard gates (Token Received,
 * Concept 02 Finalised, Design Closed, Tender Drawings Finalised,
 * Working Drawings Issued - GFC, Final Client Sign-off, etc.) have isGate = true
 * and a gateName used for gate logging.
 */
@Table({ tableName: 'steps', timestamps: true, paranoid: true })
export class Step extends Model<Step> {
  @ForeignKey(() => Phase)
  @Column({ type: DataType.INTEGER, allowNull: false })
  phaseId: number;

  @BelongsTo(() => Phase)
  phase: Phase;

  @Column({ type: DataType.STRING(150), allowNull: false })
  name: string;

  @Index
  @Column({ type: DataType.STRING(60), allowNull: false, unique: true })
  code: string; // e.g. 'TOKEN_RECEIVED', 'CONCEPT_02_FINALISED'

  @Column({ type: DataType.INTEGER, allowNull: false })
  order: number; // sequence within the phase

  @Column({ type: DataType.TEXT, allowNull: true })
  description: string;

  @Default(false)
  @Column({ type: DataType.BOOLEAN })
  isGate: boolean;

  @Column({ type: DataType.STRING(150), allowNull: true })
  gateName: string | null; // human-readable gate label, e.g. "Design Closed"

  /** Typical planned duration in days, used to seed the Gantt timeline. */
  @Default(1)
  @Column({ type: DataType.INTEGER })
  defaultDurationDays: number;

  /** Optional: steps that must complete before this one can start (for timeline sequencing). */
  @Column({ type: DataType.JSON, allowNull: true })
  dependsOnStepCodes: string[] | null;

  @Default(true)
  @Column({ type: DataType.BOOLEAN })
  isActive: boolean;

  @HasMany(() => Deliverable, { onDelete: 'CASCADE' })
  deliverables: Deliverable[];

  @HasMany(() => StepTeam, { onDelete: 'CASCADE' })
  teamAssignments: StepTeam[];

  @HasMany(() => ProjectStepProgress)
  progressEntries: ProjectStepProgress[];

  @HasMany(() => GateLog)
  gateLogs: GateLog[];
}
