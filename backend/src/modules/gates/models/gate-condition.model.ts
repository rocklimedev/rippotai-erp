import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { GateDefinition } from './gate-definition.model';

@Table({ tableName: 'gate_conditions', timestamps: true, underscored: true })
export class GateCondition extends Model {
  @Column({ type: DataType.CHAR(36), primaryKey: true })
  declare id: string;

  @ForeignKey(() => GateDefinition)
  @Column({ type: DataType.CHAR(36), field: 'gate_definition_id' })
  declare gateDefinitionId: string;

  @BelongsTo(() => GateDefinition)
  declare gate: GateDefinition;

  /** One of GateConditionType. */
  @Column(DataType.STRING(60))
  declare type: string;

  @Column(DataType.STRING(255))
  declare label: string;

  /** Evaluator-specific parameters, e.g. { "documentTypeCode": "PROPOSED_LAYOUT" }
   *  or { "milestoneCode": "TOKEN", "minAmount": 0 }
   *  or { "roleLabelPrefix": "CONTRACTOR:", "minCount": 12 }. */
  @Column(DataType.JSON)
  declare params: Record<string, any>;

  /** When true, this condition belongs to the gate's "optional" bucket — at
   *  least one optional condition (if any exist) must pass, in addition to
   *  every required (optional=false) condition passing. Used sparingly, e.g.
   *  "Path A — rates only" OR "Path B — vendor quote" before an estimate. */
  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare optional: boolean;

  @Column({ type: DataType.INTEGER, field: 'sort_order' })
  declare sortOrder: number;
}
