import { Injectable } from '@nestjs/common';

import { NotificationBroadcastService } from '../notification-broadcast.service';
import { NotificationType } from '@/common/enums';
import { Quotation } from '@/modules/quotations/models/quotations.model';
@Injectable()
export class NotificationForQuotationService {
  constructor(
    private readonly notificationBroadcastService: NotificationBroadcastService,
  ) {}

  async notifyQuotationCreated(
    quotation: Quotation,
    actorId?: string,
  ): Promise<void> {
    const project = quotation.projectSnapshot as { name?: string };

    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.QUOTATION_CREATED,
      title: 'New Quotation Created',
      message: `Quotation ${quotation.quotationNumber} has been created for ${
        project.name ?? 'the project'
      }.`,
    });
  }

  async notifyQuotationUpdated(
    quotation: Quotation,
    actorId?: string,
  ): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.QUOTATION_UPDATED,
      title: 'Quotation Updated',
      message: `Quotation ${quotation.quotationNumber} has been updated.`,
    });
  }

  async notifyQuotationSubmitted(
    quotation: Quotation,
    actorId?: string,
  ): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.QUOTATION_SUBMITTED,
      title: 'Quotation Submitted',
      message: `Quotation ${quotation.quotationNumber} has been submitted for review.`,
    });
  }

  async notifyQuotationApproved(
    quotation: Quotation,
    actorId?: string,
  ): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.QUOTATION_APPROVED,
      title: 'Quotation Approved',
      message: `Quotation ${quotation.quotationNumber} has been approved.`,
    });
  }

  async notifyQuotationReturnedForEditing(
    quotation: Quotation,
    remarks?: string,
    actorId?: string,
  ): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.QUOTATION_RETURNED_FOR_EDITING,
      title: 'Quotation Returned for Editing',
      message: `Quotation ${quotation.quotationNumber} returned for editing.${
        remarks ? ` Remarks: ${remarks}` : ''
      }`,
    });
  }

  async notifyQuotationDeclined(
    quotation: Quotation,
    remarks?: string,
    actorId?: string,
  ): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.QUOTATION_DECLINED,
      title: 'Quotation Declined',
      message: `Quotation ${quotation.quotationNumber} has been declined.${
        remarks ? ` Remarks: ${remarks}` : ''
      }`,
    });
  }

  async notifyQuotationCancelled(
    quotation: Quotation,
    actorId?: string,
  ): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.QUOTATION_CANCELLED,
      title: 'Quotation Cancelled',
      message: `Quotation ${quotation.quotationNumber} has been cancelled.`,
    });
  }

  async notifyQuotationDeleted(
    quotationNumber: string,
    actorId?: string,
  ): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.QUOTATION_DELETED,
      title: 'Quotation Deleted',
      message: `Quotation ${quotationNumber} has been deleted.`,
    });
  }

  async notifyQuotationRestored(
    quotation: Quotation,
    actorId?: string,
  ): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.QUOTATION_RESTORED,
      title: 'Quotation Restored',
      message: `Quotation ${quotation.quotationNumber} has been restored.`,
    });
  }
}
