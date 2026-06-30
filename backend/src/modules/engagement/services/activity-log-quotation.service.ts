import { Injectable } from '@nestjs/common';

import { ActivityLogsService } from '../activity-logs.service';

import { ActivityAction } from '@/common/enums';

import { Quotation } from '@/modules/quotations/models/quotations.model';

@Injectable()
export class ActivityLogForQuotationService {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  // =========================

  // CREATED

  // =========================

  async logQuotationCreated(quotation: Quotation, user?: any) {
    await this.activityLogsService.log({
      user_id: user?.id ?? null,

      user_email: user?.email || 'system@internal',

      user_role: user?.role || 'SYSTEM',

      action: ActivityAction.QUOTATION_CREATED,

      entity_type: 'QUOTATION',

      entity_id: quotation.id,

      entity_label: quotation.quotationNumber,

      changes: {
        quotation_number: quotation.quotationNumber,

        project_id: quotation.projectId,

        vendor_id: quotation.vendorId,

        total_amount: quotation.totalAmount,

        status: quotation.status,
      },
    });
  }

  // =========================

  // UPDATED

  // =========================

  async logQuotationUpdated(quotation: Quotation, user?: any, changes?: any) {
    await this.activityLogsService.log({
      user_id: user?.id ?? null,

      user_email: user?.email,

      user_role: user?.role,

      action: ActivityAction.QUOTATION_UPDATED,

      entity_type: 'QUOTATION',

      entity_id: quotation.id,

      entity_label: quotation.quotationNumber,

      changes: {
        updated_fields: changes,
      },
    });
  }

  // =========================

  // SUBMITTED

  // =========================

  async logQuotationSubmitted(quotation: Quotation, user?: any) {
    await this.activityLogsService.log({
      user_id: user?.id ?? null,

      user_email: user?.email,

      user_role: user?.role,

      action: ActivityAction.QUOTATION_SUBMITTED,

      entity_type: 'QUOTATION',

      entity_id: quotation.id,

      entity_label: quotation.quotationNumber,

      changes: { submitted: true },
    });
  }

  // =========================

  // APPROVED

  // =========================

  async logQuotationApproved(
    quotation: Quotation,

    user?: any,

    remarks?: string,
  ) {
    await this.activityLogsService.log({
      user_id: user?.id ?? null,

      user_email: user?.email,

      user_role: user?.role,

      action: ActivityAction.QUOTATION_APPROVED,

      entity_type: 'QUOTATION',

      entity_id: quotation.id,

      entity_label: quotation.quotationNumber,

      changes: { review_remarks: remarks },
    });
  }

  // =========================

  // RETURNED FOR EDITING

  // =========================

  async logQuotationReturnedForEditing(
    quotation: Quotation,

    user?: any,

    remarks?: string,
  ) {
    await this.activityLogsService.log({
      user_id: user?.id ?? null,

      user_email: user?.email,

      user_role: user?.role,

      action: ActivityAction.QUOTATION_RETURNED,

      entity_type: 'QUOTATION',

      entity_id: quotation.id,

      entity_label: quotation.quotationNumber,

      changes: { review_remarks: remarks },
    });
  }

  // =========================

  // DECLINED

  // =========================

  async logQuotationDeclined(
    quotation: Quotation,

    user?: any,

    remarks?: string,
  ) {
    await this.activityLogsService.log({
      user_id: user?.id ?? null,

      user_email: user?.email,

      user_role: user?.role,

      action: ActivityAction.QUOTATION_DECLINED,

      entity_type: 'QUOTATION',

      entity_id: quotation.id,

      entity_label: quotation.quotationNumber,

      changes: { review_remarks: remarks },
    });
  }

  // =========================

  // CANCELLED

  // =========================

  async logQuotationCancelled(quotation: Quotation, user?: any) {
    await this.activityLogsService.log({
      user_id: user?.id ?? null,

      user_email: user?.email,

      user_role: user?.role,

      action: ActivityAction.QUOTATION_DECLINED,

      entity_type: 'QUOTATION',

      entity_id: quotation.id,

      entity_label: quotation.quotationNumber,

      changes: { cancelled: true },
    });
  }

  // =========================

  // SOFT DELETED

  // =========================

  async logQuotationDeleted(quotationId: string, user?: any) {
    await this.activityLogsService.log({
      user_id: user?.id ?? null,

      user_email: user?.email || 'system@internal',

      user_role: user?.role || 'SYSTEM',

      action: ActivityAction.QUOTATION_DELETED,

      entity_type: 'QUOTATION',

      entity_id: quotationId,

      changes: { deleted: true },
    });
  }

  // =========================

  // RESTORED

  // =========================

  async logQuotationRestored(quotation: Quotation, user?: any) {
    await this.activityLogsService.log({
      user_id: user?.id ?? null,

      user_email: user?.email || 'system@internal',

      user_role: user?.role || 'SYSTEM',

      action: ActivityAction.QUOTATION_RESTORED,

      entity_type: 'QUOTATION',

      entity_id: quotation.id,

      entity_label: quotation.quotationNumber,

      changes: { restored: true },
    });
  }
}
