import {
  Table,
  Column,
  Model,
  PrimaryKey,
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
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  declare id: string;

  @ForeignKey(() => QcSignOff)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  qcSignOffId: string;

  @BelongsTo(() => QcSignOff)
  qcSignOff: QcSignOff;

  @ForeignKey(() => ChecklistTemplateItem)
  @Column({ type: DataType.CHAR(36), allowNull: false })
  templateItemId: string;

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
