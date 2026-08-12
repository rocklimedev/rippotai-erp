import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  CreatedAt,
} from 'sequelize-typescript';
import { SnagList } from './snag-list.model';

export enum SnagItemStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RECTIFIED = 'rectified',
  VERIFIED = 'verified',
}

@Table({
  tableName: 'snag_items',
  timestamps: false,
  underscored: true,
})
export class SnagItem extends Model<SnagItem> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => SnagList)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'snag_list_id',
  })
  declare snagListId: string;

  @BelongsTo(() => SnagList, { foreignKey: 'snagListId' })
  declare snagList: SnagList;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'trade_team_id',
  })
  declare tradeTeamId: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare location: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare description: string;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'photo_document_id',
  })
  declare photoDocumentId: string | null;

  @Default(SnagItemStatus.OPEN)
  @Column({
    type: DataType.ENUM(...Object.values(SnagItemStatus)),
    allowNull: false,
  })
  declare status: SnagItemStatus;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'assigned_to',
  })
  declare assignedTo: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'resolved_at',
  })
  declare resolvedAt: Date | null;

  @CreatedAt
  @Column({ field: 'created_at' })
  declare createdAt: Date;
}
