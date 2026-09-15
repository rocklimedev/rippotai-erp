import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import { Team } from './team.model';
import { TeamSection } from './team-sections.model';
import { User } from '@/modules/users/models/user.model';
import { TeamAccessLevel } from '@/common/enums/team.enums';

@Table({
  tableName: 'team_section_access',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',

  indexes: [
    {
      fields: ['team_id', 'section_id'],
      unique: true,
    },
  ],
})
export class TeamSectionAccess extends Model<TeamSectionAccess> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.CHAR(36),
  })
  declare id: string;

  // ============================================
  // TEAM
  // ============================================

  @ForeignKey(() => Team)
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

  // ============================================
  // SECTION
  // ============================================

  @ForeignKey(() => TeamSection)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare section_id: string;

  @BelongsTo(() => TeamSection, {
    foreignKey: 'section_id',
    as: 'section',
  })
  declare section: TeamSection;

  // ============================================
  // ACCESS
  // ============================================

  @Column({
    type: DataType.ENUM(...Object.values(TeamAccessLevel)),
    allowNull: false,
    defaultValue: TeamAccessLevel.NONE,
  })
  declare access_level: TeamAccessLevel;

  // ============================================
  // LIMITED ACCESS CONTROLS
  // ============================================

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare can_view: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare can_create: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare can_edit: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare can_delete: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare can_approve: boolean;

  // ============================================
  // SCOPE
  // ============================================

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  declare scope: Record<string, any> | null;

  // ============================================
  // AUDIT
  // ============================================

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
}
