import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { Task } from './models/task.model';
import { Project } from '../projects/models/projects.model';
import { User } from '@/modules/users/models/user.model';

import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

import { ActivityLogForTaskService } from '../engagement/services/activity-log-task.service';
import { NotificationForTaskService } from '../engagement/services/notification-task.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task)
    private readonly taskModel: typeof Task,

    @InjectModel(Project)
    private readonly projectModel: typeof Project,

    @InjectModel(User)
    private readonly userModel: typeof User,

    private readonly activityLogForTaskService: ActivityLogForTaskService,
    private readonly notificationForTaskService: NotificationForTaskService,
  ) {}

  async findAll() {
    return this.taskModel.findAll({
      include: [
        { model: Project, attributes: ['id', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
      ],
      order: [
        ['order_index', 'ASC'],
        ['due_date', 'ASC'],
      ],
    });
  }

  async findOne(id: string) {
    const task = await this.taskModel.findByPk(id, {
      include: [
        { model: Project, attributes: ['id', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
      ],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  // =========================
  // CREATE
  // =========================
  async create(createTaskDto: CreateTaskDto, actorId: string, user?: any) {
    if (createTaskDto.project_id) {
      const project = await this.projectModel.findByPk(
        createTaskDto.project_id,
      );
      if (!project) {
        throw new NotFoundException('Project not found');
      }
    }

    const task = await this.taskModel.create({
      title: createTaskDto.title,
      project_id: createTaskDto.project_id ?? null,
      created_by: actorId,
      priority: createTaskDto.priority ?? 'medium',
      status: createTaskDto.status ?? 'todo',
      due_date: createTaskDto.due_date
        ? new Date(createTaskDto.due_date)
        : null,
      workload_estimate_hours: createTaskDto.workload_estimate_hours ?? 0,
      order_index: 0,
      due_bucket: this.calculateDueBucket(createTaskDto.due_date),
    });

    const createdTask = await this.findOne(task.id);

    // === Activity Log & Notification ===
    await this.activityLogForTaskService.logTaskCreated(
      createdTask,
      actorId,
      user,
    );
    await this.notificationForTaskService.notifyTaskCreated(
      createdTask,
      actorId,
    );

    return createdTask;
  }

  // =========================
  // UPDATE
  // =========================
  async update(id: string, updateTaskDto: UpdateTaskDto, user?: any) {
    const task = await this.findOne(id);
    const oldStatus = task.status;

    await task.update({
      ...updateTaskDto,
      due_date:
        updateTaskDto.due_date !== undefined
          ? updateTaskDto.due_date
            ? new Date(updateTaskDto.due_date)
            : null
          : undefined,
    });

    if (updateTaskDto.due_date !== undefined) {
      task.due_bucket = this.calculateDueBucket(task.due_date);
      await task.save();
    }

    const updatedTask = await this.findOne(id);

    // === Activity Log & Notification ===
    await this.activityLogForTaskService.logTaskUpdated(updatedTask, user);
    await this.notificationForTaskService.notifyTaskUpdated(
      updatedTask,
      user?.id || updatedTask.created_by,
    );

    // Status Change Notification
    if (oldStatus !== updatedTask.status) {
      await this.activityLogForTaskService.logTaskStatusChanged(
        updatedTask,
        oldStatus,
        updatedTask.status,
        user,
      );
      await this.notificationForTaskService.notifyTaskStatusChanged(
        updatedTask,
        oldStatus,
        updatedTask.status,
        user?.id || updatedTask.created_by,
      );

      if (updatedTask.status === 'completed') {
        await this.activityLogForTaskService.logTaskCompleted(
          updatedTask,
          user,
        );
        await this.notificationForTaskService.notifyTaskCompleted(
          updatedTask,
          user?.id || updatedTask.created_by,
        );
      }
    }

    return updatedTask;
  }

  // =========================
  // TOGGLE STATUS
  // =========================
  async toggleStatus(id: string, user?: any) {
    const task = await this.findOne(id);
    const oldStatus = task.status;

    task.status = task.status === 'completed' ? 'todo' : 'completed';
    await task.save();

    const updatedTask = await this.findOne(id);

    // === Activity Log & Notification ===
    await this.activityLogForTaskService.logTaskStatusChanged(
      updatedTask,
      oldStatus,
      updatedTask.status,
      user,
    );
    await this.notificationForTaskService.notifyTaskStatusChanged(
      updatedTask,
      oldStatus,
      updatedTask.status,
      user?.id || updatedTask.created_by,
    );

    if (updatedTask.status === 'completed') {
      await this.activityLogForTaskService.logTaskCompleted(updatedTask, user);
      await this.notificationForTaskService.notifyTaskCompleted(
        updatedTask,
        user?.id || updatedTask.created_by,
      );
    }

    return updatedTask;
  }

  // =========================
  // DELETE
  // =========================
  async remove(id: string, user?: any) {
    const task = await this.findOne(id);
    const taskTitle = task.title;

    await task.destroy();

    // === Activity Log & Notification ===
    await this.activityLogForTaskService.logTaskDeleted(taskTitle, id, user);
    await this.notificationForTaskService.notifyTaskDeleted(
      taskTitle,
      user?.id || task.created_by,
    );

    return { deleted: true };
  }

  // =========================
  // QUERY METHODS
  // =========================
  async getMyTasks(userId: string) {
    return this.taskModel.findAll({
      where: { created_by: userId },
      include: [
        { model: Project, attributes: ['id', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
      ],
      order: [
        ['order_index', 'ASC'],
        ['due_date', 'ASC'],
      ],
    });
  }

  async getMyBoard(userId: string) {
    const tasks = await this.taskModel.findAll({
      where: { created_by: userId },
      include: [
        { model: Project, attributes: ['id', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
      ],
      order: [
        ['order_index', 'ASC'],
        ['due_date', 'ASC'],
      ],
    });

    return this.groupTasksIntoBoard(tasks);
  }

  async getBoard() {
    const tasks = await this.taskModel.findAll({
      include: [
        { model: Project, attributes: ['id', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
      ],
      order: [
        ['order_index', 'ASC'],
        ['due_date', 'ASC'],
      ],
    });

    return this.groupTasksIntoBoard(tasks);
  }

  private groupTasksIntoBoard(tasks: Task[]) {
    const board = {
      today: [] as Task[],
      this_week: [] as Task[],
      month: [] as Task[],
      year: [] as Task[],
    };

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    for (const task of tasks) {
      if (task.status === 'completed') continue;

      const dueDate = task.due_date ? new Date(task.due_date) : startOfToday;
      let bucket = task.due_bucket ?? this.calculateDueBucket(dueDate);

      if (dueDate < startOfToday) {
        bucket = 'today';
      }

      switch (bucket) {
        case 'today':
          board.today.push(task);
          break;
        case 'this_week':
          board.this_week.push(task);
          break;
        case 'month':
          board.month.push(task);
          break;
        case 'year':
          board.year.push(task);
          break;
        default:
          board.today.push(task);
      }
    }

    return board;
  }

  private calculateDueBucket(dueDate?: Date | string | null): string {
    if (!dueDate) return 'today';

    const date = new Date(dueDate);
    const now = new Date();

    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfDue = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );

    const diffTime = startOfDue.getTime() - startOfToday.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 'today';
    if (diffDays <= 7) return 'this_week';
    if (diffDays <= 30) return 'month';
    return 'year';
  }
}
