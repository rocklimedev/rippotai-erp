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

@Table({
  tableName: 'settings',
  timestamps: true,
  createdAt: false,
  updatedAt: 'updated_at',
})
export class Setting extends Model<Setting> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.CHAR(36),
  })
  declare id: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    unique: true,
    field: 'key',
  })
  declare key: string;

  @Column({
    type: DataType.JSON,
    allowNull: false,
    field: 'value',
  })
  declare value: Record<string, any>;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare updated_by: string | null;

  @BelongsTo(() => User)
  declare updater: User;
}
