import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
} from 'sequelize-typescript';
import { Step } from './step.model';
import { Team } from './team.model';
import { ResponsibilityType } from '../../../common/enums/process-workflow.enums';

/**
 * Tags a step with the owning/supporting/approving team(s). A step can have
 * multiple rows here (e.g. Architect = OWNER, Client = APPROVER).
 */
@Table({
  tableName: 'wf_step_teams',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['stepId', 'teamId', 'responsibilityType'] },
  ],
})
export class StepTeam extends Model<StepTeam> {
  @ForeignKey(() => Step)
  @Column({ type: DataType.INTEGER, allowNull: false })
  stepId: number;

  @BelongsTo(() => Step)
  step: Step;

  @ForeignKey(() => Team)
  @Column({ type: DataType.INTEGER, allowNull: false })
  teamId: number;

  @BelongsTo(() => Team)
  team: Team;

  @Default(ResponsibilityType.OWNER)
  @Column({
    type: DataType.ENUM(...Object.values(ResponsibilityType)),
    allowNull: false,
  })
  responsibilityType: ResponsibilityType;
}
