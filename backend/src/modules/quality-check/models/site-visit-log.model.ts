import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
} from 'sequelize-typescript';

export enum SiteVisitType {
  ARCHITECT_SCHEDULED = 'architect_scheduled',
  SUPERVISOR_DAILY = 'supervisor_daily',
  VENDOR = 'vendor',
  CONTRACTOR = 'contractor',
  CLIENT = 'client',
}

@Table({
  tableName: 'site_visit_logs',
  timestamps: false,
  underscored: true,
})
export class SiteVisitLog extends Model {
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
    field: 'visitor_id',
  })
  declare visitorId: string | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    field: 'visitor_role',
  })
  declare visitorRole: string | null;

  @Default(SiteVisitType.SUPERVISOR_DAILY)
  @Column({
    type: DataType.ENUM(...Object.values(SiteVisitType)),
    allowNull: false,
    field: 'visit_type',
  })
  declare visitType: SiteVisitType;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'visited_at',
  })
  declare visitedAt: Date;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare purpose: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare notes: string | null;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'calendar_event_id',
  })
  declare calendarEventId: string | null;

  @CreatedAt
  @Column({ field: 'created_at' })
  declare createdAt: Date;
}
