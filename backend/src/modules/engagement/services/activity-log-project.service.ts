import { Injectable } from '@nestjs/common';
import { ActivityLogsService } from '../activity-logs.service';
import { ActivityAction } from '@/common/enums';
import { Project } from '@/modules/projects/models/projects.model';

@Injectable()
export class ActivityLogForProjectService {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  /**
   * Project Created Event
   */
  async logProjectCreated(project: Project, userId?: string): Promise<void> {
    await this.activityLogsService.log({
      user_id: userId,
      action: ActivityAction.PROJECT_CREATED,
      entity_type: 'PROJECT',
      entity_id: project.id,
      metadata: {
        name: project.name,
        status: project.status,
      },
    } as any);
  }

  /**
   * Project Updated Event
   */
  async logProjectUpdated(
    project: Project,
    userId?: string,
    changes?: Record<string, any>,
  ): Promise<void> {
    await this.activityLogsService.log({
      user_id: userId,
      action: ActivityAction.PROJECT_UPDATED,
      entity_type: 'PROJECT',
      entity_id: project.id,
      metadata: {
        changes,
      },
    } as any);
  }

  /**
   * Project Archived Event
   */
  async logProjectArchived(project: Project, userId?: string): Promise<void> {
    await this.activityLogsService.log({
      user_id: userId,
      action: ActivityAction.PROJECT_ARCHIVED,
      entity_type: 'PROJECT',
      entity_id: project.id,
    } as any);
  }

  /**
   * Project Restored Event
   */
  async logProjectRestored(project: Project, userId?: string): Promise<void> {
    await this.activityLogsService.log({
      user_id: userId,
      action: ActivityAction.PROJECT_RESTORED,
      entity_type: 'PROJECT',
      entity_id: project.id,
    } as any);
  }

  /**
   * Project Deleted Event
   */
  async logProjectDeleted(projectId: string, userId?: string): Promise<void> {
    await this.activityLogsService.log({
      user_id: userId,
      action: ActivityAction.PROJECT_DELETED,
      entity_type: 'PROJECT',
      entity_id: projectId,
    } as any);
  }
}
