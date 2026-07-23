import { Injectable } from '@nestjs/common';
import { NotificationType } from '@/common/enums';
import { NotificationBroadcastService } from '../notification-broadcast.service';
import { Task } from '@/modules/tasks/models/task.model';
@Injectable()
export class NotificationForTaskService {
  constructor(
    private readonly notificationBroadcastService: NotificationBroadcastService,
  ) {}

  async notifyTaskCreated(task: Task, actorId: string): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.TASK_CREATED,
      title: 'New Task Created',
      message: `Task "${task.title}" has been created${task.project ? ` for project "${task.project.name}"` : ''}.`,
    });
  }

  async notifyTaskUpdated(task: Task, actorId: string): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.TASK_UPDATED,
      title: 'Task Updated',
      message: `Task "${task.title}" has been updated.`,
    });
  }

  async notifyTaskStatusChanged(
    task: Task,
    oldStatus: string,
    newStatus: string,
    actorId: string,
  ): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.TASK_STATUS_CHANGED,
      title: 'Task Status Changed',
      message: `Task "${task.title}" moved from ${oldStatus} to ${newStatus}.`,
    });
  }

  async notifyTaskCompleted(task: Task, actorId: string): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.TASK_COMPLETED,
      title: 'Task Completed',
      message: `Task "${task.title}" has been marked as completed.`,
    });
  }

  async notifyTaskDeleted(taskTitle: string, actorId: string): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.TASK_DELETED,
      title: 'Task Deleted',
      message: `Task "${taskTitle}" has been deleted.`,
    });
  }
}
