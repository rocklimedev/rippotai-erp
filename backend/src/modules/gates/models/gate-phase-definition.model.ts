import { Column, DataType, Model, Table } from 'sequelize-typescript';

/**
 * Master, project-independent list of the phases/tracks laid out in the
 * RIPPOTAI Master Process Brain: 9 sequential phases (BRIEF ... SNAG_HANDOVER)
 * plus 2 parallel tracks (VENDOR_TRADES, MATERIAL_PROCUREMENT) that run
 * alongside the spine once their opening gate clears.
 */
@Table({
  tableName: 'gate_phase_definitions',
  timestamps: true,
  underscored: true,
})
export class GatePhaseDefinition extends Model {
  @Column({ type: DataType.CHAR(36), primaryKey: true })
  declare id: string;

  /** BRIEF, SITE_SURVEY, PRE_DESIGN, PAYMENT, DESIGN, VENDOR_TRADES,
   *  MATERIAL_PROCUREMENT, TENDER_DRAWINGS, WORKING_DRAWINGS, EXECUTION,
   *  SNAG_HANDOVER */
  @Column({ type: DataType.STRING(40), unique: true })
  declare code: string;

  @Column(DataType.STRING(120))
  declare title: string;

  /** Position on the spine. Parallel tracks share the sort_order band of the
   *  spine phase they run alongside, and are distinguished by isParallel. */
  @Column({ type: DataType.INTEGER, field: 'sort_order' })
  declare sortOrder: number;

  @Column({ type: DataType.BOOLEAN, field: 'is_parallel' })
  declare isParallel: boolean;

  /** The lead core team code (ARC, ADM, PRC, SUP, ACC, PLN, CLI) from the brain. */
  @Column({ type: DataType.STRING(10), field: 'lead_team_code' })
  declare leadTeamCode: string;

  @Column(DataType.TEXT)
  declare note: string;

  /** Verbatim "span" annotation from the source chart, e.g.
   *  'PARALLEL · SEARCH FROM ◆ LAYOUT FINALISED · NOTHING FINALISED BEFORE TENDER DRAWINGS' */
  @Column(DataType.STRING(255))
  declare span: string;
}
