import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  DefaultScope,
  Scopes,
} from 'sequelize-typescript';

import { Optional } from 'sequelize';
import { Role } from '@/modules/rbac/models/role.model';

export interface UserAttributes {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  phone: string | null;
  job_title: string | null;
  avatar_url: string | null;
  role_id: string | null;
  is_active: boolean;
  last_login_at: Date | null;
  created_by: string | null;
}

export interface UserCreationAttributes extends Optional<
  UserAttributes,
  | 'id'
  | 'phone'
  | 'job_title'
  | 'avatar_url'
  | 'role_id'
  | 'is_active'
  | 'last_login_at'
  | 'created_by'
> {}

/** Columns that must never leave the API. */
export const USER_SECRET_FIELDS = ['password_hash'] as const;

// password_hash is excluded everywhere by default (also when User is included
// from another model). Auth code that needs it uses User.scope('withPassword').
@DefaultScope(() => ({ attributes: { exclude: [...USER_SECRET_FIELDS] } }))
@Scopes(() => ({ withPassword: { attributes: { include: ['password_hash'] } } }))
@Table({
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class User extends Model<UserAttributes, UserCreationAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.CHAR(36),
  })
  declare id: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true,
  })
  declare email: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare password_hash: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare phone: string | null;

  @Column({
    type: DataType.STRING(150),
    allowNull: true,
  })
  declare job_title: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare avatar_url: string | null;

  @ForeignKey(() => Role)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare role_id: string | null;

  @BelongsTo(() => Role, {
    foreignKey: 'role_id',
    as: 'role',
  })
  declare role: Role;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  declare is_active: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare last_login_at: Date | null;

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

  /** Serialisation guard: never emit secrets even if a query selected them. */
  toJSON(): any {
    const json: any = super.toJSON();
    for (const f of USER_SECRET_FIELDS) delete json[f];
    return json;
  }
}
