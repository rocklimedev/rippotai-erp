import {
  Table,
  Column,
  Model,
  DataType,
  Default,
  PrimaryKey,
  HasMany,
  HasOne,
} from 'sequelize-typescript';
import { RequirementStatus } from '../../../common/enums/requirement-status.enum';
import { SampleBoard } from './sample-board.model';
import { MaterialRateSheet } from './material-rate-sheet.model';
import { MaterialEstimate } from './material-estimate.model';

/**
 * 1. Material requirements — captured directly from the design team:
 * selections, budget, style and functional needs.
 */
@Table({ tableName: 'material_requirements', timestamps: true })
export class MaterialRequirement extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @Column(DataType.STRING)
  projectId: string;

  @Column(DataType.STRING)
  designerId: string;

  @Column(DataType.STRING)
  itemName: string;

  @Column({ type: DataType.STRING, allowNull: true })
  category: string;

  // The design team's selection (product / finish / spec chosen)
  @Column(DataType.TEXT)
  selection: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: true })
  budgetAmount: number;

  @Column({ type: DataType.STRING, allowNull: true })
  style: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  functionalNeeds: string;

  @Default(RequirementStatus.DRAFT)
  @Column(DataType.ENUM(...Object.values(RequirementStatus)))
  status: RequirementStatus;

  @HasMany(() => SampleBoard)
  sampleBoards: SampleBoard[];

  @HasMany(() => MaterialRateSheet)
  rateSheets: MaterialRateSheet[];

  @HasOne(() => MaterialEstimate)
  estimate: MaterialEstimate;
}
