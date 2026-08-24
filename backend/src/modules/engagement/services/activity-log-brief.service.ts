import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { ActivityLog } from '../models/activity-log.model';
import { ActivityAction } from '@/common/enums';

import { ProjectBrief } from '@/modules/brief/models/project-brief.model';

@Injectable()
export class ActivityLogForBriefService {
  constructor(
    @InjectModel(ActivityLog)
    private readonly activityLogModel: typeof ActivityLog,
  ) {}

  // =========================================================
  // BRIEF CREATED
  // =========================================================

  async logBriefCreated(brief: ProjectBrief, user?: any): Promise<void> {
    await this.activityLogModel.create({
      user_id: user?.id ?? null,
      user_email: user?.email ?? 'system',
      user_role: user?.role?.name ?? 'system',

      action: ActivityAction.BRIEF_CREATED,

      entity_type: 'ProjectBrief',
      entity_id: brief.id,

      entity_label: `Brief v${brief.version}`,

      changes: {
        project_id: brief.projectId,
        version: brief.version,
        status: brief.status,
      },

      ip_address: user?.ip_address,
      user_agent: user?.user_agent,
    } as any);
  }

  // =========================================================
  // BRIEF UPDATED
  // =========================================================

  async logBriefUpdated(brief: ProjectBrief, user?: any): Promise<void> {
    await this.activityLogModel.create({
      user_id: user?.id ?? null,
      user_email: user?.email ?? 'system',
      user_role: user?.role?.name ?? 'system',

      action: ActivityAction.BRIEF_UPDATED,

      entity_type: 'ProjectBrief',
      entity_id: brief.id,

      entity_label: `Brief v${brief.version}`,

      changes: {
        project_id: brief.projectId,
        version: brief.version,
        status: brief.status,
      },

      ip_address: user?.ip_address,
      user_agent: user?.user_agent,
    } as any);
  }

  // =========================================================
  // BRIEF DELETED
  // =========================================================

  async logBriefDeleted(brief: ProjectBrief, user?: any): Promise<void> {
    await this.activityLogModel.create({
      user_id: user?.id ?? null,
      user_email: user?.email ?? 'system',
      user_role: user?.role?.name ?? 'system',

      action: ActivityAction.BRIEF_DELETED,

      entity_type: 'ProjectBrief',
      entity_id: brief.id,

      entity_label: `Brief v${brief.version}`,

      changes: {
        project_id: brief.projectId,
        version: brief.version,
        status: brief.status,
      },

      ip_address: user?.ip_address,
      user_agent: user?.user_agent,
    } as any);
  }
}
