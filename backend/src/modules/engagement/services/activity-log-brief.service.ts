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

  async logBriefCreated(brief: ProjectBrief, user?: any): Promise<void> {
    await this.activityLogModel.create({
      user_id: user?.id || null,
      user_email: user?.email || 'system',
      user_role: user?.role?.name || 'system',
      action: ActivityAction.BRIEF_CREATED,
      entity_type: 'ProjectBrief',
      entity_id: brief.id,
      entity_label: brief.doc_no,
      changes: {
        project_id: brief.project_id,
        doc_no: brief.doc_no,
      },
      ip_address: user?.ip_address,
      user_agent: user?.user_agent,
    } as any);
  }

  async logBriefUpdated(brief: ProjectBrief, user?: any): Promise<void> {
    await this.activityLogModel.create({
      user_id: user?.id || null,
      user_email: user?.email || 'system',
      user_role: user?.role?.name || 'system',
      action: ActivityAction.BRIEF_UPDATED,
      entity_type: 'ProjectBrief',
      entity_id: brief.id,
      entity_label: brief.doc_no,
      changes: {
        project_id: brief.project_id,
        doc_no: brief.doc_no,
      },
      ip_address: user?.ip_address,
      user_agent: user?.user_agent,
    } as any);
  }

  async logBriefDeleted(
    docNo: string,
    briefId: string,
    user?: any,
  ): Promise<void> {
    await this.activityLogModel.create({
      user_id: user?.id || null,
      user_email: user?.email || 'system',
      user_role: user?.role?.name || 'system',
      action: ActivityAction.BRIEF_DELETED,
      entity_type: 'ProjectBrief',
      entity_id: briefId,
      entity_label: docNo,
      ip_address: user?.ip_address,
      user_agent: user?.user_agent,
    } as any);
  }
}
