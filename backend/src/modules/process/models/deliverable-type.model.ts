import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  Unique,
  BelongsToMany,
  CreatedAt,
} from 'sequelize-typescript';

import { ProcessStep } from './process-step.model';
import { ProcessStepDeliverable } from './process-step-deliverable.model';

@Table({
  tableName: 'deliverable_types',
  timestamps: true,
  updatedAt: false,
})
export class DeliverableType extends Model<DeliverableType> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.CHAR(36))
  declare id: string;

  @AllowNull(false)
  @Unique('uk_deliverable_name')
  @Column(DataType.STRING(255))
  declare name: string;

  @CreatedAt
  @Column({ field: 'created_at' })
  declare created_at: Date;

  @BelongsToMany(() => ProcessStep, () => ProcessStepDeliverable)
  declare steps: ProcessStep[];
}
