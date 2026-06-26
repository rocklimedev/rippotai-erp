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

import { User } from '@/modules/users/models/user.model';
import { AuthTokenType } from '@/common/enums';

@Table({
  tableName: 'auth_tokens',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
})
export class AuthToken extends Model<AuthToken> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.CHAR(36),
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare user_id: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true,
  })
  declare token_hash: string;

  @Column({
    type: DataType.ENUM(...Object.values(AuthTokenType)),
    allowNull: false,
    defaultValue: AuthTokenType.REFRESH,
  })
  declare type: AuthTokenType;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare device_info: string | null;

  @Column({
    type: DataType.STRING(45),
    allowNull: true,
  })
  declare ip_address: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare expires_at: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare revoked_at: Date | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare last_used_at: Date | null;

  @BelongsTo(() => User)
  declare user: User;
}
