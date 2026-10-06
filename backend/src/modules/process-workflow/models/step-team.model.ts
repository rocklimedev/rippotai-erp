import {
  Table,
  Column,
  Model,
  PrimaryKey,
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
  tableName: 'step_teams',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['stepId', 'teamId', 'responsibilityType'] },
  ],
})
export class StepTeam extends Model<StepTeam> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare id: string;

  @ForeignKey(() => Step)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  stepId: string;

  @BelongsTo(() => Step)
  step: Step;

  @ForeignKey(() => Team)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  teamId: string;

  @BelongsTo(() => Team)
  team: Team;

  @Default(ResponsibilityType.OWNER)
  @Column({
    type: DataType.ENUM(...Object.values(ResponsibilityType)),
    allowNull: false,
  })
  responsibilityType: ResponsibilityType;
}
