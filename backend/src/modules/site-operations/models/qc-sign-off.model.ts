import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
  HasMany,
} from 'sequelize-typescript';
import { Project } from '@/modules/projects/models/projects.model';
import { Step } from '../../process-workflow/models/step.model';
import { Team } from '../../process-workflow/models/team.model';
import { ChecklistTemplate } from './checklist-template.model';
import { QcSignOffItemResult } from './qc-sign-off-item-result.model';
import { QcResult } from '../../../common/enums/site-operations.enums';

/**
 * The record of a QC check for a given project + phase/step + trade: overall
 * result (pass/fail/rework), the checking user, and the timestamp. A trade's
 * work cannot hand off to the next trade until this is PASS.
 */
@Table({ tableName: 'qc_sign_offs', timestamps: true })
export class QcSignOff extends Model<QcSignOff> {
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

  @ForeignKey(() => Team)
  @Column({ type: DataType.INTEGER, allowNull: false })
  tradeTeamId: number;

  @BelongsTo(() => Team)
  tradeTeam: Team;

  @ForeignKey(() => ChecklistTemplate)
  @Column({ type: DataType.INTEGER, allowNull: false })
  checklistTemplateId: number;

  @BelongsTo(() => ChecklistTemplate)
  checklistTemplate: ChecklistTemplate;

  @Column({ type: DataType.ENUM(...Object.values(QcResult)), allowNull: false })
  result: QcResult;

  /** Attempt number for this project/step/trade — increments on each rework re-check. */
  @Default(1)
  @Column({ type: DataType.INTEGER })
  attemptNumber: number;

  @Column({ type: DataType.STRING(150), allowNull: false })
  checkedBy: string;

  @Column({ type: DataType.DATE, allowNull: false })
  checkedAt: Date;

  @Column({ type: DataType.TEXT, allowNull: true })
  notes: string | null;

  @HasMany(() => QcSignOffItemResult, { onDelete: 'CASCADE' })
  itemResults: QcSignOffItemResult[];
}
