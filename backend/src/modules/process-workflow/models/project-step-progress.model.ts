import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
} from 'sequelize-typescript';
import { Project } from './project.model';
import { Step } from './step.model';
import { Team } from './team.model';
import { StepStatus } from '../../../common/enums/process-workflow.enums';

/**
 * Live status of a single step for a single project: not started / in progress /
 * completed / blocked, plus assignee and sign-off — and planned/actual dates
 * that drive the Gantt timeline view.
 */
@Table({
  tableName: 'wf_project_step_progress',
  timestamps: true,
  indexes: [{ unique: true, fields: ['projectId', 'stepId'] }],
})
export class ProjectStepProgress extends Model<ProjectStepProgress> {
  @ForeignKey(() => Project)
  @Column({ type: DataType.INTEGER, allowNull: false })
  projectId: number;

  @BelongsTo(() => Project)
  project: Project;

  @ForeignKey(() => Step)
  @Column({ type: DataType.INTEGER, allowNull: false })
  stepId: number;

  @BelongsTo(() => Step)
  step: Step;

  @Default(StepStatus.NOT_STARTED)
  @Column({
    type: DataType.ENUM(...Object.values(StepStatus)),
    allowNull: false,
  })
  status: StepStatus;

  @ForeignKey(() => Team)
  @Column({ type: DataType.INTEGER, allowNull: true })
  assigneeTeamId: number | null;

  @BelongsTo(() => Team)
  assigneeTeam: Team;

  @Column({ type: DataType.STRING(150), allowNull: true })
  assigneeName: string | null; // free-text name of the individual, if tracked at that level

  @Column({ type: DataType.DATEONLY, allowNull: true })
  plannedStartDate: string | null;

  @Column({ type: DataType.DATEONLY, allowNull: true })
  plannedEndDate: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  actualStartDate: Date | null;

  @Column({ type: DataType.DATE, allowNull: true })
  actualCompletionDate: Date | null;

  @Column({ type: DataType.STRING(150), allowNull: true })
  signedOffBy: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  signedOffAt: Date | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  blockedReason: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  notes: string | null;
}
