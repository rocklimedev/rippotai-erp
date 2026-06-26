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
import { VerificationTokenType } from '@/common/enums';

@Table({
  tableName: 'verification_tokens',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
})
export class VerificationToken extends Model<VerificationToken> {
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
  declare token: string;

  @Column({
    type: DataType.ENUM(...Object.values(VerificationTokenType)),
    allowNull: false,
  })
  declare type: VerificationTokenType;

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

  @BelongsTo(() => User)
  declare user: User;
}
