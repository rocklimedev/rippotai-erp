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
import { ProcessPhase } from './process-phase.model';

interface ProjectPhaseProgressAttributes {
  id?: string;
  project_id: string;
  phase_id: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  started_at?: Date | null;
  completed_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

@Table({
  tableName: 'project_phase_progress',
  timestamps: true,
})
export class ProjectPhaseProgress
  extends Model<ProjectPhaseProgressAttributes>
  implements ProjectPhaseProgressAttributes
{
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.CHAR(36))
  declare id: string;

  @ForeignKey(() => Project)
  @AllowNull(false)
  @Column(DataType.CHAR(36))
  declare project_id: string;

  @ForeignKey(() => ProcessPhase)
  @AllowNull(false)
  @Column(DataType.CHAR(36))
  declare phase_id: string;

  @AllowNull(false)
  @Default('not_started')
  @Column(DataType.ENUM('not_started', 'in_progress', 'completed', 'skipped'))
  declare status: 'not_started' | 'in_progress' | 'completed' | 'skipped';

  @AllowNull(true)
  @Column(DataType.DATE)
  declare started_at: Date | null;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare completed_at: Date | null;

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

  @BelongsTo(() => ProcessPhase, {
    onDelete: 'CASCADE',
  })
  declare phase: ProcessPhase;
}
