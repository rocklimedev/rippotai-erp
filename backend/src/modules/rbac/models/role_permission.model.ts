import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import { Role } from './role.model';
import { Permission } from './permission.model';
import { User } from '@/modules/users/models/user.model';

@Table({
  tableName: 'role_permissions',
  timestamps: false,
})
export class RolePermission extends Model<RolePermission> {
  @ForeignKey(() => Role)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
    primaryKey: true,
  })
  declare role_id: string;

  @ForeignKey(() => Permission)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
    primaryKey: true,
  })
  declare permission_id: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare granted_at: Date;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare granted_by: string | null;

  @BelongsTo(() => Role)
  declare role: Role;

  @BelongsTo(() => Permission)
  declare permission: Permission;

  @BelongsTo(() => User, {
    foreignKey: 'granted_by',
  })
  declare grantor: User;
}
