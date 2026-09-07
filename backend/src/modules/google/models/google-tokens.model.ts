// google/models/google-token.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  PrimaryKey,
  Index,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '@/modules/users/models/user.model';

export interface GoogleTokenCreationAttributes {
  userId: string;
  accessToken: string;
  refreshToken?: string | null;
  scope?: string | null;
  expiresAt: Date;
}

@Table({
  tableName: 'google_tokens',
  timestamps: true,
})
export class GoogleToken extends Model<
  GoogleToken,
  GoogleTokenCreationAttributes
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.CHAR(36),
  })
  declare id: string;

  @ForeignKey(() => User)
  @Index({ unique: true }) // one Google connection per user; drop if you'll allow multiple accounts per user
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare userId: string;

  @BelongsTo(() => User, {
    foreignKey: 'userId',
    as: 'user',
  })
  declare user: User;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare accessToken: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare refreshToken: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare scope: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare expiresAt: Date;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}
