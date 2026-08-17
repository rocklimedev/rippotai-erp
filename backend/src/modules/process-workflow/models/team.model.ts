import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  HasMany,
} from 'sequelize-typescript';
import {
  TeamType,
  TradeCategory,
} from '../../../common/enums/process-workflow.enums';
import { StepTeam } from './step-team.model';
import { ContinuityRole } from './continuity-role.model';

/**
 * A team/role that can own or support process steps: Architect, Supervisor, Admin,
 * Accounts, Planning, Procurement, Client, and each of the 12 contractor trades
 * (type = TRADE, tradeCategory set).
 */
@Table({ tableName: 'wf_teams', timestamps: true })
export class Team extends Model<Team> {
  @Column({ type: DataType.STRING(100), allowNull: false })
  name: string;

  @Column({ type: DataType.ENUM(...Object.values(TeamType)), allowNull: false })
  type: TeamType;

  @Default(false)
  @Column({ type: DataType.BOOLEAN })
  isTrade: boolean;

  @Column({
    type: DataType.ENUM(...Object.values(TradeCategory)),
    allowNull: true,
  })
  tradeCategory: TradeCategory | null;

  @Column({ type: DataType.STRING(150), allowNull: true })
  contactEmail: string;

  @Default(true)
  @Column({ type: DataType.BOOLEAN })
  isActive: boolean;

  @HasMany(() => StepTeam)
  stepAssignments: StepTeam[];

  @HasMany(() => ContinuityRole)
  continuityRoles: ContinuityRole[];
}
