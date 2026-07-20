import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  PrimaryKey,
  Default,
} from 'sequelize-typescript';
import { Lead } from './lead.model';

@Table({
  tableName: 'lead_notes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
})
export class LeadNote extends Model<LeadNote> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => Lead)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'lead_id',
  })
  declare leadId: string;

  @BelongsTo(() => Lead, {
    foreignKey: 'leadId',
    targetKey: 'id',
  })
  declare lead: Lead;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare author: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare text: string;

  @Column({
    type: DataType.DATE,
    field: 'created_at',
  })
  declare createdAt: Date;
}
