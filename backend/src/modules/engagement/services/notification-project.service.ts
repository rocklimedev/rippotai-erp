import { Injectable } from '@nestjs/common';

import { NotificationBroadcastService } from '../notification-broadcast.service';
import { NotificationType } from '@/common/enums';
import { Project } from '@/modules/projects/models/projects.model';

@Injectable()
export class NotificationForProjectService {
  constructor(
    private readonly notificationBroadcastService: NotificationBroadcastService,
  ) {}

  async notifyProjectCreated(project: Project, actorId: string): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.PROJECT_CREATED,
      title: 'Project Created',
      message: `Project "${project.name}" has been created.`,
    });
  }

  async notifyProjectUpdated(project: Project, actorId: string): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.PROJECT_UPDATED,
      title: 'Project Updated',
      message: `Project "${project.name}" has been updated.`,
    });
  }

  async notifyProjectArchived(
    project: Project,
    actorId: string,
  ): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.PROJECT_ARCHIVED,
      title: 'Project Archived',
      message: `Project "${project.name}" has been archived.`,
    });
  }

  async notifyProjectRestored(
    project: Project,
    actorId: string,
  ): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.PROJECT_RESTORED,
      title: 'Project Restored',
      message: `Project "${project.name}" has been restored.`,
    });
  }

  async notifyProjectDeleted(
    projectName: string,
    actorId: string,
  ): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.PROJECT_DELETED,
      title: 'Project Deleted',
      message: `Project "${projectName}" has been deleted.`,
    });
  }
}
