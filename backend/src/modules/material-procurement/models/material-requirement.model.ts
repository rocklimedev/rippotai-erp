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
import { DeliveryChallan } from './delivery-challan.model';

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
  // DB column is `projectId`, NOT `project_id`
  // ============================================================

  @Column({
    type: DataType.STRING,
    field: 'projectId',
    allowNull: false,
  })
  declare projectId: string;

  // ============================================================
  // DESIGNER (site engineer who raised the request)
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
  // BUDGET — REMOVED
  // Pricing/budget is not part of a raw requirement; it belongs
  // to the quotation / rate-sheet stage further down the flow.
  // ============================================================

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
  // REQUIREMENT DATE
  // Date by which the site engineer needs the material on site.
  // DB column is `requirementDate`
  // ============================================================

  @Column({
    type: DataType.DATEONLY,
    field: 'requirementDate',
    allowNull: true,
  })
  declare requirementDate: string | null;
  // ============================================================
  // STATUS
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

  // Once the requirement is finalized, procurement raises one or
  // more delivery challans against it to actually supply the material.
  @HasMany(() => DeliveryChallan, {
    foreignKey: 'material_requirement_id',
    sourceKey: 'id',
    as: 'deliveryChallans',
  })
  declare deliveryChallans: DeliveryChallan[];
}
