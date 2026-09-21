import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  PrimaryKey,
  HasMany,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';

import { RequirementStatus } from '../../../common/enums/requirement-status.enum';

import { SampleBoard } from './sample-board.model';
import { MaterialMaster } from './material-master.model';

import { Quotation } from '@/modules/quotations/models/quotations.model';

@Table({
  tableName: 'material_requirements',
  timestamps: false,
})
export class MaterialRequirement extends Model<MaterialRequirement> {
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
  // PROJECT
  // IMPORTANT:
  // DB column is `projectId`, NOT `project_id`
  // ============================================================

  @Column({
    type: DataType.STRING,
    field: 'projectId',
    allowNull: false,
  })
  declare projectId: string;

  // ============================================================
  // DESIGNER
  // DB column is `designerId`
  // ============================================================

  @Column({
    type: DataType.STRING,
    field: 'designerId',
    allowNull: false,
  })
  declare designerId: string;

  // ============================================================
  // REQUIREMENT
  // ============================================================

  @Column({
    type: DataType.STRING,
    field: 'itemName',
    allowNull: false,
  })
  declare itemName: string;

  @Column({
    type: DataType.STRING,
    field: 'category',
    allowNull: true,
  })
  declare category: string | null;

  @Column({
    type: DataType.TEXT,
    field: 'selection',
    allowNull: false,
  })
  declare selection: string;

  // ============================================================
  // MATERIAL MASTER
  //
  // JS property: materialId
  // DB column:   materialMasterId
  //
  // This lets the frontend/backend continue using materialId
  // while Sequelize writes to the existing DB column.
  // ============================================================

  @ForeignKey(() => MaterialMaster)
  @Column({
    type: DataType.UUID,
    field: 'materialMasterId',
    allowNull: true,
  })
  declare materialId: string | null;

  @BelongsTo(() => MaterialMaster, {
    foreignKey: 'materialId',
    targetKey: 'id',
    as: 'material',
  })
  declare material?: MaterialMaster;

  // ============================================================
  // BUDGET
  // DB column is `budgetAmount`
  // ============================================================

  @Column({
    type: DataType.DECIMAL(12, 2),
    field: 'budgetAmount',
    allowNull: true,
  })
  declare budgetAmount: number | null;

  // ============================================================
  // DESIGN INFORMATION
  // ============================================================

  @Column({
    type: DataType.STRING,
    field: 'style',
    allowNull: true,
  })
  declare style: string | null;

  @Column({
    type: DataType.TEXT,
    field: 'functionalNeeds',
    allowNull: true,
  })
  declare functionalNeeds: string | null;

  // ============================================================
  // STATUS
  // DB column is `status`
  // ============================================================

  @Default(RequirementStatus.DRAFT)
  @Column({
    type: DataType.ENUM(...Object.values(RequirementStatus)),
    field: 'status',
    allowNull: false,
  })
  declare status: RequirementStatus;

  // ============================================================
  // TIMESTAMPS
  //
  // DB columns are `createdAt` and `updatedAt`
  // ============================================================

  @Default(DataType.NOW)
  @Column({
    type: DataType.DATE,
    field: 'createdAt',
    allowNull: false,
  })
  declare createdAt: Date;

  @Default(DataType.NOW)
  @Column({
    type: DataType.DATE,
    field: 'updatedAt',
    allowNull: false,
  })
  declare updatedAt: Date;

  // ============================================================
  // ASSOCIATIONS
  // ============================================================

  @HasMany(() => SampleBoard, {
    foreignKey: 'materialRequirementId',
    as: 'sampleBoards',
  })
  declare sampleBoards: SampleBoard[];

  @HasMany(() => Quotation, {
    foreignKey: 'materialRequirementId',
    sourceKey: 'id',
    as: 'quotations',
  })
  declare quotations: Quotation[];
}
