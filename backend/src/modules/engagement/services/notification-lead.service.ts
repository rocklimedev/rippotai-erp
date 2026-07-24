import { Injectable } from '@nestjs/common';

import { NotificationBroadcastService } from '../notification-broadcast.service';
import { NotificationType } from '@/common/enums';
import { Lead } from '@/modules/leads/models/lead.model';
import { LeadStage } from '@/common/enums/leads.enums';

@Injectable()
export class NotificationForLeadService {
  constructor(
    private readonly notificationBroadcastService: NotificationBroadcastService,
  ) {}

  async notifyLeadCreated(lead: Lead, actorId?: string): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.LEAD_CREATED,
      title: 'New Lead Captured',
      message: `New lead "${lead.name}" has been added (Stage: ${lead.stage}).`,
    });
  }

  async notifyLeadUpdated(lead: Lead, actorId?: string): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.LEAD_UPDATED,
      title: 'Lead Updated',
      message: `Lead "${lead.name}" details have been updated.`,
    });
  }

  async notifyLeadStageChanged(
    lead: Lead,
    fromStage: string,
    toStage: string,
    actorId?: string,
  ): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.LEAD_STAGE_CHANGED,
      title: 'Lead Stage Changed',
      message: `Lead "${lead.name}" moved from ${fromStage} → ${toStage}.`,
    });
  }

  async notifyLeadNoteAdded(
    leadName: string,
    author: string,
    actorId?: string,
  ): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.LEAD_NOTE_ADDED,
      title: 'New Note on Lead',
      message: `New note added to lead "${leadName}" by ${author}.`,
    });
  }

  async notifyProposalSent(
    lead: Lead,
    amount: number,
    actorId?: string,
  ): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.LEAD_PROPOSAL_SENT,
      title: 'Proposal Sent',
      message: `Proposal of ₹${amount} sent for lead "${lead.name}".`,
    });
  }

  async notifyLeadDeleted(leadName: string, actorId?: string): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.LEAD_DELETED,
      title: 'Lead Deleted',
      message: `Lead "${leadName}" has been deleted.`,
    });
  }
}
