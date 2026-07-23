import { Injectable } from '@nestjs/common';

import { NotificationBroadcastService } from '../notification-broadcast.service';
import { NotificationType } from '@/common/enums';
import { VendorStatus } from '@/common/enums';
import { Vendor } from '@/modules/vendors/models/vendors.model';
@Injectable()
export class NotificationForVendorService {
  constructor(
    private readonly notificationBroadcastService: NotificationBroadcastService,
  ) {}

  async notifyVendorCreated(vendor: Vendor, actorId?: string): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.VENDOR_CREATED,
      title: 'New Vendor Added',
      message: `Vendor "${vendor.name || vendor.company_name}" has been added to the system.`,
    });
  }

  async notifyVendorUpdated(vendor: Vendor, actorId?: string): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.VENDOR_UPDATED,
      title: 'Vendor Updated',
      message: `Vendor "${vendor.name || vendor.company_name}" has been updated.`,
    });
  }

  async notifyVendorStatusChanged(
    vendor: Vendor,
    oldStatus: VendorStatus,
    newStatus: VendorStatus,
    actorId?: string,
  ): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.VENDOR_STATUS_CHANGED,
      title: 'Vendor Status Changed',
      message: `Vendor "${vendor.name || vendor.company_name}" status changed from ${oldStatus} to ${newStatus}.`,
    });
  }

  async notifyVendorDeleted(
    vendorName: string,
    actorId?: string,
  ): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.VENDOR_DELETED,
      title: 'Vendor Deleted',
      message: `Vendor "${vendorName}" has been deleted.`,
    });
  }
}
