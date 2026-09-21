import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import { ApprovalStatus } from '../../../common/enums/approval-status.enum';
import { MaterialRequirement } from './material-requirement.model';

/**
 * Sample boards tracked against a material requirement.
 *
 * IMPORTANT:
 * The database uses camelCase column names.
 * Explicit `field` mappings are therefore used to prevent
 * Sequelize from converting them to snake_case.
 */
@Table({
  tableName: 'sample_boards',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: false,
})
export class SampleBoard extends Model<SampleBoard> {
  // ============================================================
  // PRIMARY KEY
  // ============================================================

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
    field: 'id',
    allowNull: false,
  })
  declare id: string;

  // ============================================================
  // MATERIAL REQUIREMENT
  // DB column: materialRequirementId
  // ============================================================

  @ForeignKey(() => MaterialRequirement)
  @Column({
    type: DataType.UUID,
    field: 'materialRequirementId',
    allowNull: false,
  })
  declare materialRequirementId: string;

  @BelongsTo(() => MaterialRequirement, {
    foreignKey: 'materialRequirementId',
    targetKey: 'id',
    as: 'materialRequirement',
    onDelete: 'CASCADE',
  })
  declare materialRequirement?: MaterialRequirement;

  // ============================================================
  // TITLE
  // ============================================================

  @Column({
    type: DataType.STRING,
    field: 'title',
    allowNull: false,
  })
  declare title: string;

  // ============================================================
  // IMAGE URLS
  // DB column: imageUrls
  // ============================================================

  @Column({
    type: DataType.JSON,
    field: 'imageUrls',
    allowNull: true,
  })
  declare imageUrls: string[] | null;

  // ============================================================
  // VENDOR
  // DB column: vendorName
  // ============================================================

  @Column({
    type: DataType.STRING,
    field: 'vendorName',
    allowNull: true,
  })
  declare vendorName: string | null;

  // ============================================================
  // NOTES
  // ============================================================

  @Column({
    type: DataType.TEXT,
    field: 'notes',
    allowNull: true,
  })
  declare notes: string | null;

  // ============================================================
  // APPROVAL STATUS
  // DB column: approvalStatus
  // ============================================================

  @Default(ApprovalStatus.PENDING)
  @Column({
    type: DataType.ENUM(...Object.values(ApprovalStatus)),
    field: 'approvalStatus',
    allowNull: false,
  })
  declare approvalStatus: ApprovalStatus;

  // ============================================================
  // APPROVED BY
  // DB column: approvedBy
  // ============================================================

  @Column({
    type: DataType.STRING,
    field: 'approvedBy',
    allowNull: true,
  })
  declare approvedBy: string | null;

  // ============================================================
  // APPROVED AT
  // DB column: approvedAt
  // ============================================================

  @Column({
    type: DataType.DATE,
    field: 'approvedAt',
    allowNull: true,
  })
  declare approvedAt: Date | null;

  // ============================================================
  // CREATED AT
  // DB column: createdAt
  // ============================================================

  @Column({
    type: DataType.DATE,
    field: 'createdAt',
    allowNull: false,
  })
  declare createdAt: Date;
}
