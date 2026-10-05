import { Column, DataType, Model, Table } from 'sequelize-typescript';

export type ReminderKind = 'tasks' | 'calendar';

@Table({
  tableName: 'reminder_sync_settings',
  timestamps: true,
  underscored: true,
  indexes: [{ unique: true, fields: ['user_id', 'kind'] }],
})
export class ReminderSyncSettings extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;
  @Column({ type: DataType.UUID, allowNull: false }) declare user_id: string;
  @Column({ type: DataType.ENUM('tasks', 'calendar'), allowNull: false })
  declare kind: ReminderKind;
  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare enabled: boolean;
  @Column({ type: DataType.JSON, allowNull: false }) declare config: Record<
    string,
    any
  >;
  @Column(DataType.DATE) declare last_run: Date | null;
  @Column(DataType.TEXT) declare last_error: string | null;
  @Column(DataType.UUID) declare lock_token: string | null;
  @Column(DataType.DATE) declare lock_until: Date | null;
}

@Table({
  tableName: 'reminder_sync_records',
  timestamps: true,
  underscored: true,
  indexes: [{ unique: true, fields: ['user_id', 'kind', 'local_id'] }],
})
export class ReminderSyncRecord extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;
  @Column({ type: DataType.UUID, allowNull: false }) declare user_id: string;
  @Column({ type: DataType.ENUM('tasks', 'calendar'), allowNull: false })
  declare kind: ReminderKind;
  // No foreign key: mappings survive local deletion until the remote reminder is removed.
  @Column({ type: DataType.UUID, allowNull: false }) declare local_id: string;
  @Column(DataType.STRING) declare remote_id: string | null;
  @Column({ type: DataType.JSON, allowNull: false })
  declare destination: Record<string, any>;
  @Column(DataType.STRING(64)) declare fingerprint: string | null;
  @Column({
    type: DataType.ENUM('pending', 'synced', 'failed', 'uncertain'),
    defaultValue: 'pending',
  })
  declare status: string;
  @Column(DataType.TEXT) declare error: string | null;
  @Column(DataType.DATE) declare synced_at: Date | null;
}
