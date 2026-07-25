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

export interface PasswordResetTokenCreationAttributes {
  user_id: string;
  token_hash: string;
  expires_at: Date;
  used_at?: Date | null;
}

@Table({
  tableName: 'password_reset_tokens',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
})
export class PasswordResetToken extends Model<
  PasswordResetToken,
  PasswordResetTokenCreationAttributes
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.CHAR(36))
  declare id: string;

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

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    unique: true,
  })
  declare token_hash: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare expires_at: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare used_at: Date | null;
}
