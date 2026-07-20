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

@Table({
  tableName: 'password_reset_tokens',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
})
export class PasswordResetToken extends Model<PasswordResetToken> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36) })
  declare id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare user_id: string;

  @BelongsTo(() => User, { foreignKey: 'user_id', as: 'user' })
  declare user: User;

  // SHA-256 hash of the raw token — the raw token is only ever emailed, never stored
  @Column({ type: DataType.STRING(64), allowNull: false, unique: true })
  declare token_hash: string;

  @Column({ type: DataType.DATE, allowNull: false })
  declare expires_at: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  declare used_at: Date | null;
}
