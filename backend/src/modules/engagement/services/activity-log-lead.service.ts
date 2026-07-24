import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ActivityLog } from '../models/activity-log.model';
import { ActivityAction } from '@/common/enums';
import { Lead } from '@/modules/leads/models/lead.model';
@Injectable()
export class ActivityLogForLeadService {
  constructor(
    @InjectModel(ActivityLog)
    private readonly activityLogModel: typeof ActivityLog,
  ) {}

  async logLeadCreated(lead: Lead, user?: any): Promise<void> {
    await this.activityLogModel.create({
      user_id: user?.id || null,
      user_email: user?.email || 'system',
      user_role: user?.role?.name || 'system',
      action: ActivityAction.LEAD_CREATED,
      entity_type: 'Lead',
      entity_id: lead.id,
      entity_label: lead.name,
      changes: {
        stage: lead.stage,
        owner: lead.owner,
        source: lead.source,
      },
      ip_address: user?.ip_address,
      user_agent: user?.user_agent,
    } as any);
  }

  async logLeadUpdated(lead: Lead, user?: any): Promise<void> {
    await this.activityLogModel.create({
      user_id: user?.id || null,
      user_email: user?.email || 'system',
      user_role: user?.role?.name || 'system',
      action: ActivityAction.LEAD_UPDATED,
      entity_type: 'Lead',
      entity_id: lead.id,
      entity_label: lead.name,
      changes: {
        stage: lead.stage,
        owner: lead.owner,
      },
      ip_address: user?.ip_address,
      user_agent: user?.user_agent,
    } as any);
  }

  async logLeadStageChanged(
    lead: Lead,
    fromStage: string,
    toStage: string,
    user?: any,
  ): Promise<void> {
    await this.activityLogModel.create({
      user_id: user?.id || null,
      user_email: user?.email || 'system',
      user_role: user?.role?.name || 'system',
      action: ActivityAction.LEAD_STAGE_CHANGED,
      entity_type: 'Lead',
      entity_id: lead.id,
      entity_label: lead.name,
      changes: {
        from_stage: fromStage,
        to_stage: toStage,
      },
      ip_address: user?.ip_address,
      user_agent: user?.user_agent,
    } as any);
  }

  async logLeadNoteAdded(
    lead: Lead,
    noteText: string,
    author: string,
    user?: any,
  ): Promise<void> {
    await this.activityLogModel.create({
      user_id: user?.id || null,
      user_email: user?.email || 'system',
      user_role: user?.role?.name || 'system',
      action: ActivityAction.LEAD_NOTE_ADDED,
      entity_type: 'Lead',
      entity_id: lead.id,
      entity_label: lead.name,
      changes: {
        note_author: author,
        note_preview: noteText.substring(0, 100),
      },
      ip_address: user?.ip_address,
      user_agent: user?.user_agent,
    } as any);
  }

  async logProposalSent(lead: Lead, amount: number, user?: any): Promise<void> {
    await this.activityLogModel.create({
      user_id: user?.id || null,
      user_email: user?.email || 'system',
      user_role: user?.role?.name || 'system',
      action: ActivityAction.LEAD_PROPOSAL_SENT,
      entity_type: 'Lead',
      entity_id: lead.id,
      entity_label: lead.name,
      changes: { proposal_amount: amount },
      ip_address: user?.ip_address,
      user_agent: user?.user_agent,
    } as any);
  }

  async logLeadDeleted(
    leadName: string,
    leadId: string,
    user?: any,
  ): Promise<void> {
    await this.activityLogModel.create({
      user_id: user?.id || null,
      user_email: user?.email || 'system',
      user_role: user?.role?.name || 'system',
      action: ActivityAction.LEAD_DELETED,
      entity_type: 'Lead',
      entity_id: leadId,
      entity_label: leadName,
      ip_address: user?.ip_address,
      user_agent: user?.user_agent,
    } as any);
  }
}
