import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  IsUUID,
} from 'sequelize-typescript';

@Table({
  tableName: 'project_phases',
  timestamps: true,
  paranoid: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
})
export class ProjectPhase extends Model<ProjectPhase> {
  // ===================== Primary Key =====================

  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.CHAR(36),
  })
  declare id: string;

  // ===================== Phase =====================

  /**
   * Phase number.
   *
   * Example:
   * 1, 2, 3...
   *
   * Used for the P1, P2, P3... sequence.
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare phase_number: number;

  /**
   * Explicit phase code printed on documents.
   *
   * Example:
   * P1, P2, P3...
   */
  @Column({
    type: DataType.STRING(20),
    allowNull: false,
  })
  declare phase_code: string;

  /**
   * Reusable/master phase title.
   *
   * Example:
   * MEP & Waterproofing
   */
  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare title: string;

  /**
   * General description of the phase.
   */
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string | null;

  // ===================== Ordering =====================

  /**
   * Default ordering of the phase.
   */
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare sort_order: number;

  // ===================== Soft Delete =====================

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare deleted_at: Date | null;
}
