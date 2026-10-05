import { Column, DataType, Model, Table } from 'sequelize-typescript';

import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';

export type EntityType = 'task' | 'calendar';

export type SyncDirection = 'push' | 'pull';

export type SyncStatus = 'success' | 'failed';

export type SyncTriggerType = 'auto' | 'manual';

@Table({
  tableName: 'sync_logs',
  timestamps: true,
  paranoid: false,
  indexes: [
    {
      name: 'idx_sync_logs_entity_type',
      fields: ['entity_type'],
    },
    {
      name: 'idx_sync_logs_status',
      fields: ['status'],
    },
    {
      name: 'idx_sync_logs_entity_id',
      fields: ['entity_id'],
    },
    {
      name: 'idx_sync_logs_entity_type_created_at',
      fields: ['entity_type', 'created_at'],
    },
  ],
})
export class SyncLog extends Model<
  InferAttributes<SyncLog>,
  InferCreationAttributes<SyncLog>
> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: CreationOptional<string>;

  @Column({
    type: DataType.ENUM('task', 'calendar'),
    allowNull: false,
  })
  declare entity_type: EntityType;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare entity_id: string;

  @Column({
    type: DataType.ENUM('push', 'pull'),
    allowNull: false,
  })
  declare direction: SyncDirection;

  @Column({
    type: DataType.ENUM('success', 'failed'),
    defaultValue: 'success',
    allowNull: false,
  })
  declare status: CreationOptional<SyncStatus>;

  @Column(DataType.TEXT)
  declare error_message?: string | null;

  @Column(DataType.JSON)
  declare payload?: Record<string, unknown> | null;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 1,
    allowNull: false,
  })
  declare attempt: CreationOptional<number>;

  @Column(DataType.INTEGER)
  declare duration_ms?: number | null;

  @Column(DataType.UUID)
  declare triggered_by?: string | null;

  @Column({
    type: DataType.ENUM('auto', 'manual'),
    defaultValue: 'auto',
    allowNull: false,
  })
  declare trigger_type: CreationOptional<SyncTriggerType>;
}
