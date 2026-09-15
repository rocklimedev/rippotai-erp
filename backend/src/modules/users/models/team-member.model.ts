import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Index,
  Model,
  Table,
} from 'sequelize-typescript';

import { User } from '../../users/models/user.model';
import { Team } from './team.model';
import { TeamMemberOwnerType } from '@/common/enums/team.enums';

export interface TeamMemberAttributes {
  id: string;

  team_id: string;
  user_id: string;

  owner_type: TeamMemberOwnerType | null;
  owner_id: string | null;

  role_label: string | null;

  is_primary: boolean;
  sort_order: number;

  created_by: string | null;
  updated_by: string | null;

  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export type TeamMemberCreationAttributes = Partial<
  Pick<
    TeamMemberAttributes,
    | 'id'
    | 'owner_type'
    | 'owner_id'
    | 'role_label'
    | 'is_primary'
    | 'sort_order'
    | 'created_by'
    | 'updated_by'
  >
> &
  Pick<TeamMemberAttributes, 'team_id' | 'user_id'>;

@Table({
  tableName: 'team_members',
  timestamps: true,
  paranoid: true,
  underscored: true,
})
export class TeamMember
  extends Model<TeamMemberAttributes, TeamMemberCreationAttributes>
  implements TeamMemberAttributes
{
  @Column({
    type: DataType.CHAR(36),
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ForeignKey(() => Team)
  @Index('idx_team_members_team_id')
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare team_id: string;

  @BelongsTo(() => Team, {
    foreignKey: 'team_id',
    as: 'team',
  })
  declare team: Team;

  @ForeignKey(() => User)
  @Index('idx_team_members_user_id')
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare user_id: string;

  @BelongsTo(() => User, {
    foreignKey: 'user_id',
    as: 'user',
  })
  declare user: User;

  @Index('idx_team_members_owner')
  @Column({
    type: DataType.ENUM(...Object.values(TeamMemberOwnerType)),
    allowNull: true,
  })
  declare owner_type: TeamMemberOwnerType | null;

  @Index('idx_team_members_owner')
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare owner_id: string | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare role_label: string | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare is_primary: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare sort_order: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare created_by: string | null;

  @BelongsTo(() => User, {
    foreignKey: 'created_by',
    as: 'creator',
  })
  declare creator: User;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare updated_by: string | null;

  @BelongsTo(() => User, {
    foreignKey: 'updated_by',
    as: 'updater',
  })
  declare updater: User;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | null;
}
