import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
  UpdatedAt,
  HasMany,
} from 'sequelize-typescript';
import { SnagItem } from './snag-item.model';

export enum SnagListStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  CLOSED = 'closed',
}

@Table({
  tableName: 'snag_lists',
  timestamps: true,
  underscored: true,
})
export class SnagList extends Model<SnagList> {
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
    allowNull: true,
    field: 'walkthrough_date',
  })
  declare walkthroughDate: string | null;

  @Default(SnagListStatus.OPEN)
  @Column({
    type: DataType.ENUM(...Object.values(SnagListStatus)),
    allowNull: false,
  })
  declare status: SnagListStatus;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'created_by',
  })
  declare createdBy: string | null;

  @HasMany(() => SnagItem, {
    foreignKey: 'snagListId',
    as: 'items',
  })
  declare items: SnagItem[];

  @CreatedAt
  @Column({ field: 'created_at' })
  declare createdAt: Date;

  @UpdatedAt
  @Column({ field: 'updated_at' })
  declare updatedAt: Date;
}
