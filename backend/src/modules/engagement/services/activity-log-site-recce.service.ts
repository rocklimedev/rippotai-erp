import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ActivityLog } from '../models/activity-log.model';
import { ActivityAction } from '@/common/enums';
import { SiteRecce } from '@/modules/reki/models/site-recce.model';
@Injectable()
export class ActivityLogForSiteRecceService {
  constructor(
    @InjectModel(ActivityLog)
    private readonly activityLogModel: typeof ActivityLog,
  ) {}

  async logSiteRecceCreated(recce: SiteRecce, user?: any): Promise<void> {
    await this.activityLogModel.create({
      user_id: user?.id || null,
      user_email: user?.email || 'system',
      user_role: user?.role?.name || 'system',
      action: ActivityAction.SITE_RECCE_CREATED,
      entity_type: 'SiteRecce',
      entity_id: recce.id,
      entity_label: `Recce ${recce.id}`,
      changes: {
        project_id: recce.project_id,
        recce_date: recce.recce_date,
        status: recce.status,
      },
      ip_address: user?.ip_address,
      user_agent: user?.user_agent,
    } as any);
  }

  async logSiteRecceUpdated(recce: SiteRecce, user?: any): Promise<void> {
    await this.activityLogModel.create({
      user_id: user?.id || null,
      user_email: user?.email || 'system',
      user_role: user?.role?.name || 'system',
      action: ActivityAction.SITE_RECCE_UPDATED,
      entity_type: 'SiteRecce',
      entity_id: recce.id,
      entity_label: `Recce ${recce.id}`,
      changes: {
        status: recce.status,
        updated_by: user?.id,
      },
      ip_address: user?.ip_address,
      user_agent: user?.user_agent,
    } as any);
  }

  async logSiteRecceStatusChanged(
    recce: SiteRecce,
    oldStatus: string,
    newStatus: string,
    user?: any,
  ): Promise<void> {
    await this.activityLogModel.create({
      user_id: user?.id || null,
      user_email: user?.email || 'system',
      user_role: user?.role?.name || 'system',
      action: ActivityAction.SITE_RECCE_STATUS_CHANGED,
      entity_type: 'SiteRecce',
      entity_id: recce.id,
      entity_label: `Recce ${recce.id}`,
      changes: {
        from_status: oldStatus,
        to_status: newStatus,
      },
      ip_address: user?.ip_address,
      user_agent: user?.user_agent,
    } as any);
  }

  async logSiteRecceDeleted(
    recceId: string,
    projectName: string | null,
    user?: any,
  ): Promise<void> {
    await this.activityLogModel.create({
      user_id: user?.id || null,
      user_email: user?.email || 'system',
      user_role: user?.role?.name || 'system',
      action: ActivityAction.SITE_RECCE_DELETED,
      entity_type: 'SiteRecce',
      entity_id: recceId,
      entity_label: `Recce ${recceId} (${projectName || 'Unknown'})`,
      ip_address: user?.ip_address,
      user_agent: user?.user_agent,
    } as any);
  }
}
