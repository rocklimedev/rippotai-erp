import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ActivityLog } from '../models/activity-log.model';
import { ActivityAction } from '@/common/enums';
import { Task } from '@/modules/tasks/models/task.model';
@Injectable()
export class ActivityLogForTaskService {
  constructor(
    @InjectModel(ActivityLog)
    private readonly activityLogModel: typeof ActivityLog,
  ) {}

  async logTaskCreated(task: Task, actorId: string, user?: any): Promise<void> {
    await this.activityLogModel.create({
      user_id: actorId || null,
      user_email: user?.email || 'system',
      user_role: user?.role?.name || 'system',
      action: ActivityAction.TASK_CREATED,
      entity_type: 'Task',
      entity_id: task.id,
      entity_label: task.title,
      changes: {
        project_id: task.project_id,
        priority: task.priority,
        status: task.status,
        due_date: task.due_date,
      },
      ip_address: user?.ip_address,
      user_agent: user?.user_agent,
    } as any);
  }

  async logTaskUpdated(task: Task, user?: any): Promise<void> {
    await this.activityLogModel.create({
      user_id: user?.id || null,
      user_email: user?.email || 'system',
      user_role: user?.role?.name || 'system',
      action: ActivityAction.TASK_UPDATED,
      entity_type: 'Task',
      entity_id: task.id,
      entity_label: task.title,
      changes: {
        title: task.title,
        status: task.status,
        priority: task.priority,
        due_date: task.due_date,
      },
      ip_address: user?.ip_address,
      user_agent: user?.user_agent,
    } as any);
  }

  async logTaskStatusChanged(
    task: Task,
    oldStatus: string,
    newStatus: string,
    user?: any,
  ): Promise<void> {
    await this.activityLogModel.create({
      user_id: user?.id || null,
      user_email: user?.email || 'system',
      user_role: user?.role?.name || 'system',
      action: ActivityAction.TASK_STATUS_CHANGED,
      entity_type: 'Task',
      entity_id: task.id,
      entity_label: task.title,
      changes: {
        from_status: oldStatus,
        to_status: newStatus,
      },
      ip_address: user?.ip_address,
      user_agent: user?.user_agent,
    } as any);
  }

  async logTaskCompleted(task: Task, user?: any): Promise<void> {
    await this.activityLogModel.create({
      user_id: user?.id || null,
      user_email: user?.email || 'system',
      user_role: user?.role?.name || 'system',
      action: ActivityAction.TASK_COMPLETED,
      entity_type: 'Task',
      entity_id: task.id,
      entity_label: task.title,
      changes: { status: 'completed' },
      ip_address: user?.ip_address,
      user_agent: user?.user_agent,
    } as any);
  }

  async logTaskDeleted(
    taskTitle: string,
    taskId: string,
    user?: any,
  ): Promise<void> {
    await this.activityLogModel.create({
      user_id: user?.id || null,
      user_email: user?.email || 'system',
      user_role: user?.role?.name || 'system',
      action: ActivityAction.TASK_DELETED,
      entity_type: 'Task',
      entity_id: taskId,
      entity_label: taskTitle,
      ip_address: user?.ip_address,
      user_agent: user?.user_agent,
    } as any);
  }
}
