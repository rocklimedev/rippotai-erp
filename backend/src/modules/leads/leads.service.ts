import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Lead } from './models/lead.model';
import { LeadNote } from './models/lead-note.model';
import { LeadActivity } from './models/lead-activity.model';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { MoveStageDto } from './dto/move-stage.dto';
import { AddNoteDto } from './dto/add-note.dto';
import { ProposalDto } from './dto/proposal.dto';
import { QueryLeadsDto, ContactSort } from './dto/query-leads.dto';
import { UpdateDocDto } from './dto/update-doc.dto';
import {
  ACTIVE_STAGES,
  STAGE_ORDER,
  STAGE_LABELS,
  LeadStage,
  StuckMode,
  DocType,
} from '@/common/enums/leads.enums';
import { ActivityLogForLeadService } from '../engagement/services/activity-log-lead.service';
import { NotificationForLeadService } from '../engagement/services/notification-lead.service';

const DEFAULT_OWNER_POOL = ['A. Mehra', 'S. Kapoor'];
const STUCK_DAYS_DEFAULT = 7;
const OVERALL_CONVERSION_DEFAULT = 59;

@Injectable()
export class LeadsService {
  constructor(
    @InjectModel(Lead) private leadModel: typeof Lead,
    @InjectModel(LeadNote) private noteModel: typeof LeadNote,
    @InjectModel(LeadActivity) private activityModel: typeof LeadActivity,

    private readonly activityLogService: ActivityLogForLeadService,
    private readonly notificationService: NotificationForLeadService,
  ) {}

  private include() {
    return [
      {
        model: LeadNote,
        separate: true,
        order: [['createdAt', 'DESC']] as any,
      },
      {
        model: LeadActivity,
        separate: true,
        order: [['createdAt', 'DESC']] as any,
      },
    ];
  }

  private daysInStage(lead: Lead): number {
    if (!lead.stageEnteredAt) return lead.days ?? 0;
    const ms = Date.now() - new Date(lead.stageEnteredAt).getTime();
    return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
  }

  private isStuck(lead: Lead, stuckDays: number): boolean {
    if (lead.stuckMode === StuckMode.ALWAYS) return true;
    if (lead.stuckMode === StuckMode.NEVER) return false;
    return (
      ACTIVE_STAGES.includes(lead.stage) && this.daysInStage(lead) > stuckDays
    );
  }

  private serialize(lead: Lead, stuckDays = STUCK_DAYS_DEFAULT) {
    const days = this.daysInStage(lead);
    return {
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      whatsapp: lead.whatsapp || lead.phone,
      email: lead.email,
      type: lead.type,
      location: lead.location,
      size: lead.size,
      budget: lead.budget,
      timeline: lead.timeline,
      source: lead.source,
      owner: lead.owner,
      stage: lead.stage,
      stageLabel: STAGE_LABELS[lead.stage],
      days,
      stuck: this.isStuck(lead, stuckDays),
      tag: lead.tag,
      color: lead.color,
      stuckMode: lead.stuckMode,
      followUp: lead.followUp,
      proposal: lead.proposalAmount
        ? {
            amount: lead.proposalAmount,
            timeline: lead.proposalTimeline,
            remarks: lead.proposalRemarks,
          }
        : null,
      docs: {
        brief: lead.docBrief,
        proposal: lead.docProposal,
        contract: lead.docContract,
      },
      notes: (lead.notes || []).map((n) => ({
        id: n.id,
        author: n.author,
        text: n.text,
        createdAt: n.createdAt,
      })),
      activity: (lead.activity || []).map((a) => ({
        id: a.id,
        text: a.text,
        createdAt: a.createdAt,
      })),
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    };
  }

  private async addActivity(leadId: string, text: string) {
    await this.activityModel.create({ leadId, text } as any);
  }

  private async findOrThrow(id: string) {
    const lead = await this.leadModel.findByPk(id, {
      include: [LeadNote, LeadActivity],
    });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  // ==================== MAIN CRUD ====================

  async create(dto: CreateLeadDto, user?: any) {
    const count = await this.leadModel.count();
    const owner = DEFAULT_OWNER_POOL[count % DEFAULT_OWNER_POOL.length];

    const lead = await this.leadModel.create({
      ...dto,
      owner,
      stage: LeadStage.CAPTURE,
      stageEnteredAt: new Date(),
      days: 0,
    } as any);

    await this.addActivity(
      lead.id,
      `Lead captured via ${dto.source || 'Unknown'}`,
    );
    await this.addActivity(lead.id, `Auto-assigned to ${owner}`);

    // Activity Log + Notification
    await this.activityLogService.logLeadCreated(lead, user);
    await this.notificationService.notifyLeadCreated(lead, user?.id);

    return this.serialize(await this.findOrThrow(lead.id));
  }

  async findAll(query: QueryLeadsDto) {
    const where: any = {};
    if (query.stage) where.stage = query.stage;
    if (query.q) {
      const like = { [Op.like]: `%${query.q}%` };
      where[Op.or] = [
        { name: like },
        { location: like },
        { phone: like },
        { email: like },
        { owner: like },
      ];
    }

    const leads = await this.leadModel.findAll({
      where,
      include: this.include(),
    });

    let serialized = leads.map((l) => this.serialize(l));
    if (query.sort) serialized = this.sortContacts(serialized, query.sort);
    return serialized;
  }

  private sortContacts(rows: any[], sort: ContactSort) {
    const stageIdx = (stage: LeadStage) => STAGE_ORDER.indexOf(stage);
    const cmp: Record<ContactSort, (a: any, b: any) => number> = {
      [ContactSort.NAME_ASC]: (a, b) => a.name.localeCompare(b.name),
      [ContactSort.NAME_DESC]: (a, b) => b.name.localeCompare(a.name),
      [ContactSort.STAGE]: (a, b) =>
        stageIdx(a.stage) - stageIdx(b.stage) || a.name.localeCompare(b.name),
      [ContactSort.DAYS]: (a, b) => b.days - a.days,
      [ContactSort.OWNER]: (a, b) =>
        (a.owner || '').localeCompare(b.owner || '') ||
        a.name.localeCompare(b.name),
      [ContactSort.LOCATION]: (a, b) =>
        (a.location || '').localeCompare(b.location || '') ||
        a.name.localeCompare(b.name),
    };
    return [...rows].sort(cmp[sort]);
  }

  async board() {
    const leads = await this.findAll({} as QueryLeadsDto);
    const columns = STAGE_ORDER.map((stage) => ({
      id: stage,
      label: STAGE_LABELS[stage],
      leads: leads.filter((l) => l.stage === stage),
    }));
    return {
      columns,
      activeCount: leads.filter((l) => l.stage !== LeadStage.LOST).length,
      stuckCount: leads.filter((l) => l.stuck).length,
    };
  }

  async findOne(id: string) {
    return this.serialize(await this.findOrThrow(id));
  }

  async update(id: string, dto: UpdateLeadDto, user?: any) {
    const lead = await this.findOrThrow(id);
    Object.assign(lead, dto);
    await lead.save();
    await this.addActivity(id, 'Lead details updated');

    await this.activityLogService.logLeadUpdated(lead, user);
    await this.notificationService.notifyLeadUpdated(lead, user?.id);

    return this.serialize(await this.findOrThrow(id));
  }

  async remove(id: string, user?: any) {
    const lead = await this.findOrThrow(id);
    const leadName = lead.name;
    await lead.destroy();

    await this.activityLogService.logLeadDeleted(leadName, id, user);
    await this.notificationService.notifyLeadDeleted(leadName, user?.id);

    return { id, deleted: true };
  }

  async moveStage(id: string, dto: MoveStageDto, user?: any) {
    const lead = await this.findOrThrow(id);
    if (lead.stage === dto.stage) return this.serialize(lead);

    const fromStage = lead.stage;
    const fromLabel = STAGE_LABELS[fromStage];

    lead.stage = dto.stage;
    lead.stageEnteredAt = new Date();
    lead.days = 0;
    await lead.save();

    const suffix = dto.via ? ` (${dto.via})` : '';
    await this.addActivity(
      id,
      `Moved from ${fromLabel} to ${STAGE_LABELS[dto.stage]}${suffix}`,
    );

    await this.activityLogService.logLeadStageChanged(
      lead,
      fromStage,
      dto.stage,
      user,
    );
    await this.notificationService.notifyLeadStageChanged(
      lead,
      fromStage,
      dto.stage,
      user?.id,
    );

    return this.serialize(await this.findOrThrow(id));
  }

  async markNurture(id: string, user?: any) {
    return this.moveStage(id, { stage: LeadStage.NURTURE }, user);
  }

  async markLost(id: string, user?: any) {
    return this.moveStage(id, { stage: LeadStage.LOST }, user);
  }

  async addNote(id: string, dto: AddNoteDto, user?: any) {
    await this.findOrThrow(id);
    await this.noteModel.create({
      leadId: id,
      author: dto.author || 'A. Mehra',
      text: dto.text,
    } as any);

    await this.addActivity(id, `Note added by ${dto.author || 'A. Mehra'}`);

    const currentLead = await this.findOrThrow(id);

    await this.activityLogService.logLeadNoteAdded(
      currentLead,
      dto.text,
      dto.author || 'A. Mehra',
      user,
    );
    await this.notificationService.notifyLeadNoteAdded(
      currentLead.name,
      dto.author || 'A. Mehra',
      user?.id,
    );

    return this.serialize(currentLead);
  }

  async setProposal(id: string, dto: ProposalDto, user?: any) {
    const lead = await this.findOrThrow(id);
    lead.proposalAmount = dto.amount.toString();
    lead.proposalTimeline = dto.timeline || '1–3 months';
    lead.proposalRemarks = dto.remarks || null;

    if (lead.docProposal === 0) lead.docProposal = 1;

    const movedStage = lead.stage !== LeadStage.PROP;
    const fromLabel = STAGE_LABELS[lead.stage];

    if (movedStage) {
      lead.stage = LeadStage.PROP;
      lead.stageEnteredAt = new Date();
      lead.days = 0;
    }

    await lead.save();

    if (movedStage) {
      await this.addActivity(
        id,
        `Moved from ${fromLabel} to ${STAGE_LABELS[LeadStage.PROP]}`,
      );
    }
    if (dto.remarks) {
      await this.noteModel.create({
        leadId: id,
        author: dto.author || 'A. Mehra',
        text: `Proposal: ${dto.remarks}`,
      } as any);
    }
    await this.addActivity(
      id,
      `Proposal quoted ${dto.amount} · ${lead.proposalTimeline}`,
    );

    await this.activityLogService.logProposalSent(lead, dto.amount, user);
    await this.notificationService.notifyProposalSent(
      lead,
      dto.amount,
      user?.id,
    );

    return this.serialize(await this.findOrThrow(id));
  }

  // Other internal methods (no major user action)
  async updateDoc(id: string, docType: DocType, dto: UpdateDocDto) {
    const lead = await this.findOrThrow(id);
    const field =
      docType === DocType.BRIEF
        ? 'docBrief'
        : docType === DocType.PROPOSAL
          ? 'docProposal'
          : 'docContract';

    const labels = ['Not started', 'Sent', 'Signed'];
    const prev = (lead as any)[field] as number;
    const next = dto.status !== undefined ? dto.status : (prev + 1) % 3;

    (lead as any)[field] = next;
    await lead.save();

    const docNames = {
      brief: 'Requirements Brief',
      proposal: 'Design Proposal',
      contract: 'Contract',
    };
    await this.addActivity(
      id,
      `${docNames[docType]}: ${labels[prev]} → ${labels[next]}`,
    );

    return this.serialize(await this.findOrThrow(id));
  }

  async updateColor(id: string, color: string | null) {
    const lead = await this.findOrThrow(id);
    lead.color = color as any;
    await lead.save();
    return this.serialize(lead);
  }

  async updateFollowUp(id: string, followUp: string | null) {
    const lead = await this.findOrThrow(id);
    lead.followUp = followUp;
    await lead.save();
    if (followUp) {
      await this.addActivity(id, `Follow-up scheduled for ${followUp}`);
    }
    return this.serialize(await this.findOrThrow(id));
  }

  async review(stuckDays = STUCK_DAYS_DEFAULT) {
    const leads = await this.leadModel.findAll({ include: this.include() });
    const serialized = leads.map((l) => this.serialize(l, stuckDays));

    const activeCount = serialized.filter(
      (l) => l.stage !== LeadStage.LOST,
    ).length;
    const stuck = serialized.filter((l) => l.stuck);

    const kpis = [
      {
        label: 'Total Active Leads',
        value: activeCount,
        sub: 'Across all stages excl. Closed-Lost',
      },
      {
        label: 'Overall Conversion Rate',
        value: `${OVERALL_CONVERSION_DEFAULT}%`,
        sub: 'Enquiry to signed contract, trailing 90 days',
      },
      {
        label: 'Leads Flagged Stuck',
        value: stuck.length,
        sub: `In stage longer than ${stuckDays} days`,
      },
    ];

    const transitions: [string, LeadStage, LeadStage][] = [
      ['Capture → Qualification', LeadStage.CAPTURE, LeadStage.QUAL],
      ['Qualification → Discovery', LeadStage.QUAL, LeadStage.DISC],
      ['Discovery → Proposal', LeadStage.DISC, LeadStage.PROP],
      ['Proposal → Negotiation', LeadStage.PROP, LeadStage.NEGO],
      ['Negotiation → Contract', LeadStage.NEGO, LeadStage.CONTRACT],
      ['Contract → Handoff', LeadStage.CONTRACT, LeadStage.HANDOFF],
    ];

    const atOrPast = (stage: LeadStage) =>
      serialized.filter(
        (l) => STAGE_ORDER.indexOf(l.stage) >= STAGE_ORDER.indexOf(stage),
      ).length;

    const convBars = transitions.map(([label, from, to]) => {
      const denom = atOrPast(from) || 1;
      const pct = Math.round((atOrPast(to) / denom) * 100);
      return { label, pct };
    });

    const timeBars = STAGE_ORDER.slice(0, 7).map((stage) => {
      const list = serialized.filter((l) => l.stage === stage);
      const avg = list.length
        ? Math.round(
            (list.reduce((a, l) => a + l.days, 0) / list.length) * 10,
          ) / 10
        : 0;
      return { label: STAGE_LABELS[stage], avgDays: avg };
    });

    const stuckRows = stuck
      .slice()
      .sort((a, b) => b.days - a.days)
      .map((l) => ({
        id: l.id,
        name: l.name,
        stage: l.stageLabel,
        days: l.days,
        owner: l.owner,
      }));

    const wonStages = [LeadStage.CONTRACT, LeadStage.HANDOFF];
    const sources = ['Website', 'Referral', 'Instagram', 'WhatsApp', 'Walk-in'];
    const sourceRows = sources.map((s) => {
      const list = serialized.filter((l) => (l.source || '').startsWith(s));
      const won = list.filter((l) => wonStages.includes(l.stage)).length;
      return { label: s, count: list.length, won };
    });

    return { kpis, convBars, timeBars, stuckRows, sourceRows };
  }
}
