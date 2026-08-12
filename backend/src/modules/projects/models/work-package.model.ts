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

export enum WorkPackageStatus {
  DRAFT = 'draft',
  ISSUED = 'issued',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

@Table({
  tableName: 'work_packages',
  timestamps: true,
  underscored: true,
})
export class WorkPackage extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'project_id',
  })
  declare projectId: string;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'boq_id',
  })
  declare boqId: string | null;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'trade_team_id',
  })
  declare tradeTeamId: string | null;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'vendor_id',
  })
  declare vendorId: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare title: string;

  @Default(0)
  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    field: 'total_value',
  })
  declare totalValue: number;

  @Default(WorkPackageStatus.DRAFT)
  @Column({
    type: DataType.ENUM(...Object.values(WorkPackageStatus)),
    allowNull: false,
  })
  declare status: WorkPackageStatus;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
    field: 'start_date',
  })
  declare startDate: string | null;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
    field: 'end_date',
  })
  declare endDate: string | null;

  @CreatedAt
  @Column({ field: 'created_at' })
  declare createdAt: Date;

  @UpdatedAt
  @Column({ field: 'updated_at' })
  declare updatedAt: Date;
}
