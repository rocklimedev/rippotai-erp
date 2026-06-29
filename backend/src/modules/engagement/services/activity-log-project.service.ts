import { Injectable } from '@nestjs/common';
import { ActivityLogsService } from '../activity-logs.service';
import { ActivityAction } from '@/common/enums';
import { Project } from '@/modules/projects/models/projects.model';

@Injectable()
export class ActivityLogForProjectService {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  // =========================
  // CREATED
  // =========================
  async logProjectCreated(project: Project, user?: any) {
    await this.activityLogsService.log({
      user_id: user?.id ?? null,
      user_email: user?.email,
      user_role: user?.role,
      action: ActivityAction.PROJECT_CREATED,
      entity_type: 'PROJECT',
      entity_id: project.id,
      changes: {
        name: project.name,
        status: project.status,
      },
    });
  }

  // =========================
  // UPDATED
  // =========================
  async logProjectUpdated(project: Project, user?: any, changes?: any) {
    await this.activityLogsService.log({
      user_id: user?.id ?? null,
      user_email: user?.email,
      user_role: user?.role,
      action: ActivityAction.PROJECT_UPDATED,
      entity_type: 'PROJECT',
      entity_id: project.id,
      changes: {
        updated_fields: changes,
      },
    });
  }

  // =========================
  // ARCHIVED
  // =========================
  async logProjectArchived(project: Project, user?: any) {
    await this.activityLogsService.log({
      user_id: user?.id ?? null,
      user_email: user?.email,
      user_role: user?.role,
      action: ActivityAction.PROJECT_ARCHIVED,
      entity_type: 'PROJECT',
      entity_id: project.id,
      changes: { archived: true },
    });
  }

  // =========================
  // RESTORED
  // =========================
  async logProjectRestored(project: Project, user?: any) {
    await this.activityLogsService.log({
      user_id: user?.id ?? null,
      user_email: user?.email,
      user_role: user?.role,
      action: ActivityAction.PROJECT_RESTORED,
      entity_type: 'PROJECT',
      entity_id: project.id,
      changes: { restored: true },
    });
  }

  // =========================
  // DELETED
  // =========================
  async logProjectDeleted(projectId: string, user?: any) {
    await this.activityLogsService.log({
      user_id: user?.id ?? null,
      user_email: user?.email,
      user_role: user?.role,
      action: ActivityAction.PROJECT_DELETED,
      entity_type: 'PROJECT',
      entity_id: projectId,
      changes: { deleted: true },
    });
  }
}
