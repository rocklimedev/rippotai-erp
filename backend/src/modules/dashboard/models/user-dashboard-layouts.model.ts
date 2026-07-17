import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { LayoutItem } from '@/config/dashboard-widgets.config';

interface UserDashboardLayoutCreationAttributes {
  userId: string;
  appKey: string;
  layout: LayoutItem[];
  hiddenKeys: string[];
}

@Table({
  tableName: 'user_dashboard_layouts',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class UserDashboardLayout extends Model<
  UserDashboardLayout,
  UserDashboardLayoutCreationAttributes
> {
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
    field: 'user_id',
    primaryKey: true,
  })
  declare userId: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    field: 'app_key',
    primaryKey: true,
  })
  declare appKey: string;

  @Column({
    type: DataType.JSON,
    allowNull: false,
    defaultValue: [],
  })
  declare layout: LayoutItem[];

  @Column({
    type: DataType.JSON,
    allowNull: false,
    defaultValue: [],
    field: 'hidden_keys',
  })
  declare hiddenKeys: string[];

  @CreatedAt
  @Column({
    type: DataType.DATE,
    field: 'created_at',
  })
  declare createdAt: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    field: 'updated_at',
  })
  declare updatedAt: Date;
}
