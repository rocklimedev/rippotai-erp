import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Task } from './models/task.model';
import { Project } from '../projects/models/projects.model';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task)
    private readonly taskModel: typeof Task,

    @InjectModel(Project)
    private readonly projectModel: typeof Project,
  ) {}

  async findAll() {
    return this.taskModel.findAll({
      include: [
        {
          model: Project,
          attributes: ['id', 'name'],
        },
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
        {
          model: Project,
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async create(createTaskDto: CreateTaskDto) {
    return this.taskModel.create({
      title: createTaskDto.title,
      project_id: createTaskDto.project_id ?? null,
      priority: createTaskDto.priority ?? 'medium',
      status: createTaskDto.status ?? 'todo',
      due_date: createTaskDto.due_date
        ? new Date(createTaskDto.due_date)
        : null,
      workload_estimate_hours: createTaskDto.workload_estimate_hours ?? 0,
      order_index: 0,
      due_bucket: this.calculateDueBucket(createTaskDto.due_date),
    });
  }

  async update(id: string, updateTaskDto: UpdateTaskDto) {
    const task = await this.findOne(id);

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

    return task;
  }

  async remove(id: string) {
    const task = await this.findOne(id);
    await task.destroy();

    return {
      deleted: true,
    };
  }

  async toggleStatus(id: string) {
    const task = await this.findOne(id);

    task.status = task.status === 'completed' ? 'todo' : 'completed';

    await task.save();

    return task;
  }

  async getBoard() {
    const tasks = await this.taskModel.findAll({
      include: [
        {
          model: Project,
          attributes: ['id', 'name'],
        },
      ],
      order: [
        ['order_index', 'ASC'],
        ['due_date', 'ASC'],
      ],
    });

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
      if (task.status === 'completed') {
        continue;
      }

      const dueDate = task.due_date ? new Date(task.due_date) : startOfToday;

      let bucket = task.due_bucket ?? this.calculateDueBucket(dueDate);

      // Overdue tasks stay in Today
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
    if (!dueDate) {
      return 'today';
    }

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

    if (diffDays <= 0) {
      return 'today';
    }

    if (diffDays <= 7) {
      return 'this_week';
    }

    if (diffDays <= 30) {
      return 'month';
    }

    return 'year';
  }
}
