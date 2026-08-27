import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import { Drawing, DrawingStatus } from './drawing.model';

@Table({
  tableName: 'drawing_revisions',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['drawing_id', 'revision'],
    },
  ],
})
export class DrawingRevision extends Model<DrawingRevision> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => Drawing)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare drawingId: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  declare revision: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare issueDate: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare issuePurpose: string | null;

  @Default('Draft')
  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare status: DrawingStatus | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare filename: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare storageFilename: string | null;

  @Column({
    type: DataType.STRING(1000),
    allowNull: true,
  })
  declare url: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare mime: string | null;

  @Column({
    type: DataType.BIGINT,
    allowNull: true,
  })
  declare size: number | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remarks: string | null;

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare uploadedBy: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare uploadedByName: string | null;

  @BelongsTo(() => Drawing)
  declare drawing: Drawing;
}
