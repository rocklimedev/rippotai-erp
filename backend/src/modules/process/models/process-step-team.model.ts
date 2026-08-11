import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  PrimaryKey,
} from 'sequelize-typescript';

import { ProcessStep } from './process-step.model';
import { TradeTeam } from './trade-team.model';

export interface ProcessStepTeamAttributes {
  step_id: string;
  team_id: string;
}

@Table({
  tableName: 'process_step_teams',
  timestamps: false,
})
export class ProcessStepTeam
  extends Model<ProcessStepTeamAttributes>
  implements ProcessStepTeamAttributes
{
  @PrimaryKey
  @ForeignKey(() => ProcessStep)
  @Column(DataType.CHAR(36))
  declare step_id: string;

  @PrimaryKey
  @ForeignKey(() => TradeTeam)
  @Column(DataType.CHAR(36))
  declare team_id: string;
}
