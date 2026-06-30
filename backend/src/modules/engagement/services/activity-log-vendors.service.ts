import { Injectable } from '@nestjs/common';

import { ActivityLogsService } from '../activity-logs.service';

import { ActivityAction } from '@/common/enums';

import { Vendor } from '@/modules/vendors/models/vendors.model';

@Injectable()
export class ActivityLogForVendorService {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  // =========================

  // CREATED

  // =========================

  async logVendorCreated(vendor: Vendor, user?: any) {
    await this.activityLogsService.log({
      user_id: user?.id ?? null,

      user_email: user?.email || 'system@internal',

      user_role: user?.role || 'SYSTEM',

      action: ActivityAction.VENDOR_CREATED,

      entity_type: 'VENDOR',

      entity_id: vendor.id,

      entity_label: vendor.name,

      changes: {
        name: vendor.name,

        status: vendor.status,

        company_name: vendor.company_name,
      },
    });
  }

  // =========================

  // UPDATED

  // =========================

  async logVendorUpdated(vendor: Vendor, user?: any, changes?: any) {
    await this.activityLogsService.log({
      user_id: user?.id ?? null,

      user_email: user?.email,

      user_role: user?.role,

      action: ActivityAction.VENDOR_UPDATED,

      entity_type: 'VENDOR',

      entity_id: vendor.id,

      changes: {
        updated_fields: changes,
      },
    });
  }

  // =========================

  // DELETED

  // =========================

  async logVendorDeleted(vendorId: string, user?: any) {
    await this.activityLogsService.log({
      user_id: user?.id ?? null,

      user_email: user?.email || 'system@internal',

      user_role: user?.role || 'SYSTEM',

      action: ActivityAction.VENDOR_DELETED,

      entity_type: 'VENDOR',

      entity_id: vendorId,

      changes: {
        deleted: true,
      },
    });
  }
}
