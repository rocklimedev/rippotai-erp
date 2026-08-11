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
  UpdatedAt,
} from 'sequelize-typescript';

import { Project } from '@/modules/projects/models/projects.model';
import { ProcessStep } from './process-step.model';
import { User } from '@/modules/users/models/user.model';

interface ProjectStepProgressAttributes {
  id?: string;
  project_id: string;
  step_id: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'skipped';
  assignee_id?: string | null;
  due_date?: string | null;
  started_at?: Date | null;
  completed_at?: Date | null;
  signed_off_by?: string | null;
  remarks?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

@Table({
  tableName: 'project_step_progress',
  timestamps: true,
})
export class ProjectStepProgress
  extends Model<ProjectStepProgressAttributes>
  implements ProjectStepProgressAttributes
{
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
  @Default('not_started')
  @Column(
    DataType.ENUM(
      'not_started',
      'in_progress',
      'completed',
      'blocked',
      'skipped',
    ),
  )
  declare status:
    | 'not_started'
    | 'in_progress'
    | 'completed'
    | 'blocked'
    | 'skipped';

  @ForeignKey(() => User)
  @AllowNull(true)
  @Column(DataType.CHAR(36))
  declare assignee_id: string | null;

  @AllowNull(true)
  @Column(DataType.DATEONLY)
  declare due_date: string | null;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare started_at: Date | null;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare completed_at: Date | null;

  @ForeignKey(() => User)
  @AllowNull(true)
  @Column(DataType.CHAR(36))
  declare signed_off_by: string | null;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare remarks: string | null;

  @CreatedAt
  @Column({ field: 'created_at' })
  declare created_at: Date;

  @UpdatedAt
  @Column({ field: 'updated_at' })
  declare updated_at: Date;

  @BelongsTo(() => Project, {
    onDelete: 'CASCADE',
  })
  declare project: Project;

  @BelongsTo(() => ProcessStep, {
    onDelete: 'CASCADE',
  })
  declare step: ProcessStep;

  @BelongsTo(() => User, {
    foreignKey: 'assignee_id',
    onDelete: 'SET NULL',
  })
  declare assignee: User;

  @BelongsTo(() => User, {
    foreignKey: 'signed_off_by',
    onDelete: 'SET NULL',
  })
  declare signedOffBy: User;
}
