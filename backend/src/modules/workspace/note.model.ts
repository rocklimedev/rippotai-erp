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

/** Personal / shared notes (Notes app). Table created by migrations/20260930_workspace_notes_tasks.sql */
@Table({
  tableName: 'notes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Note extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare title: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare body: string | null;

  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare project_id: string | null;

  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare client_id: string | null;

  @Column({ type: DataType.STRING(40), allowNull: false, defaultValue: 'general' })
  declare category: string;

  @Column({ type: DataType.STRING(20), allowNull: false, defaultValue: 'mute' })
  declare tone: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare pinned: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare is_shared: boolean;

  @Column({ type: DataType.CHAR(36), allowNull: true })
  declare created_by: string | null;

  @CreatedAt
  @Column(DataType.DATE)
  declare created_at: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  declare updated_at: Date;
}
