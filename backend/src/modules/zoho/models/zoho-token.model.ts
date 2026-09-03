import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  PrimaryKey,
  Index,
} from 'sequelize-typescript';

export interface ZohoTokenCreationAttributes {
  ownerKey: string;
  accessToken: string;
  refreshToken?: string | null;
  scope?: string | null;
  apiDomain?: string | null;
  expiresAt: Date;
}

@Table({
  tableName: 'zoho_tokens',
  timestamps: true,
})
export class ZohoToken extends Model<ZohoToken, ZohoTokenCreationAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.CHAR(36),
  })
  declare id: string;

  @Index({ unique: true })
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare ownerKey: string;

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
    type: DataType.STRING,
    allowNull: true,
  })
  declare apiDomain: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare expiresAt: Date;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}
