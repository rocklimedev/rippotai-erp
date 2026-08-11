import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  ForeignKey,
  BelongsTo,
  CreatedAt,
} from 'sequelize-typescript';

import { Project } from '@/modules/projects/models/projects.model';
import { ProcessStep } from './process-step.model';
import { User } from '@/modules/users/models/user.model';

@Table({
  tableName: 'project_gate_log',
  timestamps: true,
  updatedAt: false,
})
export class ProjectGateLog extends Model<ProjectGateLog> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.CHAR(36))
  declare id: string;

  @ForeignKey(() => Project)
  @AllowNull(false)
  @Column(DataType.CHAR(36))
  declare project_id: string;

  @ForeignKey(() => ProcessStep)
  @AllowNull(false)
  @Column(DataType.CHAR(36))
  declare step_id: string;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  declare gate_label: string;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare crossed_at: Date | null;

  @ForeignKey(() => User)
  @AllowNull(true)
  @Column(DataType.CHAR(36))
  declare crossed_by: string | null;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare remarks: string | null;

  @CreatedAt
  @Column({ field: 'created_at' })
  declare created_at: Date;

  @BelongsTo(() => Project, {
    onDelete: 'CASCADE',
  })
  declare project: Project;

  @BelongsTo(() => ProcessStep, {
    onDelete: 'CASCADE',
  })
  declare step: ProcessStep;

  @BelongsTo(() => User, {
    foreignKey: 'crossed_by',
    onDelete: 'SET NULL',
  })
  declare crossedBy: User;
}
