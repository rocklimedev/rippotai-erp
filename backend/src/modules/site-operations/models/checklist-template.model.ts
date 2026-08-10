import { Table, Column, Model, DataType, ForeignKey, BelongsTo, Default, HasMany } from 'sequelize-typescript';
import { Team } from '../../process-workflow/models/team.model';
import { Step } from '../../process-workflow/models/step.model';
import { ChecklistTemplateItem } from './checklist-template-item.model';
import { QcSignOff } from './qc-sign-off.model';

/**
 * A reusable, trade-specific QC checklist that a phase/step must pass before
 * handoff to the next trade. One template can be reused across projects; a
 * project's actual pass/fail/rework record lives in QcSignOff.
 */
@Table({ tableName: 'so_checklist_templates', timestamps: true, paranoid: true })
export class ChecklistTemplate extends Model<ChecklistTemplate> {
  @Column({ type: DataType.STRING(150), allowNull: false })
  name: string; // e.g. "Electrical First Fix QC", "Flooring Handover QC"

  /** The trade this checklist applies to (e.g. Electrical, Flooring). */
  @ForeignKey(() => Team)
  @Column({ type: DataType.INTEGER, allowNull: false })
  tradeTeamId: number;

  @BelongsTo(() => Team)
  tradeTeam: Team;

  /** The step/phase in the master process this checklist gates handoff for. */
  @ForeignKey(() => Step)
  @Column({ type: DataType.INTEGER, allowNull: true })
  stepId: number | null;

  @BelongsTo(() => Step)
  step: Step;

  @Column({ type: DataType.TEXT, allowNull: true })
  description: string;

  @Default(true)
  @Column({ type: DataType.BOOLEAN })
  isActive: boolean;

  @HasMany(() => ChecklistTemplateItem, { onDelete: 'CASCADE' })
  items: ChecklistTemplateItem[];

  @HasMany(() => QcSignOff)
  signOffs: QcSignOff[];
}
