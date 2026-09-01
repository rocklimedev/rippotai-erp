import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Project } from '@/modules/projects/models/projects.model';
import { GateDefinition } from './gate-definition.model';
import { User } from '@/modules/users/models/user.model';
import { GateStatus } from '@/common/enums/gates.enum';

@Table({
  tableName: 'project_gates',
  timestamps: true,
  underscored: true,
  indexes: [{ unique: true, fields: ['project_id', 'gate_definition_id'] }],
})
export class ProjectGate extends Model {
  @Column({ type: DataType.CHAR(36), primaryKey: true })
  declare id: string;

  @ForeignKey(() => Project)
  @Column({ type: DataType.CHAR(36), field: 'project_id' })
  declare projectId: string;

  @BelongsTo(() => Project)
  declare project: Project;

  @ForeignKey(() => GateDefinition)
  @Column({ type: DataType.CHAR(36), field: 'gate_definition_id' })
  declare gateDefinitionId: string;

  @BelongsTo(() => GateDefinition)
  declare gateDefinition: GateDefinition;

  @Column({
    type: DataType.ENUM(...Object.values(GateStatus)),
    defaultValue: GateStatus.LOCKED,
  })
  declare status: GateStatus;

  @Column({ type: DataType.DATE, field: 'cleared_at' })
  declare clearedAt: Date | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), field: 'cleared_by' })
  declare clearedBy: string | null;

  @Column(DataType.TEXT)
  declare remarks: string | null;

  /** true if the gate was cleared with unmet required conditions by a
   *  permission-holder — always paired with a GateTransitionLog(OVERRIDDEN) row. */
  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare overridden: boolean;

  /** Snapshot of the GateReadiness at the moment of the last check/clear,
   *  kept for fast reads without re-evaluating every condition. */
  @Column({ type: DataType.JSON, field: 'last_readiness_snapshot' })
  declare lastReadinessSnapshot: Record<string, any> | null;
}
