import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  PrimaryKey,
} from 'sequelize-typescript';

import { ProcessStep } from './process-step.model';
import { DeliverableType } from './deliverable-type.model';

interface ProcessStepDeliverableAttributes {
  step_id: string;
  deliverable_type_id: string;
}

@Table({
  tableName: 'process_step_deliverables',
  timestamps: false,
})
export class ProcessStepDeliverable
  extends Model<ProcessStepDeliverableAttributes>
  implements ProcessStepDeliverableAttributes
{
  @PrimaryKey
  @ForeignKey(() => ProcessStep)
  @Column(DataType.CHAR(36))
  declare step_id: string;

  @PrimaryKey
  @ForeignKey(() => DeliverableType)
  @Column(DataType.CHAR(36))
  declare deliverable_type_id: string;
}
