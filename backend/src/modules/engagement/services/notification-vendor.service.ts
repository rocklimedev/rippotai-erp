import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../notifications.service';
import { NotificationType } from '@/common/enums';
import { Vendor } from '@/modules/vendors/models/vendors.model';
import { VendorStatus } from '@/common/enums';

interface NotifyOptions {
  recipientUserIds: string[]; // who should receive this notification
  actorUserId?: string; // who triggered it (optional, for future use)
}

@Injectable()
export class NotificationVendorService {
  constructor(private readonly notificationsService: NotificationsService) {}

  async notifyVendorCreated(
    vendor: Vendor,
    options: NotifyOptions,
  ): Promise<void> {
    await this.dispatch(
      options.recipientUserIds,
      NotificationType.VENDOR_CREATED, // TODO: match your actual enum member
      'New vendor added',
      `Vendor "${vendor.name ?? vendor.company_name}" was created.`,
      vendor,
    );
  }

  async notifyVendorUpdated(
    vendor: Vendor,
    options: NotifyOptions,
  ): Promise<void> {
    await this.dispatch(
      options.recipientUserIds,
      NotificationType.VENDOR_UPDATED,
      'Vendor updated',
      `Vendor "${vendor.name ?? vendor.company_name}" was updated.`,
      vendor,
    );
  }

  async notifyVendorStatusChanged(
    vendor: Vendor,
    status: VendorStatus,
    options: NotifyOptions,
  ): Promise<void> {
    await this.dispatch(
      options.recipientUserIds,
      NotificationType.VENDOR_STATUS_CHANGED,
      'Vendor status changed',
      `Vendor "${vendor.name ?? vendor.company_name}" status changed to "${status}".`,
      vendor,
    );
  }

  async notifyVendorDeleted(
    vendorId: string,
    vendorName: string | undefined,
    options: NotifyOptions,
  ): Promise<void> {
    await this.dispatchById(
      options.recipientUserIds,
      NotificationType.VENDOR_DELETED,
      'Vendor removed',
      `Vendor "${vendorName ?? vendorId}" was deleted.`,
      vendorId,
    );
  }

  private async dispatch(
    recipientUserIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    vendor: Vendor,
  ): Promise<void> {
    await this.dispatchById(recipientUserIds, type, title, message, vendor.id);
  }

  private async dispatchById(
    recipientUserIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    vendorId: string,
  ): Promise<void> {
    if (!recipientUserIds?.length) return;

    const dtos = recipientUserIds.map((user_id) => ({
      user_id,
      type,
      title,
      message,
      entity_type: 'vendor',
      entity_id: vendorId,
    }));

    await this.notificationsService.createMany(dtos as any);
  }
}
