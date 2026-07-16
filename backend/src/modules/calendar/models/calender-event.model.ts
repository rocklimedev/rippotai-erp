import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
  PrimaryKey,
  Index,
} from 'sequelize-typescript';
import { Project } from '@/modules/projects/models/projects.model';
export enum CalendarEventType {
  TASK = 'task',
  CLIENT_MEETING = 'client_meeting',
  INTERNAL_MEETING = 'internal_meeting',
  VENDOR_CALL = 'vendor_call',
  PRESENTATION = 'presentation',
  NOTE = 'note',
  TIMELINE = 'timeline',
  MILESTONE_DUE = 'milestone_due',
  QUOTATION_DEADLINE = 'quotation_deadline',
  SITE_VISIT = 'site_visit',
  HANDOVER = 'handover',
  PERSONAL = 'personal',
}

@Table({
  tableName: 'calendar_events',
  timestamps: true,
  underscored: true,
})
export class CalendarEvent extends Model<CalendarEvent> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare title: string;

  @Index
  @Column({
    type: DataType.ENUM(...Object.values(CalendarEventType)),
    allowNull: false,
    defaultValue: CalendarEventType.INTERNAL_MEETING,
  })
  declare type: CalendarEventType;

  @Index
  @Column({ type: DataType.DATE, allowNull: false })
  declare starts_at: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  declare ends_at: Date | null;

  @Default(false)
  @Column({ type: DataType.BOOLEAN, allowNull: false })
  declare all_day: boolean;

  @ForeignKey(() => Project)
  @Column({ type: DataType.UUID, allowNull: true })
  declare project_id: string | null;

  @BelongsTo(() => Project)
  declare project: Project;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare location: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string | null;

  @Default([])
  @Column({ type: DataType.JSON, allowNull: false })
  declare attendees: string[];

  @Column({ type: DataType.UUID, allowNull: true })
  declare created_by: string | null;
}
