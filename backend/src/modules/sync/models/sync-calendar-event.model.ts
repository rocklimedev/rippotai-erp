import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from 'sequelize';

import { CalendarEvent } from '../../calendar/models/calender-event.model';

export type SyncCalendarStatus = 'pending' | 'synced' | 'failed';

export type SyncDirection = 'push' | 'pull' | 'merge';

@Table({
  tableName: 'sync_calendar_events',
  timestamps: true,
  paranoid: false,
  indexes: [
    {
      name: 'uq_sync_calendar_events_local_event_id',
      unique: true,
      fields: ['local_event_id'],
    },
    {
      name: 'idx_sync_calendar_events_zoho_event_id',
      fields: ['zoho_event_id'],
    },
    {
      name: 'idx_sync_calendar_events_sync_status',
      fields: ['sync_status'],
    },
  ],
})
export class SyncCalendarEvent extends Model<
  InferAttributes<SyncCalendarEvent>,
  InferCreationAttributes<SyncCalendarEvent>
> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: CreationOptional<string>;

  @ForeignKey(() => CalendarEvent)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare local_event_id: string;

  @BelongsTo(() => CalendarEvent, 'local_event_id')
  declare local_event?: NonAttribute<CalendarEvent>;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare zoho_event_id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare zoho_calendar_id: string;

  @Column(DataType.DATE)
  declare synced_at?: Date | null;

  @Column(DataType.DATE)
  declare last_modified_local?: Date | null;

  @Column(DataType.DATE)
  declare last_modified_zoho?: Date | null;

  @Column({
    type: DataType.ENUM('pending', 'synced', 'failed'),
    defaultValue: 'pending',
    allowNull: false,
  })
  declare sync_status: CreationOptional<SyncCalendarStatus>;

  @Column(DataType.TEXT)
  declare error_message?: string | null;

  @Column({
    type: DataType.ENUM('push', 'pull', 'merge'),
    defaultValue: 'merge',
    allowNull: false,
  })
  declare last_sync_direction: CreationOptional<SyncDirection>;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    allowNull: false,
  })
  declare sync_attempts: CreationOptional<number>;
}
