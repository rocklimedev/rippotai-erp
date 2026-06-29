import {
  Table,
  Column,
  Model,
  PrimaryKey,
  Default,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
  AllowNull,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { User } from './user.model';

export interface UserSignatureAttributes {
  id: string;
  user_id: string;
  signature_url: string | null;
  signature_file_name: string | null;
  signature_file_type: string | null;
  signature_file_size: number | null;
  is_active: boolean;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserSignatureCreationAttributes extends Optional<
  UserSignatureAttributes,
  | 'id'
  | 'signature_url'
  | 'signature_file_name'
  | 'signature_file_type'
  | 'signature_file_size'
  | 'is_active'
  | 'created_by'
  | 'created_at'
  | 'updated_at'
> {}

@Table({
  tableName: 'user_signatures',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  collate: 'utf8_unicode_ci',
  engine: 'InnoDB',
})
export class UserSignature extends Model<
  UserSignatureAttributes,
  UserSignatureCreationAttributes
> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare id: string;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare user_id: string;

  @AllowNull(true)
  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  declare signature_url: string | null;

  @AllowNull(true)
  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare signature_file_name: string | null;

  @AllowNull(true)
  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare signature_file_type: string | null;

  @AllowNull(true)
  @Column({
    type: DataType.BIGINT,
    allowNull: true,
  })
  declare signature_file_size: number | null;

  @Default(true)
  @Column({
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: true,
  })
  declare is_active: boolean;

  @AllowNull(true)
  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare created_by: string | null;

  @CreatedAt
  declare created_at: Date;

  @UpdatedAt
  declare updated_at: Date;

  // Associations

  @BelongsTo(() => User, {
    foreignKey: 'user_id',
    targetKey: 'id',
    onDelete: 'CASCADE',
  })
  declare user: User;

  @BelongsTo(() => User, {
    foreignKey: 'created_by',
    targetKey: 'id',
    onDelete: 'SET NULL',
  })
  declare createdByUser: User;
}
