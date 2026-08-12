import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
} from 'sequelize-typescript';

export enum DesignClarificationStatus {
  OPEN = 'open',
  ANSWERED = 'answered',
  CLOSED = 'closed',
}

@Table({
  tableName: 'design_clarifications',
  timestamps: false,
  underscored: true,
})
export class DesignClarification extends Model<DesignClarification> {
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
    type: DataType.UUID,
    allowNull: true,
    field: 'raised_by',
  })
  declare raisedBy: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare subject: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare question: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare response: string | null;

  @Default(DesignClarificationStatus.OPEN)
  @Column({
    type: DataType.ENUM(...Object.values(DesignClarificationStatus)),
    allowNull: false,
  })
  declare status: DesignClarificationStatus;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'responded_by',
  })
  declare respondedBy: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'responded_at',
  })
  declare respondedAt: Date | null;

  @CreatedAt
  @Column({ field: 'created_at' })
  declare createdAt: Date;
}
