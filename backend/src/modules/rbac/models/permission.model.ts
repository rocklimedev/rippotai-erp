import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
} from 'sequelize-typescript';

@Table({
  tableName: 'permissions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['resource', 'action'],
      name: 'uk_permissions_resource_action',
    },
  ],
})
export class Permission extends Model<Permission> {
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
  })
  declare name: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  declare resource: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  declare action: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string | null;
}
