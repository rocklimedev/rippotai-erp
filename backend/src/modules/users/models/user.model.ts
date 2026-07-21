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

import { Role } from '@/modules/rbac/models/role.model';

@Table({
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class User extends Model<User> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36) })
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

  // --- newly added profile fields ---
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
    // TEXT because a base64 data URL preview can exceed a VARCHAR limit.
    // If you move to real file uploads (S3/Cloud storage), switch this
    // back to STRING and store only the resulting URL.
    type: DataType.TEXT,
    allowNull: true,
  })
  declare avatar_url: string | null;
  // --- end newly added profile fields ---

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
}
