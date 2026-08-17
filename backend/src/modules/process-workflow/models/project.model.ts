import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  HasMany,
} from 'sequelize-typescript';
import { ProjectStatus } from '../../../common/enums/process-workflow.enums';
import { ProjectStepProgress } from './project-step-progress.model';
import { GateLog } from './gate-log.model';
import { ContinuityRole } from './continuity-role.model';
import { ProjectDeliverableRecord } from './project-deliverable-record.model';

@Table({ tableName: 'wf_projects', timestamps: true, paranoid: true })
export class Project extends Model<Project> {
  @Column({ type: DataType.STRING(200), allowNull: false })
  name: string;

  @Column({ type: DataType.STRING(150), allowNull: true })
  clientName: string;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  startDate: string;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  targetEndDate: string;

  @Default(ProjectStatus.ACTIVE)
  @Column({
    type: DataType.ENUM(...Object.values(ProjectStatus)),
    allowNull: false,
  })
  status: ProjectStatus;

  @HasMany(() => ProjectStepProgress, { onDelete: 'CASCADE' })
  stepProgress: ProjectStepProgress[];

  @HasMany(() => GateLog, { onDelete: 'CASCADE' })
  gateLogs: GateLog[];

  @HasMany(() => ContinuityRole, { onDelete: 'CASCADE' })
  continuityRoles: ContinuityRole[];

  @HasMany(() => ProjectDeliverableRecord, { onDelete: 'CASCADE' })
  deliverableRecords: ProjectDeliverableRecord[];
}
