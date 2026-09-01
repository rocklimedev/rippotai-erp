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

@Table({
  tableName: 'gate_transition_logs',
  timestamps: false,
  underscored: true,
})
export class GateTransitionLog extends Model {
  @Column({ type: DataType.CHAR(36), primaryKey: true })
  declare id: string;

  @ForeignKey(() => Project)
  @Column({ type: DataType.CHAR(36), field: 'project_id' })
  declare projectId: string;

  @ForeignKey(() => GateDefinition)
  @Column({ type: DataType.CHAR(36), field: 'gate_definition_id' })
  declare gateDefinitionId: string;

  @BelongsTo(() => GateDefinition)
  declare gateDefinition: GateDefinition;

  /** One of GateTransitionAction. */
  @Column(DataType.STRING(60))
  declare action: string;

  @Column({ type: DataType.STRING(30), field: 'from_status' })
  declare fromStatus: string | null;

  @Column({ type: DataType.STRING(30), field: 'to_status' })
  declare toStatus: string | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), field: 'performed_by' })
  declare performedBy: string | null;

  @Column(DataType.TEXT)
  declare remarks: string | null;

  /** Full GateReadiness JSON at the time of this transition — the durable
   *  "why" behind every clear/block/reopen decision. */
  @Column(DataType.JSON)
  declare snapshot: Record<string, any> | null;

  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date;
}
