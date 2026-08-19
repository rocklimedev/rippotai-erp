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
@Table({
  tableName: 'sample_boards',
  timestamps: true,
  updatedAt: false,
})
export class SampleBoard extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => MaterialRequirement)
  @Column(DataType.UUID)
  declare materialRequirementId: string;

  @BelongsTo(() => MaterialRequirement, { onDelete: 'CASCADE' })
  declare materialRequirement: MaterialRequirement;

  @Column(DataType.STRING)
  declare title: string;

  // Stored as JSON on MySQL (Sequelize has no native array type here)
  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  declare imageUrls: string[];

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare vendorName: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare notes: string;

  @Default(ApprovalStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(ApprovalStatus)))
  declare approvalStatus: ApprovalStatus;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare approvedBy: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare approvedAt: Date;
}
