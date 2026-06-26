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

import { User } from '@/modules/users/models/user.model';
import { ActivityAction } from '@/common/enums';

@Table({
  tableName: 'activity_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
})
export class ActivityLog extends Model<ActivityLog> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.CHAR(36),
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare user_id: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare user_email: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  declare user_role: string;

  @Column({
    type: DataType.ENUM(...Object.values(ActivityAction)),
    allowNull: false,
  })
  declare action: ActivityAction;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare entity_type: string | null;

  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare entity_id: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare entity_label: string | null;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  declare changes: Record<string, any> | null;

  @Column({
    type: DataType.STRING(45),
    allowNull: true,
  })
  declare ip_address: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare user_agent: string | null;

  @BelongsTo(() => User)
  declare user: User;
}
