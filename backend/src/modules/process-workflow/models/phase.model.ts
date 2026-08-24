import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  Default,
  Index,
} from 'sequelize-typescript';
import { TrackType } from '../../../common/enums/process-workflow.enums';
import { Step } from './step.model';

/**
 * A phase is a top-level block of the process, e.g. Brief, Survey, Pre-Design,
 * Payment, Design, Tender Drawings, Working Drawings, Execution, Snag & Handover,
 * OR a phase on one of the two parallel tracks (Vendor & Trades / Material & Procurement).
 */
@Table({ tableName: 'phases', timestamps: true, paranoid: true })
export class Phase extends Model<Phase> {
  @Column({ type: DataType.STRING(120), allowNull: false })
  name: string;

  @Index
  @Column({ type: DataType.STRING(40), allowNull: false, unique: true })
  code: string; // e.g. 'BRIEF', 'SURVEY', 'PRE_DESIGN', 'TENDER_DRAWINGS'

  @Default(TrackType.MAIN)
  @Column({
    type: DataType.ENUM(...Object.values(TrackType)),
    allowNull: false,
  })
  trackType: TrackType;

  @Column({ type: DataType.INTEGER, allowNull: false })
  order: number; // display/sequence order within its track

  @Column({ type: DataType.TEXT, allowNull: true })
  description: string;

  @Default(true)
  @Column({ type: DataType.BOOLEAN })
  isActive: boolean;

  @HasMany(() => Step, { onDelete: 'CASCADE' })
  steps: Step[];
}
