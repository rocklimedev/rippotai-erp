import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
} from 'sequelize-typescript';

export enum SiteMockupStatus {
  PROPOSED = 'proposed',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Table({
  tableName: 'site_mockups',
  timestamps: false,
  underscored: true,
})
export class SiteMockup extends Model {
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
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare title: string;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'trade_team_id',
  })
  declare tradeTeamId: string | null;

  @Default(SiteMockupStatus.PROPOSED)
  @Column({
    type: DataType.ENUM(...Object.values(SiteMockupStatus)),
    allowNull: false,
  })
  declare status: SiteMockupStatus;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'document_id',
  })
  declare documentId: string | null;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'reviewed_by',
  })
  declare reviewedBy: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'reviewed_at',
  })
  declare reviewedAt: Date | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare remarks: string | null;

  @CreatedAt
  @Column({ field: 'created_at' })
  declare createdAt: Date;
}
