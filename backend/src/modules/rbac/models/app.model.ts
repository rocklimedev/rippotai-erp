// modules/apps/models/app.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  HasMany,
} from 'sequelize-typescript';
import { RoleApp } from './role-app.model';
@Table({
  tableName: 'apps',
  timestamps: false,
})
export class App extends Model<App> {
  @PrimaryKey
  @Column({ type: DataType.STRING(50) })
  declare code: string; // 'boq' | 'projects' | 'quotations' | 'vendors' | 'documents' | 'leads' | 'tasks' | 'calendar'

  @Column({ type: DataType.STRING(100), allowNull: false })
  declare name: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare is_active: boolean; // lets you retire an app without deleting rows

  @HasMany(() => RoleApp, { foreignKey: 'app_code' })
  declare roleApps: RoleApp[];
}
