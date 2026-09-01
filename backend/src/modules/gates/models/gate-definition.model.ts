import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { GatePhaseDefinition } from './gate-phase-definition.model';
import { GateCondition } from './gate-condition.model';

/**
 * The 12 sign-off gates from "GATES IN ORDER" / "A · GATES — IN ORDER" in the
 * Master Process Brain. sequence_order is a hard 1..12 total order — gates
 * clear strictly in sequence; there is no branching between them, even though
 * the two parallel tracks (vendor/trades, material/procurement) run outside
 * this chain until they each rejoin it at a gate.
 */
@Table({ tableName: 'gate_definitions', timestamps: true, underscored: true })
export class GateDefinition extends Model {
  @Column({ type: DataType.CHAR(36), primaryKey: true })
  declare id: string;

  /** LAYOUT_FINALISED, CLIENT_SIGNOFF_PITCH_CONCEPT01, TOKEN_RECEIVED,
   *  PROJECT_MOBILISED, CONCEPT02_FINALISED, DESIGN_CLOSED, PAYMENT_PHASE_01,
   *  TENDER_DRAWINGS_FINALISED, ESTIMATE_APPROVED, CONTRACTOR_LINEUP_HANDOFF,
   *  WORKING_DRAWINGS_GFC, FINAL_CLIENT_SIGNOFF */
  @Column({ type: DataType.STRING(60), unique: true })
  declare code: string;

  @Column(DataType.STRING(150))
  declare name: string;

  @Column({ type: DataType.INTEGER, unique: true, field: 'sequence_order' })
  declare sequenceOrder: number;

  /** Verbatim "trigger" text from the source gate table. */
  @Column({ type: DataType.STRING(255), field: 'trigger_condition' })
  declare triggerCondition: string;

  /** Verbatim "between" text, e.g. 'Architect → Admin Coordinator (vendor search opens)'. */
  @Column({ type: DataType.STRING(255), field: 'handoff_between' })
  declare handoffBetween: string;

  /** Progress-percentage checkpoint this gate sits at on the master chart (0-100). */
  @Column({ type: DataType.DECIMAL(5, 2), field: 'progress_threshold_pct' })
  declare progressThresholdPct: number;

  @ForeignKey(() => GatePhaseDefinition)
  @Column({ type: DataType.CHAR(36), field: 'opens_phase_id' })
  declare opensPhaseId: string | null;

  @BelongsTo(() => GatePhaseDefinition)
  declare opensPhase: GatePhaseDefinition;

  /** true only for terminal/manual gates that a privileged role may clear
   *  ahead of an unmet automated condition (e.g. FINAL_CLIENT_SIGNOFF). */
  @Column({ type: DataType.BOOLEAN, field: 'allows_override' })
  declare allowsOverride: boolean;

  @Column({ type: DataType.BOOLEAN, field: 'is_active' })
  declare isActive: boolean;

  @HasMany(() => GateCondition)
  declare conditions: GateCondition[];
}
