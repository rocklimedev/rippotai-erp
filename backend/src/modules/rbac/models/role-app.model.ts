// modules/apps/models/role-app.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Role } from './role.model';
import { App } from './app.model';
import { User } from '@/modules/users/models/user.model';

@Table({
  tableName: 'role_apps',
  timestamps: false,
})
export class RoleApp extends Model<RoleApp> {
  @ForeignKey(() => Role)
  @Column({ type: DataType.CHAR(36), allowNull: false, primaryKey: true })
  declare role_id: string;

  @ForeignKey(() => App)
  @Column({ type: DataType.STRING(50), allowNull: false, primaryKey: true })
  declare app_code: string;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  declare granted_at: Date;

  @ForeignKey(() => User)
  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare granted_by: string | null;

  @BelongsTo(() => Role) declare role: Role;
  @BelongsTo(() => App) declare app: App;
  @BelongsTo(() => User, { foreignKey: 'granted_by' }) declare grantor: User;
}
