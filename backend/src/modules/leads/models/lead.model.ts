import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  Default,
  PrimaryKey,
} from 'sequelize-typescript';
import { LeadNote } from './lead-note.model';
import { LeadActivity } from './lead-activity.model';
import { LeadTask } from './lead-task.model';
import {
  LeadStage,
  LeadType,
  LeadTag,
  LeadColor,
  StuckMode,
  DocStatus,
} from '@/common/enums/leads.enums';

@Table({
  tableName: 'leads',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Lead extends Model<Lead> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare phone: string | null;

  // Deal / project name shown on the pipeline card (Bigin "Deal_Name").
  @Column({ type: DataType.STRING, allowNull: true, field: 'deal_name' })
  declare dealName: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare company: string | null;

  @Column({ type: DataType.UUID, allowNull: true, field: 'client_id' })
  declare clientId: string | null;

  @Column({ type: DataType.UUID, allowNull: true, field: 'project_id' })
  declare projectId: string | null;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: true })
  declare amount: string | number | null;

  @Column({ type: DataType.DATEONLY, allowNull: true, field: 'expected_close' })
  declare expectedClose: string | null;

  @Column({ type: DataType.UUID, allowNull: true, field: 'owner_id' })
  declare ownerId: string | null;

  @Column({ type: DataType.STRING(500), allowNull: true, field: 'lost_reason' })
  declare lostReason: string | null;

  @Column({ type: DataType.DATE, allowNull: true, field: 'closed_at' })
  declare closedAt: Date | null;

  @Column({ type: DataType.STRING(64), allowNull: true, field: 'zoho_id' })
  declare zohoId: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare whatsapp: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare email: string | null;

  @Default(LeadType.RESIDENTIAL)
  @Column({
    type: DataType.ENUM(...Object.values(LeadType)),
  })
  declare type: LeadType;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare location: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare size: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare budget: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare timeline: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare source: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare owner: string | null;

  @Default(LeadStage.CAPTURE)
  @Column({
    type: DataType.ENUM(...Object.values(LeadStage)),
  })
  declare stage: LeadStage;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
  })
  declare days: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'stage_entered_at',
  })
  declare stageEnteredAt: Date | null;

  @Column({
    type: DataType.ENUM(...Object.values(LeadTag)),
    allowNull: true,
  })
  declare tag: LeadTag | null;

  @Column({
    type: DataType.ENUM(...Object.values(LeadColor)),
    allowNull: true,
  })
  declare color: LeadColor | null;

  @Default(StuckMode.AUTO)
  @Column({
    type: DataType.ENUM(...Object.values(StuckMode)),
    field: 'stuck_mode',
  })
  declare stuckMode: StuckMode;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
    field: 'follow_up',
  })
  declare followUp: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'proposal_amount',
  })
  declare proposalAmount: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'proposal_timeline',
  })
  declare proposalTimeline: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'proposal_remarks',
  })
  declare proposalRemarks: string | null;

  @Default(DocStatus.NOT_STARTED)
  @Column({
    type: DataType.SMALLINT,
    field: 'doc_brief',
  })
  declare docBrief: DocStatus;

  @Default(DocStatus.NOT_STARTED)
  @Column({
    type: DataType.SMALLINT,
    field: 'doc_proposal',
  })
  declare docProposal: DocStatus;

  @Default(DocStatus.NOT_STARTED)
  @Column({
    type: DataType.SMALLINT,
    field: 'doc_contract',
  })
  declare docContract: DocStatus;

  @HasMany(() => LeadNote, {
    onDelete: 'CASCADE',
    hooks: true,
  })
  declare notes: LeadNote[];

  @HasMany(() => LeadActivity, {
    onDelete: 'CASCADE',
    hooks: true,
  })
  declare activity: LeadActivity[];

  @HasMany(() => LeadTask, {
    onDelete: 'CASCADE',
    hooks: true,
  })
  declare tasks: LeadTask[];

  declare createdAt: Date;
  declare updatedAt: Date;
}
