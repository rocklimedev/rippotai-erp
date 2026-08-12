import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
} from 'sequelize-typescript';

@Table({
  tableName: 'daily_site_reports',
  timestamps: false,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['project_id', 'report_date'],
      name: 'uk_dailyreport_project_date',
    },
  ],
})
export class DailySiteReport extends Model<DailySiteReport> {
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
    type: DataType.DATEONLY,
    allowNull: false,
    field: 'report_date',
  })
  declare reportDate: string;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'supervisor_id',
  })
  declare supervisorId: string | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare weather: string | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'manpower_count',
  })
  declare manpowerCount: number | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'work_done',
  })
  declare workDone: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare issues: string | null;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'photos_document_id',
  })
  declare photosDocumentId: string | null;

  @CreatedAt
  @Column({ field: 'created_at' })
  declare createdAt: Date;
}
