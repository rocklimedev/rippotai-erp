import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../notifications.service';
import { NotificationType } from '@/common/enums';
import { Lead } from '@/modules/leads/models/lead.model';
import { LeadStage, STAGE_LABELS } from '@/common/enums/leads.enums';

interface NotifyOptions {
  recipientUserIds: string[]; // who should receive this notification
  actorUserId?: string; // who triggered it (optional, for future use)
}

@Injectable()
export class NotificationLeadService {
  constructor(private readonly notificationsService: NotificationsService) {}

  async notifyLeadCreated(lead: Lead, options: NotifyOptions): Promise<void> {
    await this.dispatch(
      options.recipientUserIds,
      NotificationType.LEAD_CREATED, // TODO: match your actual enum member
      'New lead captured',
      `Lead "${lead.name}" was captured via ${lead.source || 'Unknown'} and assigned to ${lead.owner}.`,
      lead.id,
    );
  }

  async notifyLeadStageChanged(
    lead: Lead,
    fromStage: LeadStage,
    options: NotifyOptions,
  ): Promise<void> {
    await this.dispatch(
      options.recipientUserIds,
      NotificationType.LEAD_STAGE_CHANGED,
      'Lead stage updated',
      `Lead "${lead.name}" moved from ${STAGE_LABELS[fromStage]} to ${STAGE_LABELS[lead.stage]}.`,
      lead.id,
    );
  }

  async notifyLeadMarkedLost(
    lead: Lead,
    options: NotifyOptions,
  ): Promise<void> {
    await this.dispatch(
      options.recipientUserIds,
      NotificationType.LEAD_LOST,
      'Lead marked as lost',
      `Lead "${lead.name}" was marked as lost.`,
      lead.id,
    );
  }

  async notifyProposalSet(
    lead: Lead,
    amount: number,
    options: NotifyOptions,
  ): Promise<void> {
    await this.dispatch(
      options.recipientUserIds,
      NotificationType.LEAD_PROPOSAL_SET,
      'Proposal quoted',
      `Proposal of ${amount} sent for lead "${lead.name}".`,
      lead.id,
    );
  }

  async notifyFollowUpScheduled(
    lead: Lead,
    followUp: string,
    options: NotifyOptions,
  ): Promise<void> {
    await this.dispatch(
      options.recipientUserIds,
      NotificationType.LEAD_FOLLOWUP_SCHEDULED,
      'Follow-up scheduled',
      `Follow-up for lead "${lead.name}" scheduled on ${followUp}.`,
      lead.id,
    );
  }

  private async dispatch(
    recipientUserIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    leadId: string,
  ): Promise<void> {
    if (!recipientUserIds?.length) return;

    const dtos = recipientUserIds.map((user_id) => ({
      user_id,
      type,
      title,
      message,
      entity_type: 'lead',
      entity_id: leadId,
    }));

    await this.notificationsService.createMany(dtos as any);
  }
}
