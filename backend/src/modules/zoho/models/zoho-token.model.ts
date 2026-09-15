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

export interface ZohoTokenCreationAttributes {
  userId: string;
  accessToken: string;
  refreshToken?: string | null;
  scope?: string | null;
  apiDomain?: string | null;
  expiresAt: Date;
}

@Table({
  tableName: 'zoho_tokens',
  timestamps: true,

  // IMPORTANT:
  // The existing MySQL table uses camelCase column names:
  // userId, accessToken, refreshToken, apiDomain, expiresAt,
  // createdAt, updatedAt.
  //
  // Explicit `field` mappings below ensure this model remains
  // compatible even if Sequelize has `underscored: true` globally.
})
export class ZohoToken extends Model<ZohoToken, ZohoTokenCreationAttributes> {
  // ============================================================
  // ID
  // ============================================================

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.CHAR(36),
    field: 'id',
    allowNull: false,
  })
  declare id: string;

  // ============================================================
  // USER
  // ============================================================

  @ForeignKey(() => User)
  @Index({ unique: true })
  @Column({
    type: DataType.CHAR(36),
    field: 'userId',
    allowNull: false,
  })
  declare userId: string;

  @BelongsTo(() => User, {
    foreignKey: 'userId',
    as: 'user',
  })
  declare user: User;

  // ============================================================
  // ZOHO TOKENS
  // ============================================================

  @Column({
    type: DataType.TEXT,
    field: 'accessToken',
    allowNull: false,
  })
  declare accessToken: string;

  @Column({
    type: DataType.TEXT,
    field: 'refreshToken',
    allowNull: true,
  })
  declare refreshToken: string | null;

  @Column({
    type: DataType.TEXT,
    field: 'scope',
    allowNull: true,
  })
  declare scope: string | null;

  @Column({
    type: DataType.STRING(255),
    field: 'apiDomain',
    allowNull: true,
  })
  declare apiDomain: string | null;

  @Column({
    type: DataType.DATE,
    field: 'expiresAt',
    allowNull: false,
  })
  declare expiresAt: Date;

  // ============================================================
  // TIMESTAMPS
  // ============================================================

  @Column({
    type: DataType.DATE,
    field: 'createdAt',
    allowNull: false,
  })
  declare readonly createdAt: Date;

  @Column({
    type: DataType.DATE,
    field: 'updatedAt',
    allowNull: false,
  })
  declare readonly updatedAt: Date;
}
