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
 * 2a. Sourcing & sample boards — sample boards tracked per requirement,
 * with approval status.
 */
@Table({ tableName: 'sample_boards', timestamps: true, updatedAt: false })
export class SampleBoard extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @ForeignKey(() => MaterialRequirement)
  @Column(DataType.UUID)
  materialRequirementId: string;

  @BelongsTo(() => MaterialRequirement, { onDelete: 'CASCADE' })
  materialRequirement: MaterialRequirement;

  @Column(DataType.STRING)
  title: string;

  // Stored as JSON on MySQL (Sequelize has no native array type here)
  @Column({ type: DataType.JSON, allowNull: true })
  imageUrls: string[];

  @Column({ type: DataType.STRING, allowNull: true })
  vendorName: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  notes: string;

  @Default(ApprovalStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(ApprovalStatus)))
  approvalStatus: ApprovalStatus;

  @Column({ type: DataType.STRING, allowNull: true })
  approvedBy: string;

  @Column({ type: DataType.DATE, allowNull: true })
  approvedAt: Date;
}
