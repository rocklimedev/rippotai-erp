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
import { NotificationType } from '@/common/enums';

@Table({
  tableName: 'notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
})
export class Notification extends Model<Notification> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.CHAR(36),
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare user_id: string;

  @Column({
    type: DataType.ENUM(...Object.values(NotificationType)),
    allowNull: false,
  })
  declare type: NotificationType;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare message: string;

  // Optional: which entity this notification belongs to
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
    type: DataType.TINYINT,
    allowNull: false,
    defaultValue: 0,
  })
  declare is_read: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare read_at: Date | null;

  @BelongsTo(() => User)
  declare user: User;
}
