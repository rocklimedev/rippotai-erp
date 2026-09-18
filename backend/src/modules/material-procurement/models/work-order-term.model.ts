import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  IsUUID,
} from 'sequelize-typescript';

import { WorkOrder } from './work-order.model';
import { TermsTemplate } from '@/modules/metas/models/terms-templates.model';

export interface WorkOrderTermCreationAttributes {
  id?: string;
  work_order_id: string;
  terms_template_id?: string | null;
  sort_order: number;
  description: string;
  is_mandatory?: boolean;
}

@Table({
  tableName: 'work_order_terms',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class WorkOrderTerm extends Model<
  WorkOrderTerm,
  WorkOrderTermCreationAttributes
> {
  // ============================================================
  // ID
  // ============================================================

  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.CHAR(36),
  })
  declare id: string;

  // ============================================================
  // WORK ORDER
  // ============================================================

  @ForeignKey(() => WorkOrder)
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare work_order_id: string;

  @BelongsTo(() => WorkOrder, {
    foreignKey: 'work_order_id',
    as: 'work_order',
  })
  declare work_order: WorkOrder;

  // ============================================================
  // TERMS TEMPLATE
  // ============================================================

  @ForeignKey(() => TermsTemplate)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare terms_template_id: string | null;

  @BelongsTo(() => TermsTemplate, {
    foreignKey: 'terms_template_id',
    as: 'terms_template',
  })
  declare terms_template: TermsTemplate;

  // ============================================================
  // TERM
  // ============================================================

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare sort_order: number;

  /**
   * Snapshot of the actual term content used in this Work Order.
   *
   * This should NOT be replaced by the template content on future
   * template edits.
   */
  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare description: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  declare is_mandatory: boolean;

  // ============================================================
  // TIMESTAMPS
  // ============================================================

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare created_at: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare updated_at: Date;
}
