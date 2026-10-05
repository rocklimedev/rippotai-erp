import {
  Column,
  DataType,
  Model,
  Table,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Task } from '../../tasks/models/task.model';

export type SyncTaskStatus = 'pending' | 'synced' | 'failed';

@Table({
  tableName: 'sync_tasks',
  timestamps: true,
  paranoid: false,
  indexes: [
    {
      name: 'uq_sync_tasks_local_task_id',
      unique: true,
      fields: ['local_task_id'],
    },
    {
      name: 'idx_sync_tasks_zoho_task_id',
      fields: ['zoho_task_id'],
    },
    {
      name: 'idx_sync_tasks_sync_status',
      fields: ['sync_status'],
    },
  ],
})
export class SyncTask extends Model<SyncTask> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Task)
  @Column(DataType.UUID)
  declare local_task_id: string;

  @BelongsTo(() => Task, 'local_task_id')
  declare local_task: Task;

  // Zoho IDs
  @Column(DataType.STRING)
  declare zoho_task_id: string;

  @Column(DataType.STRING)
  declare zoho_portal_id: string;

  @Column(DataType.STRING)
  declare zoho_project_id: string;

  @Column(DataType.STRING)
  declare zoho_tasklist_id: string;

  // Timestamps for change tracking
  @Column(DataType.DATE)
  declare synced_at?: Date;

  @Column(DataType.DATE)
  declare last_modified_local?: Date;

  @Column(DataType.DATE)
  declare last_modified_zoho?: Date;

  // Sync status
  @Column({
    type: DataType.ENUM('pending', 'synced', 'failed'),
    defaultValue: 'pending',
  })
  declare sync_status: SyncTaskStatus;

  // Error tracking
  @Column(DataType.TEXT)
  declare error_message?: string;

  // Direction of last change
  @Column({
    type: DataType.ENUM('push', 'pull', 'merge'),
    defaultValue: 'merge',
  })
  declare last_sync_direction?: 'push' | 'pull' | 'merge';

  // Sync attempt counter
  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  declare sync_attempts: number;
}
