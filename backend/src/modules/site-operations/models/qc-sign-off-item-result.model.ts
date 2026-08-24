import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  Default,
} from 'sequelize-typescript';
import { QcSignOff } from './qc-sign-off.model';
import { ChecklistTemplateItem } from './checklist-template-item.model';
import { QcItemResult } from '../../../common/enums/site-operations.enums';

@Table({
  tableName: 'qc_sign_off_item_results',
  timestamps: true,
  indexes: [{ unique: true, fields: ['qcSignOffId', 'templateItemId'] }],
})
export class QcSignOffItemResult extends Model<QcSignOffItemResult> {
  @ForeignKey(() => QcSignOff)
  @Column({ type: DataType.INTEGER, allowNull: false })
  qcSignOffId: number;

  @BelongsTo(() => QcSignOff)
  qcSignOff: QcSignOff;

  @ForeignKey(() => ChecklistTemplateItem)
  @Column({ type: DataType.INTEGER, allowNull: false })
  templateItemId: number;

  @BelongsTo(() => ChecklistTemplateItem)
  templateItem: ChecklistTemplateItem;

  @Default(QcItemResult.NA)
  @Column({
    type: DataType.ENUM(...Object.values(QcItemResult)),
    allowNull: false,
  })
  result: QcItemResult;

  @Column({ type: DataType.TEXT, allowNull: true })
  remark: string | null;
}
