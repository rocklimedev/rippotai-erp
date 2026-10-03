import {
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { WorkHeadCheckpoint } from '../constants/work-head-checkpoints.constant';

@Table({ tableName: 'quality_checklist_templates', timestamps: false })
export class QualityChecklistTemplate extends Model<QualityChecklistTemplate> {
  @PrimaryKey @Column(DataType.STRING(50)) declare work_head: string;
  @Column(DataType.STRING(255)) declare label: string;
  @Column(DataType.INTEGER) declare serial_number: number;
  @Column(DataType.STRING(100)) declare sheet_name: string;
  @Column(DataType.STRING(255)) declare title: string;
  @Column(DataType.STRING(30)) declare version: string;
  @Column(DataType.JSON) declare checkpoints: WorkHeadCheckpoint[];
}
