import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  IsUUID,
} from 'sequelize-typescript';

import { Optional } from 'sequelize';

import { User } from '@/modules/users/models/user.model';
import { TeamMemberOwnerType } from '@/common/enums/team.enums';

export interface TeamMemberAttributes {
  id: string;

  owner_type: TeamMemberOwnerType;
  owner_id: string;

  user_id: string;

  role_label: string;

  is_primary: boolean;
  sort_order: number;

  created_by: string | null;
  updated_by: string | null;

  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}

export interface TeamMemberCreationAttributes extends Optional<
  TeamMemberAttributes,
  | 'id'
  | 'is_primary'
  | 'sort_order'
  | 'created_by'
  | 'updated_by'
  | 'created_at'
  | 'updated_at'
  | 'deleted_at'
> {}

@Table({
  tableName: 'team_members',

  timestamps: true,

  paranoid: true,

  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',

  indexes: [
    {
      fields: ['owner_type', 'owner_id'],
    },
    {
      fields: ['owner_type', 'owner_id', 'user_id', 'role_label'],
      unique: true,
    },
  ],
})
export class TeamMember extends Model<
  TeamMemberAttributes,
  TeamMemberCreationAttributes
> {
  // ============================================
  // ID
  // ============================================

  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.CHAR(36),
  })
  declare id: string;

  // ============================================
  // OWNER
  // ============================================

  @Column({
    type: DataType.ENUM(...Object.values(TeamMemberOwnerType)),
    allowNull: false,
  })
  declare owner_type: TeamMemberOwnerType;

  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare owner_id: string;

  // ============================================
  // USER
  // ============================================

  @ForeignKey(() => User)
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

  // ============================================
  // PROJECT / DOCUMENT ROLE LABEL
  // ============================================

  @Column({
    type: DataType.STRING(150),
    allowNull: false,
  })
  declare role_label: string;

  // ============================================
  // PRIMARY
  // ============================================

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare is_primary: boolean;

  // ============================================
  // SORT
  // ============================================

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare sort_order: number;

  // ============================================
  // AUDIT
  // ============================================

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare created_by: string | null;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare updated_by: string | null;

  @BelongsTo(() => User, {
    foreignKey: 'created_by',
    as: 'creator',
  })
  declare creator: User;

  @BelongsTo(() => User, {
    foreignKey: 'updated_by',
    as: 'updater',
  })
  declare updater: User;

  // ============================================
  // SOFT DELETE
  // ============================================

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare deleted_at: Date | null;
}
