import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({
  tableName: 'units',
  timestamps: true,
  underscored: true, // ✅ IMPORTANT FIX
})
export class Unit extends Model<Unit> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    unique: true,
  })
  declare code: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare description: string;

  @Default(true)
  @Column(DataType.BOOLEAN)
  declare is_active: boolean;

  // ✅ Sequelize will map automatically:
  // createdAt -> created_at
  @CreatedAt
  declare createdAt: Date;

  // updatedAt -> updated_at
  @UpdatedAt
  declare updatedAt: Date;
}
