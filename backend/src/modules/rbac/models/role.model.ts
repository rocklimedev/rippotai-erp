import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  HasMany,
} from 'sequelize-typescript';

import { User } from '@/modules/users/models/user.model';
import { RoleApp } from './role-app.model';
import { RolePermission } from './role_permission.model';
@Table({
  tableName: 'roles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Role extends Model<Role> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.CHAR(36),
  })
  declare id: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
  })
  declare name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string | null;

  // ✅ FIXED RELATION (UUID based)
  @HasMany(() => User, {
    foreignKey: 'role_id',
  })
  declare users: User[];

  // role.model.ts additions
  @HasMany(() => RoleApp, { foreignKey: 'role_id' })
  declare roleApps: RoleApp[];

  @HasMany(() => RolePermission, { foreignKey: 'role_id' })
  declare rolePermissions: RolePermission[];
}
